import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Niche = {
  id: string;
  name: string;
  image_path: string | null;
  prompt_text: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
};

export const nichesQuery = queryOptions({
  queryKey: ["niches"],
  staleTime: 5 * 60 * 1000,
  queryFn: async (): Promise<Niche[]> => {
    const { data, error } = await supabase
      .from("niches")
      .select("id, name, image_path, prompt_text, sort_order, is_active, created_at")
      .order("sort_order")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Niche[];
  },
});

export async function uploadNicheImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("niche-images").upload(path, file, {
    upsert: false,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw error;
  return path;
}

export async function signedNicheUrl(path: string | null): Promise<string | null> {
  if (!path) return null;
  const { data } = await supabase.storage.from("niche-images").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

export async function removeNicheImage(path: string | null) {
  if (!path) return;
  await supabase.storage.from("niche-images").remove([path]);
}
