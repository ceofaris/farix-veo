DROP FUNCTION IF EXISTS public.check_and_deduct_credits(uuid, integer);
NOTIFY pgrst, 'reload schema';