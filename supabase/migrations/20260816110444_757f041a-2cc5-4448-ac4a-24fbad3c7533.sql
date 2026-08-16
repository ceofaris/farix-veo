ALTER TABLE public.credit_usage ADD COLUMN IF NOT EXISTS reason text NOT NULL DEFAULT 'video_generation';

CREATE OR REPLACE FUNCTION public.check_and_deduct_credits(_user_id uuid, _cost integer, _reason text DEFAULT 'video_generation')
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _row public.user_tools%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL OR (auth.uid() <> _user_id AND NOT public.is_king(auth.uid())) THEN
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

  INSERT INTO public.credit_usage (user_id, user_tool_id, tool_id, amount, reason)
  VALUES (_user_id, _row.id, _row.tool_id, _cost, COALESCE(_reason, 'video_generation'));

  RETURN jsonb_build_object('ok', true, 'remaining', _row.credits, 'used', _row.credits_used);
END;
$function$;

REVOKE ALL ON FUNCTION public.check_and_deduct_credits(uuid, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_and_deduct_credits(uuid, integer, text) TO authenticated, service_role;

NOTIFY pgrst, 'reload schema';