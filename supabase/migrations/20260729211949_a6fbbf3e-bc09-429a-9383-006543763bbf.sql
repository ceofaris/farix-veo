-- 1. Paid / Unpaid status
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_paid boolean NOT NULL DEFAULT false;

-- 2. Per-tool extensions
ALTER TABLE public.extension_versions ADD COLUMN IF NOT EXISTS tool_id uuid REFERENCES public.tools(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS extension_versions_tool_id_idx ON public.extension_versions(tool_id);

-- 3. User tool assignments
CREATE TABLE IF NOT EXISTS public.user_tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tool_id uuid NOT NULL REFERENCES public.tools(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, tool_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_tools TO authenticated;
GRANT ALL ON public.user_tools TO service_role;

ALTER TABLE public.user_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_tools king manage" ON public.user_tools
  FOR ALL TO authenticated
  USING (public.is_king(auth.uid()))
  WITH CHECK (public.is_king(auth.uid()));

CREATE POLICY "user_tools self read" ON public.user_tools
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "user_tools reseller read own users" ON public.user_tools
  FOR SELECT TO authenticated
  USING (
    public.is_reseller(auth.uid())
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_tools.user_id AND p.created_by = auth.uid())
  );

CREATE POLICY "user_tools reseller insert own users" ON public.user_tools
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_reseller(auth.uid())
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_tools.user_id AND p.created_by = auth.uid())
    AND EXISTS (SELECT 1 FROM public.reseller_tools rt WHERE rt.tool_id = user_tools.tool_id AND rt.reseller_id = auth.uid())
  );

CREATE POLICY "user_tools reseller delete own users" ON public.user_tools
  FOR DELETE TO authenticated
  USING (
    public.is_reseller(auth.uid())
    AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = user_tools.user_id AND p.created_by = auth.uid())
  );

CREATE INDEX IF NOT EXISTS user_tools_user_id_idx ON public.user_tools(user_id);
CREATE INDEX IF NOT EXISTS user_tools_tool_id_idx ON public.user_tools(tool_id);