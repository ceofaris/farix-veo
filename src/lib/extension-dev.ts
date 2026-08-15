import { zipSync, strToU8 } from "fflate";

/** Dev-only source of the Veo extension, embedded at build time from /extension-dev. */
const modules = import.meta.glob("/extension-dev/**/*", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export type DevFile = { path: string; content: string; bytes: number };

export const devExtensionFiles: DevFile[] = Object.entries(modules)
  .map(([full, content]) => ({
    path: full.replace("/extension-dev/", ""),
    content,
    bytes: new TextEncoder().encode(content).length,
  }))
  .sort((a, b) => a.path.localeCompare(b.path));

export function buildDevZipBlob(): Blob {
  const entries: Record<string, Uint8Array> = {};
  for (const f of devExtensionFiles) entries[f.path] = strToU8(f.content);
  const zipped = zipSync(entries, { level: 6 });
  return new Blob([zipped as unknown as BlobPart], { type: "application/zip" });
}

export function downloadDevZip() {
  const url = URL.createObjectURL(buildDevZipBlob());
  const a = document.createElement("a");
  a.href = url;
  a.download = "farix-veo-extension-dev.zip";
  a.click();
  URL.revokeObjectURL(url);
}
