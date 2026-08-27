ALTER TABLE public.tool_accounts
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS expired_at timestamptz;

CREATE OR REPLACE FUNCTION public.tool_accounts_status_sync()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('active','expired') THEN
    RAISE EXCEPTION 'Invalid tool account status: %', NEW.status;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.cookie_data IS DISTINCT FROM OLD.cookie_data THEN
    NEW.status := 'active';
    NEW.expired_at := NULL;
  END IF;
  IF NEW.status = 'expired' AND NEW.expired_at IS NULL THEN
    NEW.expired_at := now();
  ELSIF NEW.status = 'active' THEN
    NEW.expired_at := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tool_accounts_status ON public.tool_accounts;
CREATE TRIGGER trg_tool_accounts_status
BEFORE INSERT OR UPDATE ON public.tool_accounts
FOR EACH ROW EXECUTE FUNCTION public.tool_accounts_status_sync();

CREATE OR REPLACE FUNCTION public.mark_tool_account_expired(p_tool_account_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid := auth.uid(); _slug text; _feature text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  SELECT t.slug INTO _slug
  FROM public.tool_accounts ta JOIN public.tools t ON t.id = ta.tool_id
  WHERE ta.id = p_tool_account_id;
  IF _slug IS NULL THEN RAISE EXCEPTION 'Invalid tool account'; END IF;
  _feature := CASE _slug WHEN 'chatgpt' THEN 'chatgpt' WHEN 'gemini' THEN 'gemini' ELSE 'veo' END;
  IF NOT (public.is_king(_uid) OR public.has_feature(_uid, _feature)) THEN
    RAISE EXCEPTION 'No active plan for this tool';
  END IF;
  UPDATE public.tool_accounts
     SET status = 'expired', expired_at = now()
   WHERE id = p_tool_account_id;
  DELETE FROM public.active_sessions
   WHERE user_id = _uid AND tool_account_id = p_tool_account_id;
  RETURN jsonb_build_object('ok', true, 'tool_account_id', p_tool_account_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_random_flow_account()
 RETURNS TABLE(id uuid, tool_id uuid, label text, cookie_data text, notes text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF NOT (public.has_feature(_uid, 'veo') OR public.is_king(_uid)) THEN
    RAISE EXCEPTION 'No active plan with Veo 3 access';
  END IF;
  RETURN QUERY
  SELECT ta.id, ta.tool_id, ta.label, ta.cookie_data, ta.notes
  FROM public.tool_accounts ta
  JOIN public.tools t ON t.id = ta.tool_id
  WHERE t.slug = 'veo-3' AND ta.is_active AND ta.status = 'active'
  ORDER BY random() LIMIT 1;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_random_chatgpt_account()
 RETURNS TABLE(id uuid, tool_id uuid, label text, cookie_data text, notes text)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF NOT (public.has_feature(_uid, 'chatgpt') OR public.is_king(_uid)) THEN
    RAISE EXCEPTION 'No active plan with ChatGPT access';
  END IF;
  RETURN QUERY
  SELECT ta.id, ta.tool_id, ta.label, ta.cookie_data, ta.notes
  FROM public.tool_accounts ta
  JOIN public.tools t ON t.id = ta.tool_id
  WHERE t.slug = 'chatgpt' AND ta.is_active AND ta.status = 'active'
  ORDER BY random() LIMIT 1;
END;
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
  WHERE t.slug = 'gemini' AND ta.is_active AND ta.status = 'active'
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
  WHERE ta.id = p_tool_account_id AND ta.is_active AND ta.status = 'active';
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