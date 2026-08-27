CREATE TABLE public.investments (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  amount numeric not null default 0,
  spent_on date not null default (now() at time zone 'Asia/Karachi')::date,
  note text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.investments TO authenticated;
GRANT ALL ON public.investments TO service_role;

ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Kings manage investments" ON public.investments
  FOR ALL TO authenticated
  USING (public.is_king(auth.uid()))
  WITH CHECK (public.is_king(auth.uid()));

CREATE INDEX investments_spent_on_idx ON public.investments (spent_on DESC);