DROP TABLE IF EXISTS public.credit_usage;

DROP FUNCTION IF EXISTS public.check_and_deduct_credits(uuid, integer, text);
DROP FUNCTION IF EXISTS public.check_and_deduct_credits(uuid, integer);
DROP FUNCTION IF EXISTS public.add_credits(uuid, integer);
DROP FUNCTION IF EXISTS public.set_credits(uuid, integer);
DROP FUNCTION IF EXISTS public.can_manage_credits(uuid, uuid);

ALTER TABLE public.user_tools
  DROP COLUMN IF EXISTS credits,
  DROP COLUMN IF EXISTS total_credits,
  DROP COLUMN IF EXISTS credits_used;