
-- 1) Profile columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS trial_used boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS signup_source text NOT NULL DEFAULT 'invite';

DO $$ BEGIN
  ALTER TABLE public.profiles ADD CONSTRAINT profiles_status_check CHECK (status IN ('active','suspended'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Lifetime trial ledger (one trial per email, forever)
CREATE TABLE IF NOT EXISTS public.trial_emails (
  email text PRIMARY KEY,
  used_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.trial_emails TO authenticated;
GRANT ALL ON public.trial_emails TO service_role;
ALTER TABLE public.trial_emails ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "trial_emails king read" ON public.trial_emails;
CREATE POLICY "trial_emails king read" ON public.trial_emails
  FOR SELECT TO authenticated USING (public.is_king(auth.uid()));

-- 3) Login IP tracking
CREATE TABLE IF NOT EXISTS public.user_login_ips (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  ip text NOT NULL,
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, ip)
);
GRANT SELECT ON public.user_login_ips TO authenticated;
GRANT ALL ON public.user_login_ips TO service_role;
ALTER TABLE public.user_login_ips ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "login ips self read" ON public.user_login_ips;
CREATE POLICY "login ips self read" ON public.user_login_ips
  FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_king(auth.uid()));

-- 4) Protect privileged profile columns from self-service edits
CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF public.is_king(auth.uid()) OR auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;
  IF NEW.id = auth.uid() THEN
    NEW.trial_ends_at := OLD.trial_ends_at;
    NEW.trial_used    := OLD.trial_used;
    NEW.status        := OLD.status;
    NEW.signup_source := OLD.signup_source;
    NEW.expires_at    := OLD.expires_at;
    NEW.is_active     := OLD.is_active;
    NEW.role          := OLD.role;
    NEW.created_by    := OLD.created_by;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS protect_profile_privileges ON public.profiles;
CREATE TRIGGER protect_profile_privileges
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileges();

-- 5) New public signups get a one-time 1 hour trial
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _invited boolean := (NEW.raw_user_meta_data->>'role') IS NOT NULL;
  _email text := lower(NEW.email);
  _already boolean := false;
  _trial_ends timestamptz := NULL;
  _used boolean := false;
BEGIN
  IF NOT _invited THEN
    SELECT EXISTS (SELECT 1 FROM public.trial_emails te WHERE te.email = _email) INTO _already;
    IF NOT _already THEN
      _trial_ends := now() + interval '1 hour';
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
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user',
    _trial_ends,
    _used,
    CASE WHEN _invited THEN 'invite' ELSE 'public' END
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

-- 6) Access checks respect suspension + trial
CREATE OR REPLACE FUNCTION public.has_feature(_user_id uuid, _feature text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- suspended accounts have no access at all
    NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = _user_id AND p.status = 'suspended')
    AND (
      EXISTS (
        SELECT 1 FROM public.user_plans up
        JOIN public.profiles p ON p.id = up.user_id
        WHERE up.user_id = _user_id
          AND p.is_active
          AND up.expires_at > now()
          AND (
            CASE _feature
              WHEN 'veo' THEN up.plan IN ('pro','master')
              WHEN 'chatgpt' THEN up.plan IN ('master')
              WHEN 'gemini' THEN up.plan IN ('master')
              ELSE true
            END
          )
      )
      OR (
        -- active free trial unlocks Veo 3 only
        _feature = 'veo'
        AND EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = _user_id AND p.is_active
            AND p.trial_ends_at IS NOT NULL AND p.trial_ends_at > now()
        )
      )
    )
$$;

-- 7) Record login IP; suspend beyond 3 distinct IPs
CREATE OR REPLACE FUNCTION public.record_login_ip(p_ip text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid := auth.uid(); _count int; _status text;
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  IF p_ip IS NULL OR length(trim(p_ip)) = 0 THEN
    SELECT status INTO _status FROM public.profiles WHERE id = _uid;
    RETURN jsonb_build_object('ok', true, 'status', _status, 'ips', 0);
  END IF;

  INSERT INTO public.user_login_ips (user_id, ip)
  VALUES (_uid, p_ip)
  ON CONFLICT (user_id, ip) DO UPDATE SET last_seen = now();

  SELECT count(*) INTO _count FROM public.user_login_ips WHERE user_id = _uid;

  IF _count > 3 AND NOT public.is_king(_uid) AND NOT public.is_reseller(_uid) THEN
    UPDATE public.profiles SET status = 'suspended' WHERE id = _uid AND status <> 'suspended';
  END IF;

  SELECT status INTO _status FROM public.profiles WHERE id = _uid;
  RETURN jsonb_build_object('ok', true, 'status', _status, 'ips', _count);
END; $$;

REVOKE ALL ON FUNCTION public.record_login_ip(text) FROM public;
GRANT EXECUTE ON FUNCTION public.record_login_ip(text) TO authenticated;
