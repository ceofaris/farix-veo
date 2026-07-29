ALTER TABLE public.profiles DROP COLUMN IF EXISTS credits;

DELETE FROM public.extension_versions WHERE tool_id IS NULL;

ALTER TABLE public.extension_versions ALTER COLUMN tool_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS extension_versions_tool_id_key ON public.extension_versions (tool_id);