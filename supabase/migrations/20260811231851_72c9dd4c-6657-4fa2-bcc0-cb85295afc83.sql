REVOKE EXECUTE ON FUNCTION public.check_and_deduct_credits(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.add_credits(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.set_credits(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_manage_credits(uuid, uuid) FROM PUBLIC, anon;