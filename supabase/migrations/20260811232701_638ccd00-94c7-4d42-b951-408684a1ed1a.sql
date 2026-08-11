REVOKE EXECUTE ON FUNCTION public.check_and_deduct_credits(uuid, integer) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.can_manage_credits(uuid, uuid) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_deduct_credits(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.can_manage_credits(uuid, uuid) TO service_role;