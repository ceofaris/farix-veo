ALTER TABLE public.user_tools
  ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS paid_amount numeric,
  ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days'),
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone NOT NULL DEFAULT now();

UPDATE public.user_tools ut
SET is_paid = p.is_paid,
    paid_amount = p.paid_amount,
    paid_at = p.paid_at,
    expires_at = COALESCE(p.expires_at, ut.expires_at)
FROM public.profiles p
WHERE p.id = ut.user_id AND ut.is_paid = false AND p.is_paid = true;

UPDATE public.user_tools ut
SET expires_at = COALESCE(p.expires_at, ut.expires_at)
FROM public.profiles p
WHERE p.id = ut.user_id;

DROP TRIGGER IF EXISTS trg_user_tools_updated ON public.user_tools;
CREATE TRIGGER trg_user_tools_updated
BEFORE UPDATE ON public.user_tools
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();