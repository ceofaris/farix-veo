/*
 * Farix website bridge.
 * Runs ONLY on the Farix production/preview site (see manifest matches).
 * Reads the Supabase session the website already stores in localStorage and
 * hands it to the extension background so the popup auto-logs-in.
 *
 * Security notes:
 * - Never reads or forwards anything except the Supabase auth session object.
 * - Never talks to page scripts (no window.postMessage listeners), so other
 *   sites cannot fake a session.
 * - The background double-checks sender.origin before trusting the payload.
 */
(() => {
  "use strict";

  const STORAGE_KEY_PATTERN = /^sb-[a-z0-9-]+-auth-token$/i;
  let lastFingerprint = null;

  function readSession() {
    let raw = null;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && STORAGE_KEY_PATTERN.test(key)) {
          raw = localStorage.getItem(key);
          break;
        }
      }
    } catch {
      return null;
    }
    if (!raw) return null;

    let parsed = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
    const session = parsed?.currentSession || parsed?.session || parsed;
    if (!session?.access_token || !session?.user?.id) return null;

    return {
      access_token: session.access_token,
      refresh_token: session.refresh_token || null,
      expires_at: session.expires_at || null,
      user: { id: session.user.id, email: session.user.email || "" }
    };
  }

  function push() {
    if (!chrome.runtime?.id) return;
    const session = readSession();
    const fingerprint = session ? `${session.user.id}:${session.access_token.slice(-24)}` : "none";
    if (fingerprint === lastFingerprint) return;
    lastFingerprint = fingerprint;

    chrome.runtime.sendMessage(
      session ? { type: "WEB_SESSION", session } : { type: "WEB_SESSION_CLEARED" },
      () => void chrome.runtime.lastError
    );
  }

  push();
  window.addEventListener("storage", push);
  window.addEventListener("focus", push);
  window.setInterval(push, 10_000);
})();
