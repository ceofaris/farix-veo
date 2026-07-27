
-- Roles enum-like via text with check
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('king','reseller','user')),
  credits integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  logo_url text,
  domain text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tools TO authenticated;
GRANT ALL ON public.tools TO service_role;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.tool_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_id uuid NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  label text,
  cookie_data text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  notes text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tool_accounts TO authenticated;
GRANT ALL ON public.tool_accounts TO service_role;
ALTER TABLE public.tool_accounts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.reseller_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reseller_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tool_id uuid NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (reseller_id, tool_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reseller_tools TO authenticated;
GRANT ALL ON public.reseller_tools TO service_role;
ALTER TABLE public.reseller_tools ENABLE ROW LEVEL SECURITY;

-- Security definer role helper (avoids recursion)
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.is_king(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND role = 'king')
$$;

CREATE OR REPLACE FUNCTION public.is_reseller(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND role = 'reseller')
$$;

-- updated_at trigger fn
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_tools_updated BEFORE UPDATE ON public.tools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_tool_accounts_updated BEFORE UPDATE ON public.tool_accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS POLICIES

-- profiles
CREATE POLICY "profiles self read" ON public.profiles FOR SELECT
  TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles king read all" ON public.profiles FOR SELECT
  TO authenticated USING (public.is_king(auth.uid()));
CREATE POLICY "profiles reseller read own users" ON public.profiles FOR SELECT
  TO authenticated USING (public.is_reseller(auth.uid()) AND created_by = auth.uid());
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE
  TO authenticated USING (id = auth.uid());
CREATE POLICY "profiles king manage" ON public.profiles FOR ALL
  TO authenticated USING (public.is_king(auth.uid())) WITH CHECK (public.is_king(auth.uid()));
CREATE POLICY "profiles reseller update own users" ON public.profiles FOR UPDATE
  TO authenticated USING (public.is_reseller(auth.uid()) AND created_by = auth.uid())
  WITH CHECK (public.is_reseller(auth.uid()) AND created_by = auth.uid() AND role = 'user');
CREATE POLICY "profiles reseller delete own users" ON public.profiles FOR DELETE
  TO authenticated USING (public.is_reseller(auth.uid()) AND created_by = auth.uid());

-- tools
CREATE POLICY "tools authenticated read" ON public.tools FOR SELECT
  TO authenticated USING (true);
CREATE POLICY "tools king manage" ON public.tools FOR ALL
  TO authenticated USING (public.is_king(auth.uid())) WITH CHECK (public.is_king(auth.uid()));

-- tool_accounts
CREATE POLICY "tool_accounts king manage" ON public.tool_accounts FOR ALL
  TO authenticated USING (public.is_king(auth.uid())) WITH CHECK (public.is_king(auth.uid()));
CREATE POLICY "tool_accounts reseller read assigned" ON public.tool_accounts FOR SELECT
  TO authenticated USING (
    public.is_reseller(auth.uid())
    AND EXISTS (SELECT 1 FROM public.reseller_tools rt WHERE rt.tool_id = tool_accounts.tool_id AND rt.reseller_id = auth.uid())
  );
CREATE POLICY "tool_accounts reseller insert assigned" ON public.tool_accounts FOR INSERT
  TO authenticated WITH CHECK (
    public.is_reseller(auth.uid())
    AND EXISTS (SELECT 1 FROM public.reseller_tools rt WHERE rt.tool_id = tool_accounts.tool_id AND rt.reseller_id = auth.uid())
  );
CREATE POLICY "tool_accounts reseller update assigned" ON public.tool_accounts FOR UPDATE
  TO authenticated USING (
    public.is_reseller(auth.uid())
    AND EXISTS (SELECT 1 FROM public.reseller_tools rt WHERE rt.tool_id = tool_accounts.tool_id AND rt.reseller_id = auth.uid())
  ) WITH CHECK (
    public.is_reseller(auth.uid())
    AND EXISTS (SELECT 1 FROM public.reseller_tools rt WHERE rt.tool_id = tool_accounts.tool_id AND rt.reseller_id = auth.uid())
  );
CREATE POLICY "tool_accounts reseller delete assigned" ON public.tool_accounts FOR DELETE
  TO authenticated USING (
    public.is_reseller(auth.uid())
    AND EXISTS (SELECT 1 FROM public.reseller_tools rt WHERE rt.tool_id = tool_accounts.tool_id AND rt.reseller_id = auth.uid())
  );

-- reseller_tools
CREATE POLICY "reseller_tools king manage" ON public.reseller_tools FOR ALL
  TO authenticated USING (public.is_king(auth.uid())) WITH CHECK (public.is_king(auth.uid()));
CREATE POLICY "reseller_tools reseller read own" ON public.reseller_tools FOR SELECT
  TO authenticated USING (reseller_id = auth.uid());

-- Storage bucket policies for tool-logos (bucket created separately via tool)
CREATE POLICY "tool-logos public read" ON storage.objects FOR SELECT
  USING (bucket_id = 'tool-logos');
CREATE POLICY "tool-logos king write" ON storage.objects FOR INSERT
  TO authenticated WITH CHECK (bucket_id = 'tool-logos' AND public.is_king(auth.uid()));
CREATE POLICY "tool-logos king update" ON storage.objects FOR UPDATE
  TO authenticated USING (bucket_id = 'tool-logos' AND public.is_king(auth.uid()));
CREATE POLICY "tool-logos king delete" ON storage.objects FOR DELETE
  TO authenticated USING (bucket_id = 'tool-logos' AND public.is_king(auth.uid()));
