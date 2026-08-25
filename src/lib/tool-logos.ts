import chatgptAsset from "@/assets/logo-chatgpt.png.asset.json";
import flowAsset from "@/assets/logo-flow-wordmark.png.asset.json";

export type BuiltInLogo = { url: string; bleed?: boolean };

/**
 * Built-in, hard-coded logos for the platform's fixed tools.
 * Matching is done on slug/name so it never depends on DB logo_url.
 */
const BUILT_IN: Array<{ match: RegExp; logo: BuiltInLogo }> = [
  { match: /chat\s*-?\s*gpt/i, logo: { url: chatgptAsset.url } },
  { match: /veo|flow/i, logo: { url: flowAsset.url, bleed: true } },
];

export function builtInToolLogoInfo(tool: { name?: string | null; slug?: string | null }): BuiltInLogo | null {
  const key = `${tool.slug ?? ""} ${tool.name ?? ""}`;
  return BUILT_IN.find((e) => e.match.test(key))?.logo ?? null;
}

export function builtInToolLogo(tool: { name?: string | null; slug?: string | null }): string | null {
  return builtInToolLogoInfo(tool)?.url ?? null;
}

export const flowLogoUrl = flowAsset.url;
