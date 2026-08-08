ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS is_paid,
  DROP COLUMN IF EXISTS paid_amount,
  DROP COLUMN IF EXISTS paid_at;

DROP FUNCTION IF EXISTS public.get_user_role(uuid);