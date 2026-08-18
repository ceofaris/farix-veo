CREATE OR REPLACE FUNCTION public.get_random_chatgpt_account()
RETURNS TABLE(id uuid, tool_id uuid, label text, cookie_data text, notes text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _has_access boolean;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.user_tools ut
    JOIN public.tools t ON t.id = ut.tool_id
    JOIN public.profiles p ON p.id = ut.user_id
    WHERE ut.user_id = _uid
      AND t.slug = 'chatgpt'
      AND t.is_active
      AND p.is_active
      AND ut.expires_at > now()
  ) INTO _has_access;

  IF NOT (_has_access OR public.is_king(_uid)) THEN
    RAISE EXCEPTION 'No active ChatGPT access';
  END IF;

  RETURN QUERY
  SELECT ta.id, ta.tool_id, ta.label, ta.cookie_data, ta.notes
  FROM public.tool_accounts ta
  JOIN public.tools t ON t.id = ta.tool_id
  WHERE t.slug = 'chatgpt' AND ta.is_active
  ORDER BY random()
  LIMIT 1;
END;
$$;

REVOKE ALL ON FUNCTION public.get_random_chatgpt_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_random_chatgpt_account() TO authenticated;