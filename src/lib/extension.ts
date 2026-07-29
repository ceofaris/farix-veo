import { supabase } from "@/integrations/supabase/client";

export async function uploadExtensionZip(file: File, version: string): Promise<string> {
  const safe = version.replace(/[^a-zA-Z0-9._-]/g, "-");
  const path = `${safe}-${crypto.randomUUID()}.zip`;
  const { error } = await supabase.storage.from("extensions").upload(path, file, {
    upsert: false,
    contentType: file.type || "application/zip",
  });
  if (error) throw error;
  return path;
}

export async function signedExtensionUrl(path: string): Promise<string | null> {
  const { data } = await supabase.storage.from("extensions").createSignedUrl(path, 3600, {
    download: true,
  });
  return data?.signedUrl ?? null;
}
