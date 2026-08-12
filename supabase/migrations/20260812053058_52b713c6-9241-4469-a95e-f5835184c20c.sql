CREATE TABLE IF NOT EXISTS public.active_sessions (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  tool_account_id uuid REFERENCES public.tool_accounts(id) ON DELETE SET NULL,
  tool_slug text NOT NULL DEFAULT 'veo-3',
  started_at timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.active_sessions TO authenticated;
GRANT ALL ON public.active_sessions TO service_role;

ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "active_sessions self read" ON public.active_sessions;
CREATE POLICY "active_sessions self read" ON public.active_sessions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

DROP POLICY IF EXISTS "active_sessions king read" ON public.active_sessions;
CREATE POLICY "active_sessions king read" ON public.active_sessions
  FOR SELECT TO authenticated USING (public.is_king(auth.uid()));

DROP POLICY IF EXISTS "active_sessions reseller read" ON public.active_sessions;
CREATE POLICY "active_sessions reseller read" ON public.active_sessions
  FOR SELECT TO authenticated USING (
    public.is_reseller(auth.uid()) AND EXISTS (
      SELECT 1 FROM public.profiles p WHERE p.id = active_sessions.user_id AND p.created_by = auth.uid()
    )
  );

DROP TRIGGER IF EXISTS trg_active_sessions_updated ON public.active_sessions;
CREATE TRIGGER trg_active_sessions_updated BEFORE UPDATE ON public.active_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.set_active_session(p_tool_account_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _uid uuid := auth.uid();
  _slug text;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT t.slug INTO _slug
  FROM public.tool_accounts ta
  JOIN public.tools t ON t.id = ta.tool_id
  WHERE ta.id = p_tool_account_id AND ta.is_active;

  IF _slug IS NULL THEN
    RAISE EXCEPTION 'Invalid or inactive tool account';
  END IF;

  IF NOT (public.is_king(_uid) OR EXISTS (
    SELECT 1 FROM public.user_tools ut
    JOIN public.tools t ON t.id = ut.tool_id
    JOIN public.profiles p ON p.id = ut.user_id
    WHERE ut.user_id = _uid AND t.slug = _slug AND t.is_active AND p.is_active AND ut.expires_at > now()
  )) THEN
    RAISE EXCEPTION 'No active access for this tool';
  END IF;

  INSERT INTO public.active_sessions (user_id, tool_account_id, tool_slug, started_at, last_seen)
  VALUES (_uid, p_tool_account_id, _slug, now(), now())
  ON CONFLICT (user_id) DO UPDATE
    SET tool_account_id = EXCLUDED.tool_account_id,
        tool_slug = EXCLUDED.tool_slug,
        started_at = now(),
        last_seen = now(),
        updated_at = now();

  RETURN jsonb_build_object('ok', true, 'tool_account_id', p_tool_account_id, 'tool_slug', _slug);
END;
$$;

REVOKE ALL ON FUNCTION public.set_active_session(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_active_session(uuid) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';