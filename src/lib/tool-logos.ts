import chatgptAsset from "@/assets/logo-chatgpt.png.asset.json";
import veoAsset from "@/assets/logo-veo.png.asset.json";

/**
 * Built-in, hard-coded logos for the platform's fixed tools.
 * Matching is done on slug/name so it never depends on DB logo_url.
 */
const BUILT_IN: Array<{ match: RegExp; url: string }> = [
  { match: /chat\s*-?\s*gpt/i, url: chatgptAsset.url },
  { match: /veo/i, url: veoAsset.url },
];

export function builtInToolLogo(tool: { name?: string | null; slug?: string | null }): string | null {
  const key = `${tool.slug ?? ""} ${tool.name ?? ""}`;
  return BUILT_IN.find((e) => e.match.test(key))?.url ?? null;
}
