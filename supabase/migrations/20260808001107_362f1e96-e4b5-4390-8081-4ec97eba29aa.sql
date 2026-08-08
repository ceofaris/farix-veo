ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS paid_amount numeric(12,2),
  ADD COLUMN IF NOT EXISTS paid_at timestamptz;