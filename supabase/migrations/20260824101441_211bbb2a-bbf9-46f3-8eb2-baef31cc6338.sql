CREATE OR REPLACE FUNCTION public.get_random_flow_account()
 RETURNS TABLE(id uuid, tool_id uuid, label text, cookie_data text, notes text)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF NOT (public.has_active_master(_uid) OR public.is_king(_uid)) THEN
    RAISE EXCEPTION 'No active Master plan';
  END IF;
  RETURN QUERY
  SELECT ta.id, ta.tool_id, ta.label, ta.cookie_data, ta.notes
  FROM public.tool_accounts ta
  JOIN public.tools t ON t.id = ta.tool_id
  WHERE t.slug = 'veo-3' AND ta.is_active
  ORDER BY random() LIMIT 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_random_chatgpt_account()
 RETURNS TABLE(id uuid, tool_id uuid, label text, cookie_data text, notes text)
 LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF NOT (public.has_active_master(_uid) OR public.is_king(_uid)) THEN
    RAISE EXCEPTION 'No active Master plan';
  END IF;
  RETURN QUERY
  SELECT ta.id, ta.tool_id, ta.label, ta.cookie_data, ta.notes
  FROM public.tool_accounts ta
  JOIN public.tools t ON t.id = ta.tool_id
  WHERE t.slug = 'chatgpt' AND ta.is_active
  ORDER BY random() LIMIT 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_active_session(p_tool_account_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE _uid uuid := auth.uid(); _slug text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  SELECT t.slug INTO _slug
  FROM public.tool_accounts ta JOIN public.tools t ON t.id = ta.tool_id
  WHERE ta.id = p_tool_account_id AND ta.is_active;
  IF _slug IS NULL THEN RAISE EXCEPTION 'Invalid or inactive tool account'; END IF;
  IF NOT (public.is_king(_uid) OR public.has_active_master(_uid)) THEN
    RAISE EXCEPTION 'No active Master plan';
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