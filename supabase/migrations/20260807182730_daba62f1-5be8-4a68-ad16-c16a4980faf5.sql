UPDATE public.tools SET slug = 'chatgpt', domain = 'chatgpt.com' WHERE slug = 'chat-gpt-uzy7';
UPDATE public.tools SET slug = 'veo-3', domain = 'labs.google' WHERE slug = 'veo-3-mjku';
DELETE FROM public.tools WHERE slug NOT IN ('chatgpt','veo-3');
ALTER TABLE public.tools DROP COLUMN IF EXISTS logo_url;
CREATE UNIQUE INDEX IF NOT EXISTS tools_slug_key ON public.tools (slug);