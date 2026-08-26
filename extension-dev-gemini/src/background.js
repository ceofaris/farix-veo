import {
  GEMINI_COOKIE_DOMAINS,
  GEMINI_COOKIE_URLS
} from "./config.js";
import {
  callRpc,
  clearSession,
  getConfig,
  getValidSession,
  saveConfig,
  signIn,
  signOut
} from "./supabase.js";

const ACCOUNT_KEY = "farix_active_gemini_account";
const COOKIE_LIMIT = 150;

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({ farix_extension_version: "1.0.0" });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  handleMessage(message)
    .then((data) => sendResponse({ ok: true, ...data }))
    .catch((error) => sendResponse({ ok: false, error: error.message || "Something went wrong" }));
  return true;
});

async function handleMessage(message) {
  switch (message?.type) {
    case "getState":
      return { state: await getState() };
    case "saveConfig":
      await saveConfig(message.config || {});
      return { state: await getState() };
    case "login":
      await signIn(String(message.email || "").trim(), String(message.password || ""));
      return { state: await getState() };
    case "logout":
      await clearGeminiCookies();
      await clearRemoteActiveSession();
      await signOut();
      await chrome.storage.local.remove(ACCOUNT_KEY);
      return { state: await getState() };
    case "inject":
      return { state: await injectSession() };
    case "clear":
      await clearGeminiCookies();
      await clearRemoteActiveSession();
      await clearSession();
      await chrome.storage.local.remove(ACCOUNT_KEY);
      return { state: await getState() };
    default:
      throw new Error("Unknown extension action");
  }
}

async function getState() {
  const session = await getValidSession();
  const stored = await chrome.storage.local.get(ACCOUNT_KEY);
  const config = await getConfig();
  return {
    signedIn: Boolean(session?.access_token),
    email: session?.user?.email || "",
    configured: Boolean(
      config.supabaseUrl &&
      !config.supabaseUrl.includes("YOUR_PROJECT") &&
      config.supabaseAnonKey &&
      config.supabaseAnonKey !== "YOUR_SUPABASE_ANON_KEY"
    ),
    injected: Boolean(stored[ACCOUNT_KEY]),
    accountLabel: stored[ACCOUNT_KEY]?.label || stored[ACCOUNT_KEY]?.email || ""
  };
}

async function injectSession() {
  const config = await getConfig();
  const response = await callRpc(config.rpc.getRandomAccount, {
    tool_slug: "gemini"
  });
  const account = normalizeAccount(response);
  await clearGeminiCookies();
  await setCookies(account.cookies);
  await callRpc(config.rpc.setActiveSession, {
    tool_slug: "gemini",
    account_id: account.id,
    session_id: account.id
  });
  await chrome.storage.local.set({
    [ACCOUNT_KEY]: {
      id: account.id,
      label: account.label,
      email: account.email,
      tool_slug: "gemini"
    }
  });
  return getState();
}

async function clearRemoteActiveSession() {
  try {
    const config = await getConfig();
    const stored = await chrome.storage.local.get(ACCOUNT_KEY);
    if (stored[ACCOUNT_KEY]?.id) {
      await callRpc(config.rpc.clearActiveSession, {
        tool_slug: "gemini",
        account_id: stored[ACCOUNT_KEY].id,
        session_id: stored[ACCOUNT_KEY].id
      });
    }
  } catch {
    // Local cookie/session cleanup must still complete if the remote RPC is unavailable.
  }
}

function normalizeAccount(response) {
  const candidate = Array.isArray(response) ? response[0] : response?.account || response?.data || response;
  if (!candidate || typeof candidate !== "object") throw new Error("No Gemini session is available");
  const toolSlug = String(candidate.tool_slug || candidate.tool || candidate.product || "").toLowerCase();
  if (toolSlug && toolSlug !== "gemini") throw new Error("The returned session is not a Gemini session");
  const rawCookies = candidate.cookies || candidate.cookie_json || candidate.cookie_data;
  const cookies = typeof rawCookies === "string" ? JSON.parse(rawCookies) : rawCookies;
  if (!Array.isArray(cookies) || cookies.length === 0) throw new Error("The Gemini session has no cookies");
  const safeCookies = cookies.filter(isAllowedCookie).slice(0, COOKIE_LIMIT);
  if (!safeCookies.length) throw new Error("No Gemini-safe cookies were returned");
  if (!accountId(candidate)) throw new Error("The Gemini session has no account id");
  return {
    id: accountId(candidate),
    label: candidate.label || candidate.name || "",
    email: candidate.email || "",
    cookies: safeCookies
  };
}

function isAllowedCookie(cookie) {
  if (!cookie || typeof cookie !== "object" || !cookie.name || typeof cookie.value !== "string") return false;
  const domain = String(cookie.domain || cookie.host || "").toLowerCase().replace(/^\./, "");
  if (!domain) return false;
  return GEMINI_COOKIE_DOMAINS.includes(domain);
}

async function setCookies(cookies) {
  for (const cookie of cookies) {
    const domain = String(cookie.domain || cookie.host).replace(/^\./, "").toLowerCase();
    const url = `https://${domain}${cookie.path || "/"}`;
    const details = {
      url,
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain || cookie.host,
      path: cookie.path || "/",
      secure: cookie.secure !== false,
      httpOnly: Boolean(cookie.httpOnly),
      sameSite: normalizeSameSite(cookie.sameSite)
    };
    if (cookie.expirationDate && Number(cookie.expirationDate) > 0) {
      details.expirationDate = Number(cookie.expirationDate);
    }
    if (cookie.storeId) details.storeId = cookie.storeId;
    await chrome.cookies.set(details);
  }
}

function accountId(candidate) {
  return candidate.id || candidate.account_id || candidate.session_id || "";
}

async function clearGeminiCookies() {
  const seen = new Set();
  for (const baseUrl of GEMINI_COOKIE_URLS) {
    const cookies = await chrome.cookies.getAll({ url: baseUrl });
    for (const cookie of cookies) {
      const domain = String(cookie.domain || "").toLowerCase().replace(/^\./, "");
      if (!GEMINI_COOKIE_DOMAINS.includes(domain)) continue;
      const key = `${cookie.storeId || ""}:${domain}:${cookie.path}:${cookie.name}`;
      if (seen.has(key)) continue;
      seen.add(key);
      await chrome.cookies.remove({
        url: `https://${domain}${cookie.path || "/"}`,
        name: cookie.name,
        storeId: cookie.storeId
      });
    }
  }
}

function normalizeSameSite(value) {
  const normalized = String(value || "lax").toLowerCase();
  if (normalized === "no_restriction" || normalized === "none") return "no_restriction";
  if (normalized === "strict") return "strict";
  return "lax";
}