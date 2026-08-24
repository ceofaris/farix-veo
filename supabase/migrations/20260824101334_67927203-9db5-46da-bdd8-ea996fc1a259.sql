CREATE TABLE public.user_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan text NOT NULL DEFAULT 'master',
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  is_paid boolean NOT NULL DEFAULT false,
  paid_amount numeric,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_plans TO authenticated;
GRANT ALL ON public.user_plans TO service_role;

ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_plans king manage" ON public.user_plans FOR ALL TO authenticated
  USING (is_king(auth.uid())) WITH CHECK (is_king(auth.uid()));

CREATE POLICY "user_plans self read" ON public.user_plans FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_plans reseller read" ON public.user_plans FOR SELECT TO authenticated
  USING (is_reseller(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = user_plans.user_id AND p.created_by = auth.uid()));

CREATE POLICY "user_plans reseller insert" ON public.user_plans FOR INSERT TO authenticated
  WITH CHECK (is_reseller(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = user_plans.user_id AND p.created_by = auth.uid()));

CREATE POLICY "user_plans reseller update" ON public.user_plans FOR UPDATE TO authenticated
  USING (is_reseller(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = user_plans.user_id AND p.created_by = auth.uid()))
  WITH CHECK (is_reseller(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = user_plans.user_id AND p.created_by = auth.uid()));

CREATE POLICY "user_plans reseller delete" ON public.user_plans FOR DELETE TO authenticated
  USING (is_reseller(auth.uid()) AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = user_plans.user_id AND p.created_by = auth.uid()));

CREATE TRIGGER update_user_plans_updated_at BEFORE UPDATE ON public.user_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill Master plans from the old per-tool assignments
INSERT INTO public.user_plans (user_id, expires_at, is_paid, paid_amount, paid_at, created_at)
SELECT ut.user_id,
       MAX(ut.expires_at),
       bool_or(ut.is_paid),
       SUM(COALESCE(ut.paid_amount, 0)) FILTER (WHERE ut.is_paid),
       MAX(ut.paid_at),
       MIN(ut.created_at)
FROM public.user_tools ut
JOIN public.profiles p ON p.id = ut.user_id AND p.role = 'user'
GROUP BY ut.user_id
ON CONFLICT (user_id) DO NOTHING;

-- Any remaining end user without a plan row gets one from their profile expiry
INSERT INTO public.user_plans (user_id, expires_at)
SELECT p.id, COALESCE(p.expires_at, now() + interval '30 days')
FROM public.profiles p
WHERE p.role = 'user'
ON CONFLICT (user_id) DO NOTHING;

CREATE OR REPLACE FUNCTION public.has_active_master(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_plans up
    JOIN public.profiles p ON p.id = up.user_id
    WHERE up.user_id = _user_id
      AND p.is_active
      AND up.expires_at > now()
  )
$$;

-- Remove the old multi-tool permission complexity
DROP TABLE IF EXISTS public.user_tools;
DROP TABLE IF EXISTS public.reseller_tools;