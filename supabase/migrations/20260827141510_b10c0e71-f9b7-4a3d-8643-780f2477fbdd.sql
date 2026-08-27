ALTER TABLE public.reseller_plans DROP CONSTRAINT IF EXISTS reseller_plans_plan_check;
ALTER TABLE public.user_plans DROP CONSTRAINT IF EXISTS user_plans_plan_check;

UPDATE public.user_plans SET plan = 'pro', updated_at = now() WHERE plan = 'veo3_ultra';
UPDATE public.user_plans SET plan = 'master', updated_at = now() WHERE plan = 'chatgpt_premium';
UPDATE public.reseller_plans SET plan = 'pro' WHERE plan = 'veo3_ultra';
DELETE FROM public.reseller_plans a USING public.reseller_plans b WHERE a.plan = 'chatgpt_premium' AND b.reseller_id = a.reseller_id AND b.plan = 'master';
UPDATE public.reseller_plans SET plan = 'master' WHERE plan = 'chatgpt_premium';

ALTER TABLE public.reseller_plans ADD CONSTRAINT reseller_plans_plan_check CHECK (plan IN ('pro','master'));
ALTER TABLE public.user_plans ADD CONSTRAINT user_plans_plan_check CHECK (plan IN ('pro','master'));
ALTER TABLE public.user_plans ALTER COLUMN plan SET DEFAULT 'master';

CREATE OR REPLACE FUNCTION public.has_feature(_user_id uuid, _feature text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_plans up
    JOIN public.profiles p ON p.id = up.user_id
    WHERE up.user_id = _user_id
      AND p.is_active
      AND up.expires_at > now()
      AND (
        CASE _feature
          WHEN 'veo' THEN up.plan IN ('pro','master')
          WHEN 'chatgpt' THEN up.plan IN ('master')
          WHEN 'gemini' THEN up.plan IN ('master')
          ELSE true
        END
      )
  )
$function$;