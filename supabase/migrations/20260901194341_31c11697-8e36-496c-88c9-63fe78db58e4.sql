CREATE TABLE IF NOT EXISTS public.app_settings (
  id boolean PRIMARY KEY DEFAULT true,
  public_signup_enabled boolean NOT NULL DEFAULT true,
  google_only_signup boolean NOT NULL DEFAULT true,
  trial_minutes integer NOT NULL DEFAULT 60,
  max_login_ips integer NOT NULL DEFAULT 3,
  support_phone text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_settings_singleton CHECK (id)
);

GRANT SELECT ON public.app_settings TO anon;
GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_settings public read" ON public.app_settings;
CREATE POLICY "app_settings public read" ON public.app_settings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "app_settings king manage" ON public.app_settings;
CREATE POLICY "app_settings king manage" ON public.app_settings
  FOR ALL TO authenticated USING (public.is_king(auth.uid())) WITH CHECK (public.is_king(auth.uid()));

DROP TRIGGER IF EXISTS trg_app_settings_updated ON public.app_settings;
CREATE TRIGGER trg_app_settings_updated BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.app_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

-- Normalizes an email so alias tricks map to one identity.
CREATE OR REPLACE FUNCTION public.normalize_email(_email text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  e text := lower(trim(coalesce(_email, '')));
  local_part text;
  domain_part text;
BEGIN
  IF position('@' in e) = 0 THEN RETURN e; END IF;
  local_part := split_part(e, '@', 1);
  domain_part := split_part(e, '@', 2);
  local_part := split_part(local_part, '+', 1);
  IF domain_part IN ('gmail.com', 'googlemail.com') THEN
    local_part := replace(local_part, '.', '');
    domain_part := 'gmail.com';
  END IF;
  RETURN local_part || '@' || domain_part;
END;
$$;

-- Collapse any existing duplicate trial ledger rows onto normalized emails.
CREATE TABLE IF NOT EXISTS public.trial_emails_tmp AS
  SELECT public.normalize_email(email) AS email, min(used_at) AS used_at
  FROM public.trial_emails GROUP BY 1;
DELETE FROM public.trial_emails;
INSERT INTO public.trial_emails (email, used_at)
  SELECT email, used_at FROM public.trial_emails_tmp
  ON CONFLICT DO NOTHING;
DROP TABLE public.trial_emails_tmp;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invited boolean := (NEW.raw_user_meta_data->>'role') IS NOT NULL;
  _email text := public.normalize_email(NEW.email);
  _already boolean := false;
  _trial_ends timestamptz := NULL;
  _used boolean := false;
  _cfg public.app_settings%ROWTYPE;
  _provider text := coalesce(NEW.raw_app_meta_data->>'provider', '');
BEGIN
  SELECT * INTO _cfg FROM public.app_settings WHERE id LIMIT 1;

  IF NOT _invited THEN
    IF _cfg.public_signup_enabled IS FALSE THEN
      RAISE EXCEPTION 'Public signup is currently disabled';
    END IF;
    IF _cfg.google_only_signup IS TRUE AND _provider <> 'google' THEN
      RAISE EXCEPTION 'Only Google sign-up is allowed';
    END IF;

    SELECT EXISTS (SELECT 1 FROM public.trial_emails te WHERE te.email = _email) INTO _already;
    IF NOT _already THEN
      _trial_ends := now() + make_interval(mins => coalesce(_cfg.trial_minutes, 60));
      _used := true;
      INSERT INTO public.trial_emails (email) VALUES (_email) ON CONFLICT DO NOTHING;
    ELSE
      _used := true;
    END IF;
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, trial_ends_at, trial_used, signup_source)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    'user',
    _trial_ends,
    _used,
    CASE WHEN _invited THEN 'invite' ELSE 'public' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE OR REPLACE FUNCTION public.record_login_ip(p_ip text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid := auth.uid(); _count int; _status text; _max int;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  SELECT coalesce(max_login_ips, 3) INTO _max FROM public.app_settings WHERE id LIMIT 1;
  _max := coalesce(_max, 3);

  IF p_ip IS NULL OR length(trim(p_ip)) = 0 THEN
    SELECT status INTO _status FROM public.profiles WHERE id = _uid;
    RETURN jsonb_build_object('ok', true, 'status', _status, 'ips', 0);
  END IF;

  INSERT INTO public.user_login_ips (user_id, ip)
  VALUES (_uid, p_ip)
  ON CONFLICT (user_id, ip) DO UPDATE SET last_seen = now();

  SELECT count(*) INTO _count FROM public.user_login_ips WHERE user_id = _uid;

  IF _count > _max AND NOT public.is_king(_uid) AND NOT public.is_reseller(_uid) THEN
    UPDATE public.profiles SET status = 'suspended' WHERE id = _uid AND status <> 'suspended';
  END IF;

  SELECT status INTO _status FROM public.profiles WHERE id = _uid;
  RETURN jsonb_build_object('ok', true, 'status', _status, 'ips', _count);
END; $$;