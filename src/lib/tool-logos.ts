import chatgptAsset from "@/assets/logo-chatgpt.png.asset.json";
import flowAsset from "@/assets/logo-flow-wordmark.png.asset.json";
import geminiAsset from "@/assets/logo-gemini.png.asset.json";
import { assetUrl } from "@/lib/asset-url";

export type BuiltInLogo = { url: string; bleed?: boolean; container?: string };

/**
 * Built-in, hard-coded logos for the platform's fixed tools.
 * Matching is done on slug/name so it never depends on DB logo_url.
 */
const BUILT_IN: Array<{ match: RegExp; logo: BuiltInLogo }> = [
  { match: /chat\s*-?\s*gpt/i, logo: { url: assetUrl(chatgptAsset) } },
  { match: /gemini/i, logo: { url: assetUrl(geminiAsset) } },
  { match: /veo|flow/i, logo: { url: assetUrl(flowAsset), bleed: false, container: "bg-black" } },
];

export function builtInToolLogoInfo(tool: { name?: string | null; slug?: string | null }): BuiltInLogo | null {
  const key = `${tool.slug ?? ""} ${tool.name ?? ""}`;
  return BUILT_IN.find((e) => e.match.test(key))?.logo ?? null;
}

export function builtInToolLogo(tool: { name?: string | null; slug?: string | null }): string | null {
  return builtInToolLogoInfo(tool)?.url ?? null;
}

export const flowLogoUrl = assetUrl(flowAsset);
export const geminiLogoUrl = assetUrl(geminiAsset);
