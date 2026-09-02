-- 1) Credits balance table
CREATE TABLE public.user_credits (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  credits integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_credits_non_negative CHECK (credits >= 0)
);

GRANT SELECT ON public.user_credits TO authenticated;
GRANT ALL ON public.user_credits TO service_role;

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_credits self read" ON public.user_credits
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "user_credits king read" ON public.user_credits
  FOR SELECT TO authenticated USING (public.is_king(auth.uid()));

CREATE POLICY "user_credits reseller read" ON public.user_credits
  FOR SELECT TO authenticated USING (
    public.is_reseller(auth.uid())
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_credits.user_id AND p.created_by = auth.uid())
  );

CREATE TRIGGER trg_user_credits_updated
  BEFORE UPDATE ON public.user_credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Ledger
CREATE TABLE public.credit_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  reason text NOT NULL,
  job_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.credit_ledger TO authenticated;
GRANT ALL ON public.credit_ledger TO service_role;

ALTER TABLE public.credit_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "credit_ledger self read" ON public.credit_ledger
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "credit_ledger king read" ON public.credit_ledger
  FOR SELECT TO authenticated USING (public.is_king(auth.uid()));

CREATE POLICY "credit_ledger reseller read" ON public.credit_ledger
  FOR SELECT TO authenticated USING (
    public.is_reseller(auth.uid())
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = credit_ledger.user_id AND p.created_by = auth.uid())
  );

CREATE INDEX credit_ledger_user_idx ON public.credit_ledger (user_id, created_at DESC);

-- Idempotency: one deduction per Veo video/job id, ever.
CREATE UNIQUE INDEX credit_ledger_veo_job_unique
  ON public.credit_ledger (job_id)
  WHERE reason = 'veo_success_deduct' AND job_id IS NOT NULL;

-- 3) Backfill balances for existing users
INSERT INTO public.user_credits (user_id, credits)
SELECT p.id,
       CASE WHEN EXISTS (SELECT 1 FROM public.user_plans up WHERE up.user_id = p.id AND up.is_paid)
            THEN 45000 ELSE 500 END
FROM public.profiles p
ON CONFLICT (user_id) DO NOTHING;

-- 4) Helpers
CREATE OR REPLACE FUNCTION public.get_credits(_user_id uuid)
RETURNS integer LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT credits FROM public.user_credits WHERE user_id = _user_id), 0)
$$;

-- Balance + gate check for the Veo extension (30 credits per video)
CREATE OR REPLACE FUNCTION public.veo_credit_status(p_expected_outputs integer DEFAULT 1)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _credits integer; _needed integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  _credits := public.get_credits(_uid);
  _needed := 30 * GREATEST(COALESCE(p_expected_outputs, 1), 1);
  RETURN jsonb_build_object(
    'credits', _credits,
    'cost_per_video', 30,
    'needed', _needed,
    'allowed', _credits >= 30,
    'allowed_outputs', _credits / 30
  );
END; $$;

-- Charge 30 credits for one successfully completed Veo video. Idempotent per job id.
CREATE OR REPLACE FUNCTION public.veo_charge_success(p_job_id text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _key text; _inserted integer; _credits integer;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF p_job_id IS NULL OR length(trim(p_job_id)) = 0 THEN
    RAISE EXCEPTION 'A job/video id is required';
  END IF;
  _key := _uid::text || ':' || trim(p_job_id);

  INSERT INTO public.user_credits (user_id, credits)
  VALUES (_uid, 0) ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.credit_ledger (user_id, amount, reason, job_id)
  VALUES (_uid, -30, 'veo_success_deduct', _key)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS _inserted = ROW_COUNT;

  IF _inserted = 0 THEN
    RETURN jsonb_build_object('ok', true, 'charged', false, 'duplicate', true,
                              'credits', public.get_credits(_uid));
  END IF;

  UPDATE public.user_credits
     SET credits = GREATEST(credits - 30, 0)
   WHERE user_id = _uid
  RETURNING credits INTO _credits;

  RETURN jsonb_build_object('ok', true, 'charged', true, 'duplicate', false, 'credits', _credits);
END; $$;

-- King: set an absolute balance
CREATE OR REPLACE FUNCTION public.set_user_credits(p_user_id uuid, p_credits integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _credits integer;
BEGIN
  IF _uid IS NULL OR NOT public.is_king(_uid) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF p_credits IS NULL OR p_credits < 0 THEN RAISE EXCEPTION 'Credits must be zero or more'; END IF;
  INSERT INTO public.user_credits (user_id, credits) VALUES (p_user_id, p_credits)
  ON CONFLICT (user_id) DO UPDATE SET credits = EXCLUDED.credits
  RETURNING credits INTO _credits;
  INSERT INTO public.credit_ledger (user_id, amount, reason, job_id)
  VALUES (p_user_id, p_credits, 'admin_set', NULL);
  RETURN jsonb_build_object('ok', true, 'credits', _credits);
END; $$;

-- King: add or subtract credits
CREATE OR REPLACE FUNCTION public.adjust_user_credits(p_user_id uuid, p_delta integer)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _credits integer;
BEGIN
  IF _uid IS NULL OR NOT public.is_king(_uid) THEN RAISE EXCEPTION 'Forbidden'; END IF;
  IF COALESCE(p_delta, 0) = 0 THEN RAISE EXCEPTION 'Amount is required'; END IF;
  INSERT INTO public.user_credits (user_id, credits) VALUES (p_user_id, GREATEST(p_delta, 0))
  ON CONFLICT (user_id) DO UPDATE SET credits = GREATEST(public.user_credits.credits + p_delta, 0)
  RETURNING credits INTO _credits;
  INSERT INTO public.credit_ledger (user_id, amount, reason, job_id)
  VALUES (p_user_id, p_delta, 'admin_adjust', NULL);
  RETURN jsonb_build_object('ok', true, 'credits', _credits);
END; $$;