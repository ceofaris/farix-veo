INSERT INTO public.tools (name, slug, domain, is_active)
SELECT 'Gemini Pro', 'gemini', 'gemini.google.com', true
WHERE NOT EXISTS (SELECT 1 FROM public.tools WHERE slug = 'gemini');

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
          WHEN 'veo' THEN up.plan IN ('veo3_ultra','master')
          WHEN 'chatgpt' THEN up.plan IN ('chatgpt_premium','master')
          WHEN 'gemini' THEN up.plan IN ('master')
          ELSE true
        END
      )
  )
$function$;

CREATE OR REPLACE FUNCTION public.get_random_gemini_account()
 RETURNS TABLE(id uuid, tool_id uuid, label text, cookie_data text, notes text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF NOT (public.has_feature(_uid, 'gemini') OR public.is_king(_uid)) THEN
    RAISE EXCEPTION 'No active plan with Gemini access';
  END IF;
  RETURN QUERY
  SELECT ta.id, ta.tool_id, ta.label, ta.cookie_data, ta.notes
  FROM public.tool_accounts ta
  JOIN public.tools t ON t.id = ta.tool_id
  WHERE t.slug = 'gemini' AND ta.is_active
  ORDER BY random() LIMIT 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_active_session(p_tool_account_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _uid uuid := auth.uid(); _slug text; _feature text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  SELECT t.slug INTO _slug
  FROM public.tool_accounts ta JOIN public.tools t ON t.id = ta.tool_id
  WHERE ta.id = p_tool_account_id AND ta.is_active;
  IF _slug IS NULL THEN RAISE EXCEPTION 'Invalid or inactive tool account'; END IF;
  _feature := CASE _slug WHEN 'chatgpt' THEN 'chatgpt' WHEN 'gemini' THEN 'gemini' ELSE 'veo' END;
  IF NOT (public.is_king(_uid) OR public.has_feature(_uid, _feature)) THEN
    RAISE EXCEPTION 'No active plan for this tool';
  END IF;
  INSERT INTO public.active_sessions (user_id, tool_account_id, tool_slug, started_at, last_seen)
  VALUES (_uid, p_tool_account_id, _slug, now(), now())
  ON CONFLICT (user_id) DO UPDATE
    SET tool_account_id = EXCLUDED.tool_account_id,
        tool_slug = EXCLUDED.tool_slug,
        started_at = now(), last_seen = now(), updated_at = now();
  RETURN jsonb_build_object('ok', true, 'tool_account_id', p_tool_account_id, 'tool_slug', _slug);
END;
$function$;

CREATE OR REPLACE FUNCTION public.clear_active_session()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  DELETE FROM public.active_sessions WHERE user_id = _uid;
  RETURN jsonb_build_object('ok', true);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_random_gemini_account() TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_active_session() TO authenticated;