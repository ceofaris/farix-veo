ALTER TABLE public.user_tools
  ADD COLUMN IF NOT EXISTS credits integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_credits integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credits_used integer NOT NULL DEFAULT 0;

UPDATE public.user_tools ut
SET credits = 45000, total_credits = 45000
FROM public.tools t
WHERE t.id = ut.tool_id AND t.slug = 'veo-3' AND ut.total_credits = 0;

CREATE TABLE IF NOT EXISTS public.credit_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user_tool_id uuid REFERENCES public.user_tools(id) ON DELETE CASCADE,
  tool_id uuid NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS credit_usage_user_created_idx ON public.credit_usage (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS credit_usage_created_idx ON public.credit_usage (created_at DESC);

GRANT SELECT ON public.credit_usage TO authenticated;
GRANT ALL ON public.credit_usage TO service_role;

ALTER TABLE public.credit_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_usage self read" ON public.credit_usage
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "credit_usage king read" ON public.credit_usage
  FOR SELECT TO authenticated USING (public.is_king(auth.uid()));

CREATE POLICY "credit_usage reseller read" ON public.credit_usage
  FOR SELECT TO authenticated USING (
    public.is_reseller(auth.uid())
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = credit_usage.user_id AND p.created_by = auth.uid())
  );

CREATE OR REPLACE FUNCTION public.check_and_deduct_credits(_user_id uuid, _cost integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.user_tools%ROWTYPE;
BEGIN
  IF _cost IS NULL OR _cost <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_cost');
  END IF;

  SELECT ut.* INTO _row
  FROM public.user_tools ut
  JOIN public.tools t ON t.id = ut.tool_id
  WHERE ut.user_id = _user_id AND t.slug = 'veo-3'
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'no_access');
  END IF;

  IF _row.credits < _cost THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'insufficient_credits', 'remaining', _row.credits);
  END IF;

  UPDATE public.user_tools
  SET credits = credits - _cost,
      credits_used = credits_used + _cost,
      updated_at = now()
  WHERE id = _row.id
  RETURNING * INTO _row;

  INSERT INTO public.credit_usage (user_id, user_tool_id, tool_id, amount)
  VALUES (_user_id, _row.id, _row.tool_id, _cost);

  RETURN jsonb_build_object('ok', true, 'remaining', _row.credits, 'used', _row.credits_used);
END;
$$;

CREATE OR REPLACE FUNCTION public.can_manage_credits(_actor uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_king(_actor)
     OR (public.is_reseller(_actor)
         AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _user_id AND p.created_by = _actor));
$$;

CREATE OR REPLACE FUNCTION public.add_credits(_user_id uuid, _amount integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.user_tools%ROWTYPE;
BEGIN
  IF NOT public.can_manage_credits(auth.uid(), _user_id) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF _amount IS NULL OR _amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  UPDATE public.user_tools ut
  SET credits = ut.credits + _amount,
      total_credits = ut.total_credits + _amount,
      updated_at = now()
  FROM public.tools t
  WHERE t.id = ut.tool_id AND t.slug = 'veo-3' AND ut.user_id = _user_id
  RETURNING ut.* INTO _row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User has no Veo 3 access';
  END IF;

  RETURN jsonb_build_object('ok', true, 'credits', _row.credits, 'total_credits', _row.total_credits);
END;
$$;

CREATE OR REPLACE FUNCTION public.set_credits(_user_id uuid, _amount integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.user_tools%ROWTYPE;
BEGIN
  IF NOT public.can_manage_credits(auth.uid(), _user_id) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF _amount IS NULL OR _amount < 0 THEN
    RAISE EXCEPTION 'Amount must be zero or more';
  END IF;

  UPDATE public.user_tools ut
  SET credits = _amount,
      total_credits = GREATEST(ut.credits_used + _amount, ut.total_credits),
      updated_at = now()
  FROM public.tools t
  WHERE t.id = ut.tool_id AND t.slug = 'veo-3' AND ut.user_id = _user_id
  RETURNING ut.* INTO _row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User has no Veo 3 access';
  END IF;

  RETURN jsonb_build_object('ok', true, 'credits', _row.credits, 'total_credits', _row.total_credits);
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_and_deduct_credits(uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.add_credits(uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_credits(uuid, integer) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_credits(uuid, uuid) TO authenticated, service_role;