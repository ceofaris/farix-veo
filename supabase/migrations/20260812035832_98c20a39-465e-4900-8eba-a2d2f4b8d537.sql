-- 1) Random active Veo 3 cookie account for authorized users
CREATE OR REPLACE FUNCTION public.get_random_flow_account()
RETURNS TABLE (
  id uuid,
  tool_id uuid,
  label text,
  cookie_data text,
  notes text
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _has_access boolean;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.user_tools ut
    JOIN public.tools t ON t.id = ut.tool_id
    JOIN public.profiles p ON p.id = ut.user_id
    WHERE ut.user_id = _uid
      AND t.slug = 'veo-3'
      AND t.is_active
      AND p.is_active
      AND ut.expires_at > now()
  ) INTO _has_access;

  IF NOT (_has_access OR public.is_king(_uid)) THEN
    RAISE EXCEPTION 'No active Veo 3 access';
  END IF;

  RETURN QUERY
  SELECT ta.id, ta.tool_id, ta.label, ta.cookie_data, ta.notes
  FROM public.tool_accounts ta
  JOIN public.tools t ON t.id = ta.tool_id
  WHERE t.slug = 'veo-3' AND ta.is_active
  ORDER BY random()
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_random_flow_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_random_flow_account() TO authenticated, service_role;

-- 2) Allow signed-in users to deduct only their own credits
CREATE OR REPLACE FUNCTION public.check_and_deduct_credits(_user_id uuid, _cost integer)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _row public.user_tools%ROWTYPE;
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid() <> _user_id AND NOT public.is_king(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  IF _cost IS NULL OR _cost <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_cost');
  END IF;

  SELECT ut.* INTO _row
  FROM public.user_tools ut
  JOIN public.tools t ON t.id = ut.tool_id
  WHERE ut.user_id = _user_id AND t.slug = 'veo-3'
  FOR UPDATE OF ut;

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

REVOKE ALL ON FUNCTION public.check_and_deduct_credits(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_and_deduct_credits(uuid, integer) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';