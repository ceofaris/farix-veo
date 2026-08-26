import { zipSync, strToU8 } from "fflate";

/** Dev-only sources of the Farix extensions, embedded at build time. */
const veoModules = import.meta.glob("/extension-dev/**/*", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const chatgptModules = import.meta.glob("/extension-dev-chatgpt/**/*", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

const multiModules = import.meta.glob("/extension-dev-multi/**/*", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;


const geminiModules = import.meta.glob("/extension-dev-gemini/**/*", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

export type DevFile = { path: string; content: string; bytes: number };

function toFiles(modules: Record<string, string>, prefix: string): DevFile[] {
  return Object.entries(modules)
    .map(([full, content]) => ({
      path: full.replace(prefix, ""),
      content,
      bytes: new TextEncoder().encode(content).length,
    }))
    .sort((a, b) => a.path.localeCompare(b.path));
}

export const devExtensionFiles: DevFile[] = toFiles(veoModules, "/extension-dev/");
export const devChatgptExtensionFiles: DevFile[] = toFiles(
  chatgptModules,
  "/extension-dev-chatgpt/",
);
export const devMultiExtensionFiles: DevFile[] = toFiles(
  multiModules,
  "/extension-dev-multi/",
);

export const devGeminiExtensionFiles: DevFile[] = toFiles(
  geminiModules,
  "/extension-dev-gemini/",
);

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64.replace(/\s+/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export function buildZipBlob(files: DevFile[]): Blob {
  const entries: Record<string, Uint8Array> = {};
  for (const f of files) {
    if (f.path.endsWith(".base64")) {
      const path = f.path.slice(0, -".base64".length);
      entries[path] = base64ToBytes(f.content);
    } else {
      entries[f.path] = strToU8(f.content);
    }
  }
  const zipped = zipSync(entries, { level: 6 });
  return new Blob([zipped as unknown as BlobPart], { type: "application/zip" });
}

export function buildDevZipBlob(): Blob {
  return buildZipBlob(devExtensionFiles);
}

export function downloadZip(files: DevFile[], filename: string) {
  const url = URL.createObjectURL(buildZipBlob(files));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadDevZip() {
  downloadZip(devExtensionFiles, "farix-veo-extension-dev.zip");
}

export function downloadChatgptDevZip() {
  downloadZip(devChatgptExtensionFiles, "farix-chatgpt-extension-dev.zip");
}

export function downloadMultiDevZip() {
  downloadZip(devMultiExtensionFiles, "farix-multi-extension-dev.zip");
}

export function downloadGeminiDevZip() {
  downloadZip(devGeminiExtensionFiles, "farix-gemini-extension-dev.zip");
}
