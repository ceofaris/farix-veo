-- 1) Profile creation must NEVER trust client-supplied role metadata.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

-- 2) Constrain role values.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_allowed;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_allowed CHECK (role IN ('user','reseller','king'));

-- 3) Block privilege-sensitive column changes from any non-king JWT caller.
CREATE OR REPLACE FUNCTION public.guard_profile_privileges()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     OR NEW.is_active IS DISTINCT FROM OLD.is_active
     OR NEW.expires_at IS DISTINCT FROM OLD.expires_at
     OR NEW.created_by IS DISTINCT FROM OLD.created_by
  THEN
    -- uid IS NULL => trusted server-side/service-role context.
    IF uid IS NOT NULL AND NOT public.is_king(uid) THEN
      RAISE EXCEPTION 'Not allowed to modify privileged profile fields';
    END IF;
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS guard_profile_privileges_trg ON public.profiles;
CREATE TRIGGER guard_profile_privileges_trg
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_privileges();

-- 4) Tighten the self-update RLS policy with an explicit WITH CHECK.
DROP POLICY IF EXISTS "profiles self update" ON public.profiles;
CREATE POLICY "profiles self update" ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());
