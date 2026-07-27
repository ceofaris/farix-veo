
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_king(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_reseller(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_king(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_reseller(uuid) TO authenticated;
