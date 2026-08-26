import { DEFAULT_CONFIG } from "./config.js";

const CONFIG_KEY = "farix_supabase_config";
const SESSION_KEY = "farix_supabase_session";

export async function getConfig() {
  const stored = await chrome.storage.local.get(CONFIG_KEY);
  const value = stored[CONFIG_KEY];
  return {
    ...DEFAULT_CONFIG,
    ...(value && typeof value === "object" ? value : {}),
    rpc: {
      ...DEFAULT_CONFIG.rpc,
      ...(value && typeof value === "object" && value.rpc ? value.rpc : {})
    }
  };
}

export async function saveConfig(nextConfig) {
  const config = {
    ...DEFAULT_CONFIG,
    ...nextConfig,
    supabaseUrl: String(nextConfig.supabaseUrl || "").trim().replace(/\/+$/, ""),
    supabaseAnonKey: String(nextConfig.supabaseAnonKey || "").trim(),
    toolSlug: "gemini"
  };
  await chrome.storage.local.set({ [CONFIG_KEY]: config });
  return config;
}

export async function getSession() {
  const stored = await chrome.storage.local.get(SESSION_KEY);
  return stored[SESSION_KEY] || null;
}

export async function saveSession(session) {
  await chrome.storage.local.set({ [SESSION_KEY]: session });
  return session;
}

export async function clearSession() {
  await chrome.storage.local.remove(SESSION_KEY);
}

function assertConfigured(config) {
  if (
    !config.supabaseUrl ||
    config.supabaseUrl.includes("YOUR_PROJECT") ||
    !config.supabaseAnonKey ||
    config.supabaseAnonKey === "YOUR_SUPABASE_ANON_KEY"
  ) {
    throw new Error("Supabase is not configured");
  }
}

async function supabaseFetch(path, options = {}) {
  const config = await getConfig();
  assertConfigured(config);
  const response = await fetch(`${config.supabaseUrl}${path}`, {
    ...options,
    headers: {
      apikey: config.supabaseAnonKey,
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    }
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.msg || body?.message || body?.error_description || body?.error;
    throw new Error(message || `Supabase request failed (${response.status})`);
  }
  return body;
}

export async function signIn(email, password) {
  const data = await supabaseFetch("/auth/v1/token?grant_type=password", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
  const session = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at || Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
    user: data.user || null
  };
  await saveSession(session);
  return session;
}

export async function refreshSession(session) {
  if (!session?.refresh_token) return null;
  const data = await supabaseFetch("/auth/v1/token?grant_type=refresh_token", {
    method: "POST",
    body: JSON.stringify({ refresh_token: session.refresh_token })
  });
  const refreshed = {
    ...session,
    access_token: data.access_token,
    refresh_token: data.refresh_token || session.refresh_token,
    expires_at: data.expires_at || Math.floor(Date.now() / 1000) + (data.expires_in || 3600),
    user: data.user || session.user || null
  };
  await saveSession(refreshed);
  return refreshed;
}

export async function getValidSession() {
  const session = await getSession();
  if (!session) return null;
  const isExpired = Number(session.expires_at || 0) * 1000 < Date.now() + 30_000;
  if (!isExpired) return session;
  try {
    return await refreshSession(session);
  } catch {
    await clearSession();
    return null;
  }
}

export async function signOut() {
  const session = await getValidSession();
  if (session?.access_token) {
    const config = await getConfig();
    await fetch(`${config.supabaseUrl}/auth/v1/logout`, {
      method: "POST",
      headers: {
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${session.access_token}`
      }
    }).catch(() => undefined);
  }
  await clearSession();
}

export async function callRpc(name, payload) {
  const session = await getValidSession();
  if (!session?.access_token) throw new Error("Please sign in first");
  return supabaseFetch(`/rest/v1/rpc/${encodeURIComponent(name)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify(payload)
  });
}

export { CONFIG_KEY, SESSION_KEY };