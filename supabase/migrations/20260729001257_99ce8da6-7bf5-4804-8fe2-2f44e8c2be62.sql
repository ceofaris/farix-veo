CREATE TABLE public.extension_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  notes text,
  file_path text NOT NULL,
  file_size bigint,
  is_latest boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.extension_versions TO authenticated;
GRANT ALL ON public.extension_versions TO service_role;

ALTER TABLE public.extension_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "extension_versions king manage" ON public.extension_versions
  FOR ALL TO authenticated USING (public.is_king(auth.uid())) WITH CHECK (public.is_king(auth.uid()));

CREATE POLICY "extension_versions authenticated read" ON public.extension_versions
  FOR SELECT TO authenticated USING (true);

CREATE TRIGGER update_extension_versions_updated_at
  BEFORE UPDATE ON public.extension_versions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE UNIQUE INDEX extension_versions_one_latest ON public.extension_versions (is_latest) WHERE is_latest;