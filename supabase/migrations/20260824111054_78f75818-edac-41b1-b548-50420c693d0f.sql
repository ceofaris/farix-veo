-- 1. Plan types on user_plans
ALTER TABLE public.user_plans
  ADD CONSTRAINT user_plans_plan_check CHECK (plan IN ('veo3_ultra','chatgpt_premium','master'));

-- 2. Reseller allowed plans
CREATE TABLE public.reseller_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan text NOT NULL CHECK (plan IN ('veo3_ultra','chatgpt_premium','master')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reseller_id, plan)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reseller_plans TO authenticated;
GRANT ALL ON public.reseller_plans TO service_role;
ALTER TABLE public.reseller_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reseller_plans king manage" ON public.reseller_plans FOR ALL TO authenticated
  USING (public.is_king(auth.uid())) WITH CHECK (public.is_king(auth.uid()));
CREATE POLICY "reseller_plans self read" ON public.reseller_plans FOR SELECT TO authenticated
  USING (reseller_id = auth.uid());

INSERT INTO public.reseller_plans (reseller_id, plan)
SELECT p.id, x.plan
FROM public.profiles p
CROSS JOIN (VALUES ('veo3_ultra'),('chatgpt_premium'),('master')) AS x(plan)
WHERE p.role = 'reseller'
ON CONFLICT DO NOTHING;

-- 3. Niche prompts (global content managed by the king)
CREATE TABLE public.niches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  image_path text,
  prompt_text text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.niches TO authenticated;
GRANT ALL ON public.niches TO service_role;
ALTER TABLE public.niches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "niches authenticated read" ON public.niches FOR SELECT TO authenticated USING (true);
CREATE POLICY "niches king manage" ON public.niches FOR ALL TO authenticated
  USING (public.is_king(auth.uid())) WITH CHECK (public.is_king(auth.uid()));
CREATE TRIGGER trg_niches_updated BEFORE UPDATE ON public.niches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Feature access helper
CREATE OR REPLACE FUNCTION public.has_feature(_user_id uuid, _feature text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_plans up
    JOIN public.profiles p ON p.id = up.user_id
    WHERE up.user_id = _user_id
      AND p.is_active
      AND up.expires_at > now()
      AND (
        CASE _feature
          WHEN 'veo' THEN up.plan IN ('veo3_ultra','master')
          WHEN 'chatgpt' THEN up.plan IN ('chatgpt_premium','master')
          ELSE true
        END
      )
  )
$$;

-- 5. Gate the cookie RPCs by feature instead of "master only"
CREATE OR REPLACE FUNCTION public.get_random_flow_account()
RETURNS TABLE(id uuid, tool_id uuid, label text, cookie_data text, notes text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF NOT (public.has_feature(_uid, 'veo') OR public.is_king(_uid)) THEN
    RAISE EXCEPTION 'No active plan with Veo 3 access';
  END IF;
  RETURN QUERY
  SELECT ta.id, ta.tool_id, ta.label, ta.cookie_data, ta.notes
  FROM public.tool_accounts ta
  JOIN public.tools t ON t.id = ta.tool_id
  WHERE t.slug = 'veo-3' AND ta.is_active
  ORDER BY random() LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_random_chatgpt_account()
RETURNS TABLE(id uuid, tool_id uuid, label text, cookie_data text, notes text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF NOT (public.has_feature(_uid, 'chatgpt') OR public.is_king(_uid)) THEN
    RAISE EXCEPTION 'No active plan with ChatGPT access';
  END IF;
  RETURN QUERY
  SELECT ta.id, ta.tool_id, ta.label, ta.cookie_data, ta.notes
  FROM public.tool_accounts ta
  JOIN public.tools t ON t.id = ta.tool_id
  WHERE t.slug = 'chatgpt' AND ta.is_active
  ORDER BY random() LIMIT 1;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_active_session(p_tool_account_id uuid)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _uid uuid := auth.uid(); _slug text; _feature text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  SELECT t.slug INTO _slug
  FROM public.tool_accounts ta JOIN public.tools t ON t.id = ta.tool_id
  WHERE ta.id = p_tool_account_id AND ta.is_active;
  IF _slug IS NULL THEN RAISE EXCEPTION 'Invalid or inactive tool account'; END IF;
  _feature := CASE WHEN _slug = 'chatgpt' THEN 'chatgpt' ELSE 'veo' END;
  IF NOT (public.is_king(_uid) OR public.has_feature(_uid, _feature)) THEN
    RAISE EXCEPTION 'No active plan for this tool';
  END IF;
  INSERT INTO public.active_sessions (user_id, tool_account_id, tool_slug, started_at, last_seen)
  VALUES (_uid, p_tool_account_id, _slug, now(), now())
  ON CONFLICT (user_id) DO UPDATE
    SET tool_account_id = EXCLUDED.tool_account_id,
        tool_slug = EXCLUDED.tool_slug,
        started_at = now(), last_seen = now(), updated_at = now();
  RETURN jsonb_build_object('ok', true, 'tool_account_id', p_tool_account_id, 'tool_slug', _slug);
END;
$$;