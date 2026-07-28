import { supabase } from "@/integrations/supabase/client";

export async function uploadToolLogo(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("tool-logos").upload(path, file, {
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  return path;
}

export async function signedLogoUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from("tool-logos").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}
