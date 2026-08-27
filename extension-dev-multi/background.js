importScripts("config.js", "supabase.js");

(() => {
  "use strict";

  const config = globalThis.FARIX_CONFIG;
  const supabase = globalThis.FarixSupabase;
  const keys = config.STORAGE_KEYS;
  const TOOLS = config.TOOLS;

  const get = (k) => new Promise((resolve) => chrome.storage.local.get(k, resolve));
  const set = (v) => new Promise((resolve) => chrome.storage.local.set(v, resolve));
  const remove = (v) => new Promise((resolve) => chrome.storage.local.remove(v, resolve));

  function tool(toolId) {
    const found = TOOLS[toolId];
    if (!found) throw new Error("Unknown Farix tool requested.");
    return found;
  }

  function userFacingError(error) {
    if (error?.code === "CONFIGURATION_REQUIRED") {
      return "Supabase configuration is missing in config.js.";
    }
    if (error?.code === "SESSION_EXPIRED" || error?.status === 401) {
      return "Your Farix session expired. Please log in again.";
    }
    if (error?.status === 409 || error?.code === "ACTIVE_SESSION_EXISTS") {
      return "This account is already active on another device.";
    }
    return error?.message || "Something went wrong. Please try again.";
  }

  function expired(value) {
    return Boolean(value && new Date(value).getTime() <= Date.now());
  }

  async function deviceId() {
    const stored = await get(keys.deviceId);
    if (stored[keys.deviceId]) return stored[keys.deviceId];
    const value = crypto.randomUUID();
    await set({ [keys.deviceId]: value });
    return value;
  }

  /* ------------------------------------------------------------ auth state */

  async function authContext() {
    const stored = await get([keys.auth, keys.profile, keys.sessions]);
    let auth = stored[keys.auth];
    const empty = { auth: null, profile: null, sessions: {} };
    if (!auth?.access_token) return empty;

    const expiry = Number(auth.expires_at || 0) * 1000;
    if (expiry && expiry <= Date.now() + 60_000) {
      if (!auth.refresh_token) {
        await remove([keys.auth, keys.profile, keys.sessions]);
        return empty;
      }
      try {
        const refreshed = await supabase.refreshSession(auth.refresh_token);
        auth = {
          ...auth,
          ...refreshed,
          user: refreshed.user || auth.user,
          refresh_token: refreshed.refresh_token || auth.refresh_token
        };
        await set({ [keys.auth]: auth });
      } catch {
        await remove([keys.auth, keys.profile, keys.sessions]);
        return empty;
      }
    }

    return {
      auth,
      profile: stored[keys.profile] || null,
      sessions: stored[keys.sessions] || {}
    };
  }

  async function snapshot() {
    const context = await authContext();
    const profile = context.profile;
    const sessions = context.sessions || {};
    const tools = Object.values(TOOLS).map((item) => ({
      id: item.id,
      label: item.label,
      unlocked: Boolean(profile?.access?.[item.id]),
      active: Boolean(sessions[item.id]?.active),
      activeSince: sessions[item.id]?.activeSince || null
    }));

    return {
      authenticated: Boolean(context.auth),
      email: profile?.email || context.auth?.user?.email || "",
      name: profile?.name || "",
      plan: profile?.plan || null,
      planLabel: profile?.planLabel || "No plan",
      role: profile?.role || "user",
      expiresAt: profile?.expiresAt || null,
      tools,
      active: tools.some((item) => item.active)
    };
  }

  /* --------------------------------------------------------------- cookies */

  function toolHosts(toolId) {
    const entry = tool(toolId);
    return entry.hosts?.length ? entry.hosts : [entry.host];
  }

  function allowedDomain(toolId, domain) {
    const normalized = String(domain || tool(toolId).host)
      .replace(/^\./, "")
      .toLowerCase();
    return toolHosts(toolId).some(
      (host) => normalized === host || normalized.endsWith(`.${host}`)
    );
  }

  async function clearCookies(toolId) {
    const collected = await Promise.all(
      toolHosts(toolId).map(
        (host) =>
          new Promise((resolve) =>
            chrome.cookies.getAll({ domain: host }, (found) => {
              void chrome.runtime.lastError;
              resolve(found || []);
            })
          )
      )
    );
    const seen = new Set();
    const cookies = collected.flat().filter((cookie) => {
      const key = `${cookie.storeId || ""}:${cookie.domain}:${cookie.path}:${cookie.name}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return allowedDomain(toolId, cookie.domain);
    });
    await Promise.all(
      cookies.map(
        (cookie) =>
          new Promise((resolve) => {
            const domain = cookie.domain.replace(/^\./, "");
            chrome.cookies.remove(
              {
                url: `https://${domain}${cookie.path || "/"}`,
                name: cookie.name,
                storeId: cookie.storeId
              },
              () => {
                void chrome.runtime.lastError;
                resolve();
              }
            );
          })
      )
    );
  }

  function parseCookieData(value) {
    if (typeof value === "string") {
      try {
        return parseCookieData(JSON.parse(value));
      } catch {
        throw new Error("The managed account returned invalid cookie data.");
      }
    }
    if (Array.isArray(value)) return value;
    if (value?.cookies) return parseCookieData(value.cookies);
    if (value?.cookie_data) return parseCookieData(value.cookie_data);
    if (value && typeof value === "object") {
      return Object.entries(value).map(([name, item]) =>
        item && typeof item === "object" ? { name, ...item } : { name, value: String(item) }
      );
    }
    throw new Error("The managed account did not include cookie data.");
  }

  async function injectCookie(toolId, cookie) {
    const host = tool(toolId).host;
    const domain = cookie.domain || host;
    if (!allowedDomain(toolId, domain)) {
      throw new Error(`Unsupported cookie domain returned: ${domain}`);
    }
    const normalizedDomain = domain.replace(/^\./, "");
    const details = {
      // Both managed hosts are HTTPS-only.
      url: `https://${normalizedDomain}${cookie.path || "/"}`,
      name: String(cookie.name),
      value: String(cookie.value ?? ""),
      path: cookie.path || "/",
      secure: true,
      httpOnly: Boolean(cookie.httpOnly),
      sameSite: ["no_restriction", "lax", "strict"].includes(cookie.sameSite)
        ? cookie.sameSite
        : "lax"
    };
    if (!cookie.hostOnly && domain.startsWith(".")) details.domain = domain;
    if (cookie.expirationDate && Number(cookie.expirationDate) > Date.now() / 1000) {
      details.expirationDate = Number(cookie.expirationDate);
    }

    await new Promise((resolve, reject) => {
      chrome.cookies.set(details, (result) => {
        const error = chrome.runtime.lastError;
        if (error || !result) {
          reject(new Error(error?.message || `Could not inject cookie ${cookie.name}.`));
          return;
        }
        resolve();
      });
    });
  }

  /* ------------------------------------------------------------------ tabs */

  function queryTabs(toolId) {
    return new Promise((resolve) =>
      chrome.tabs.query({ url: tool(toolId).tabMatches }, resolve)
    );
  }

  async function notifyTabs(toolId, message) {
    const tabs = await queryTabs(toolId);
    await Promise.all(
      tabs.map(
        (tab) =>
          new Promise((done) => {
            if (!tab.id) return done();
            chrome.tabs.sendMessage(tab.id, message, () => {
              void chrome.runtime.lastError;
              done();
            });
          })
      )
    );
  }

  async function openTool(toolId) {
    const entry = tool(toolId);
    const tabs = await queryTabs(toolId);
    const current = tabs.find((tab) => tab.id);
    if (current?.id) {
      await new Promise((resolve) =>
        chrome.tabs.update(current.id, { active: true, url: entry.url }, resolve)
      );
      return current.id;
    }
    const created = await new Promise((resolve) =>
      chrome.tabs.create({ url: entry.url, active: true }, resolve)
    );
    return created?.id;
  }

  /** Detects which managed tool the active tab belongs to, if any. */
  async function activeTabTool() {
    const [tab] = await new Promise((resolve) =>
      chrome.tabs.query({ active: true, currentWindow: true }, resolve)
    );
    const url = tab?.url || "";
    const match = Object.values(TOOLS).find((item) => item.urlPattern.test(url));
    return match?.id || null;
  }

  /* -------------------------------------------------------------- sessions */

  async function setSession(toolId, value) {
    const stored = await get(keys.sessions);
    const sessions = { ...(stored[keys.sessions] || {}) };
    if (value) sessions[toolId] = value;
    else delete sessions[toolId];
    await set({ [keys.sessions]: sessions });
  }

  async function login(email, password) {
    if (!email || !password) throw new Error("Enter your email and password.");
    const session = await supabase.signInWithPassword(email.trim(), password);
    const profile = await supabase.fetchProfile(session.user, session.access_token);
    await set({
      [keys.auth]: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        user: session.user
      },
      [keys.profile]: profile,
      [keys.sessions]: {}
    });
    return snapshot();
  }

  /* ------------------------------------------------ website auto-login */

  function trustedSender(sender) {
    const origin = sender?.origin || (sender?.url ? new URL(sender.url).origin : "");
    return config.SITE_ORIGINS.indexOf(origin) !== -1;
  }

  /** Adopts the Supabase session the Farix website already holds. */
  async function adoptWebSession(session) {
    if (!session?.access_token || !session?.user?.id) return snapshot();
    const stored = await get([keys.auth, keys.profile]);
    const current = stored[keys.auth];
    if (current?.access_token === session.access_token && stored[keys.profile]) {
      return snapshot();
    }

    const profile = await supabase.fetchProfile(session.user, session.access_token);
    await set({
      [keys.auth]: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        user: session.user,
        source: "web"
      },
      [keys.profile]: profile
    });
    return snapshot();
  }

  /** Website signed out -> drop any auth that came from the website. */
  async function webSessionCleared() {
    const stored = await get(keys.auth);
    if (stored[keys.auth]?.source !== "web") return snapshot();
    await clearData(null);
    await remove([keys.auth, keys.profile, keys.sessions]);
    return snapshot();
  }

  /** Pulls the session from any open Farix tab (popup opened before reload). */
  async function syncWebSession() {
    const patterns = config.SITE_ORIGINS.map((origin) => `${origin}/*`);
    const tabs = await new Promise((resolve) =>
      chrome.tabs.query({ url: patterns }, (found) => {
        void chrome.runtime.lastError;
        resolve(found || []);
      })
    );
    for (const tab of tabs) {
      if (!tab.id) continue;
      try {
        const [result] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && /^sb-[a-z0-9-]+-auth-token$/i.test(key)) {
                try {
                  const parsed = JSON.parse(localStorage.getItem(key));
                  const session = parsed?.currentSession || parsed?.session || parsed;
                  if (session?.access_token && session?.user?.id) {
                    return {
                      access_token: session.access_token,
                      refresh_token: session.refresh_token || null,
                      expires_at: session.expires_at || null,
                      user: { id: session.user.id, email: session.user.email || "" }
                    };
                  }
                } catch {
                  return null;
                }
              }
            }
            return null;
          }
        });
        if (result?.result) return adoptWebSession(result.result);
      } catch {
        // Tab not scriptable; try the next one.
      }
    }
    return snapshot();
  }

  async function clearData(toolId) {
    const targets = toolId ? [toolId] : Object.keys(TOOLS);
    for (const id of targets) {
      await clearCookies(id);
      await setSession(id, null);
      await notifyTabs(id, { type: "SESSION_STATE", active: false });
    }
    return snapshot();
  }

  async function logout() {
    const context = await authContext();
    await clearData(null);
    try {
      await supabase.signOut(context.auth?.access_token);
    } catch {
      // Local cleanup must still complete during a network failure.
    }
    await remove([keys.auth, keys.profile, keys.sessions]);
    return snapshot();
  }

  async function injectSession(requestedTool) {
    const context = await authContext();
    if (!context.auth) throw new Error("Log in before injecting a session.");
    if (expired(context.profile?.expiresAt)) throw new Error("Your Farix plan has expired.");

    const detected = await activeTabTool();
    const toolId = requestedTool || detected;
    if (!toolId) {
      throw new Error("Open ChatGPT or Google Flow in the current tab, then inject the session.");
    }
    const entry = tool(toolId);

    if (!context.profile?.access?.[toolId]) {
      throw new Error(`Your plan does not include ${entry.label}. Upgrade to the Master plan.`);
    }
    if (detected && detected !== toolId) {
      throw new Error(
        `The current tab is not ${entry.label}. Farix will open ${entry.label} for you.`
      );
    }

    const accountPayload = await supabase.rpc(entry.accountRpc, {}, context.auth.access_token);
    const account = supabase.unwrapRpcValue(accountPayload);
    const cookies = parseCookieData(account?.cookie_data || account?.cookies || account);
    if (!cookies.length) {
      throw new Error(`No managed ${entry.label} account is available right now.`);
    }

    const accountId = account?.id || account?.account_id || null;

    // Only the target tool's cookies are ever touched — no cross-injection.
    await clearCookies(toolId);
    try {
      await Promise.all(cookies.map((cookie) => injectCookie(toolId, cookie)));
      if (accountId) {
        const activePayload = await supabase.rpc(
          config.RPCS.setActiveSession,
          config.RPC_ARGUMENTS.setActiveSession(accountId),
          context.auth.access_token
        );
        const activeValue = supabase.unwrapRpcValue(activePayload);
        if (activeValue === false || activeValue?.success === false || activeValue?.ok === false) {
          throw new Error("This account is already active on another device.");
        }
      }
    } catch (error) {
      await clearCookies(toolId);
      throw error;
    }

    await setSession(toolId, {
      active: true,
      activeSince: new Date().toISOString(),
      accountId,
      deviceId: await deviceId()
    });

    const tabId = await openTool(toolId);
    await notifyTabs(toolId, { type: "SESSION_STATE", active: true });
    return { ...(await snapshot()), tabId, tool: toolId };
  }

  async function cleanup({ clearStorage = false } = {}) {
    try {
      for (const id of Object.keys(TOOLS)) await clearCookies(id);
    } finally {
      if (clearStorage) await remove([keys.auth, keys.profile, keys.sessions]);
      else await remove([keys.sessions]);
    }
  }

  /* -------------------------------------------------------------- messaging */

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
      try {
        switch (message?.type) {
          case "WEB_SESSION":
            if (!trustedSender(sender)) {
              sendResponse({ ok: false, error: "Untrusted origin." });
              break;
            }
            sendResponse({ ok: true, state: await adoptWebSession(message.session) });
            break;
          case "WEB_SESSION_CLEARED":
            if (!trustedSender(sender)) {
              sendResponse({ ok: false, error: "Untrusted origin." });
              break;
            }
            sendResponse({ ok: true, state: await webSessionCleared() });
            break;
          case "SYNC_WEB_SESSION":
            sendResponse({ ok: true, state: await syncWebSession(), currentTool: await activeTabTool() });
            break;
          case "GET_STATE":
            sendResponse({
              ok: true,
              state: await snapshot(),
              currentTool: await activeTabTool()
            });
            break;
          case "LOGIN":
            sendResponse({ ok: true, state: await login(message.email, message.password) });
            break;
          case "INJECT_SESSION":
            sendResponse({ ok: true, ...(await injectSession(message.tool)) });
            break;
          case "CLEAR_SESSION":
            sendResponse({ ok: true, state: await clearData(message.tool || null) });
            break;
          case "LOGOUT":
            sendResponse({ ok: true, state: await logout() });
            break;
          default:
            sendResponse({ ok: false, error: "Unknown extension message." });
        }
      } catch (error) {
        sendResponse({ ok: false, error: userFacingError(error), code: error?.code });
      }
    })();
    return true;
  });

  // Heartbeat ports for both lockdown watchdogs (kept isolated by port name).
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== "flow-lockdown" && port.name !== "farix-chatgpt-watchdog") return;
    port.onMessage.addListener(() => {
      try {
        port.postMessage({
          type: port.name === "flow-lockdown" ? "LOCKDOWN_ALIVE" : "PONG"
        });
      } catch {
        /* port closed */
      }
    });
    port.onDisconnect.addListener(() => void chrome.runtime.lastError);
  });

  chrome.runtime.onInstalled.addListener(() => void deviceId());
  chrome.runtime.onStartup.addListener(() => void snapshot());

  if (chrome.management?.onDisabled) {
    chrome.management.onDisabled.addListener((info) => {
      if (info.id === chrome.runtime.id) void cleanup({ clearStorage: true });
    });
  }

  chrome.runtime.onSuspend.addListener(() => void cleanup());
})();
