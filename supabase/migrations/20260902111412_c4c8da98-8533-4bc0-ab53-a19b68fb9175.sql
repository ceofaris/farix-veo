CREATE OR REPLACE FUNCTION public.veo_charge_success(p_job_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _uid uuid := auth.uid(); _key text; _inserted integer; _credits integer; _current integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF p_job_id IS NULL OR length(trim(p_job_id)) = 0 THEN
    RAISE EXCEPTION 'A job/video id is required';
  END IF;
  _key := _uid::text || ':' || trim(p_job_id);

  INSERT INTO public.user_credits (user_id, credits)
  VALUES (_uid, 0) ON CONFLICT (user_id) DO NOTHING;

  SELECT credits INTO _current FROM public.user_credits WHERE user_id = _uid FOR UPDATE;

  IF COALESCE(_current, 0) < 30 THEN
    RETURN jsonb_build_object('ok', true, 'charged', false, 'duplicate', false,
                              'insufficient', true, 'credits', COALESCE(_current, 0));
  END IF;

  INSERT INTO public.credit_ledger (user_id, amount, reason, job_id)
  VALUES (_uid, -30, 'veo_success_deduct', _key)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS _inserted = ROW_COUNT;

  IF _inserted = 0 THEN
    RETURN jsonb_build_object('ok', true, 'charged', false, 'duplicate', true,
                              'credits', _current);
  END IF;

  UPDATE public.user_credits
     SET credits = GREATEST(credits - 30, 0)
   WHERE user_id = _uid
  RETURNING credits INTO _credits;

  RETURN jsonb_build_object('ok', true, 'charged', true, 'duplicate', false, 'credits', _credits);
END; $function$;

REVOKE EXECUTE ON FUNCTION public.veo_charge_success(text) FROM anon;