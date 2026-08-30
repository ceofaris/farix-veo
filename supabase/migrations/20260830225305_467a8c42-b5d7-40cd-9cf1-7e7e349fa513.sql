CREATE TABLE public.blogs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  excerpt text,
  meta_title text,
  meta_description text,
  keywords text,
  cover_image_url text,
  status text NOT NULL DEFAULT 'draft',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX blogs_slug_idx ON public.blogs (slug);
CREATE INDEX blogs_status_created_idx ON public.blogs (status, created_at DESC);

GRANT SELECT ON public.blogs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blogs TO authenticated;
GRANT ALL ON public.blogs TO service_role;

ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blogs public read published" ON public.blogs
FOR SELECT TO anon, authenticated
USING (status = 'published');

CREATE POLICY "blogs king manage" ON public.blogs
FOR ALL TO authenticated
USING (is_king(auth.uid()))
WITH CHECK (is_king(auth.uid()));

CREATE TRIGGER update_blogs_updated_at
BEFORE UPDATE ON public.blogs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.blogs_status_guard()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.status NOT IN ('draft', 'published') THEN
    RAISE EXCEPTION 'invalid blog status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER blogs_status_guard_trg
BEFORE INSERT OR UPDATE ON public.blogs
FOR EACH ROW EXECUTE FUNCTION public.blogs_status_guard();