/**
 * Lovable CDN assets are served from the `/__l5e/assets-v1/*` path, which only
 * exists on Lovable-hosted origins. When the app is deployed elsewhere
 * (workers.dev, farixai.com, etc.) those relative paths 404 and every image /
 * video renders broken. Resolving them against the stable Lovable origin keeps
 * media working on every deployment target.
 */
export const ASSET_CDN_ORIGIN = "https://farixai.lovable.app";

export function assetUrl(pointer: { url: string } | string): string {
  const url = typeof pointer === "string" ? pointer : pointer.url;
  if (/^https?:\/\//i.test(url)) return url;
  return `${ASSET_CDN_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
}
