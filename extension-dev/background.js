importScripts("config.js", "supabase.js");

(() => {
  "use strict";

  const config = globalThis.FARIX_CONFIG;
  const supabase = globalThis.FarixSupabase;
  const keys = config.STORAGE_KEYS;
  const FLOW_HOSTS = ["flow.google.com", "labs.google"];
  const FLOW_HOST = FLOW_HOSTS[0];
  const FLOW_URL = config.FLOW_URL;

  function storageGet(keyOrKeys) {
    return new Promise((resolve) => chrome.storage.local.get(keyOrKeys, resolve));
  }

  function storageSet(values) {
    return new Promise((resolve) => chrome.storage.local.set(values, resolve));
  }

  function storageRemove(values) {
    return new Promise((resolve) => chrome.storage.local.remove(values, resolve));
  }

  function getDeviceId() {
    return storageGet(keys.deviceId).then(async (stored) => {
      if (stored[keys.deviceId]) return stored[keys.deviceId];
      const deviceId = crypto.randomUUID();
      await storageSet({ [keys.deviceId]: deviceId });
      return deviceId;
    });
  }

  function isFlowTab(tab) {
    return Boolean(
      tab?.id &&
        typeof tab.url === "string" &&
        /^https:\/\/(flow\.google\.com\/|labs\.google\/fx\/tools\/flow(?:[/?#]|$))/.test(tab.url)
    );
  }

  function isExpired(expiresAt) {
    return Boolean(expiresAt && new Date(expiresAt).getTime() <= Date.now());
  }

  function userFacingError(error) {
    if (error?.code === "CONFIGURATION_REQUIRED") {
      return "Add the Supabase URL and anon key in config.js, then reload the extension.";
    }
    if (error?.code === "SESSION_EXPIRED") {
      return "Your session expired. Please log in again.";
    }
    if (error?.status === 401) return "Your Farix session expired. Please log in again.";
    if (error?.status === 409 || error?.code === "ACTIVE_SESSION_EXISTS") {
      return "This account is already active on another device.";
    }
    return error?.message || "Something went wrong. Please try again.";
  }

  async function refreshStoredSession(stored) {
    const auth = stored[keys.auth];
    if (!auth?.access_token) return null;

    const expiresAt = Number(auth.expires_at || 0) * 1000;
    if (!expiresAt || expiresAt > Date.now() + 60_000) return auth;
    if (!auth.refresh_token) {
      await clearLocalSession();
      return null;
    }

    try {
      const refreshed = await supabase.refreshSession(auth.refresh_token);
      const nextAuth = {
        ...auth,
        ...refreshed,
        user: refreshed.user || auth.user,
        refresh_token: refreshed.refresh_token || auth.refresh_token
      };
      await storageSet({ [keys.auth]: nextAuth });
      return nextAuth;
    } catch {
      await clearLocalSession();
      return null;
    }
  }

  async function clearLocalSession() {
    await storageRemove([
      keys.auth,
      keys.profile,
      keys.activeSession
    ]);
  }

  async function clearFlowCookies() {
    const lists = await Promise.all(
      FLOW_HOSTS.map(
        (host) => new Promise((resolve) => chrome.cookies.getAll({ domain: host }, resolve))
      )
    );
    const cookies = lists.flat();

    await Promise.all(
      cookies.map(
        (cookie) =>
          new Promise((resolve) => {
            const domain = cookie.domain.replace(/^\./, "");
            const url = `https://${domain}${cookie.path || "/"}`;
            chrome.cookies.remove(
              {
                url,
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

  function parseCookieData(cookieData) {
    if (typeof cookieData === "string") {
      try {
        return parseCookieData(JSON.parse(cookieData));
      } catch {
        throw new Error("The managed account returned invalid cookie data.");
      }
    }

    if (Array.isArray(cookieData)) return cookieData;
    if (cookieData?.cookies) return parseCookieData(cookieData.cookies);
    if (cookieData?.cookie_data) return parseCookieData(cookieData.cookie_data);

    if (cookieData && typeof cookieData === "object") {
      return Object.entries(cookieData).map(([name, value]) => {
        if (value && typeof value === "object") return { name, ...value };
        return { name, value: String(value) };
      });
    }

    throw new Error("The managed account did not include cookie data.");
  }

  function cookieDomainIsAllowed(domain) {
    const normalized = String(domain || FLOW_HOST).replace(/^\./, "").toLowerCase();
    return FLOW_HOSTS.some((host) => normalized === host || normalized.endsWith(`.${host}`));
  }

  async function setCookie(cookie) {
    const domain = cookie.domain || FLOW_HOST;
    if (!cookieDomainIsAllowed(domain)) {
      throw new Error(`The account returned an unsupported cookie domain: ${domain}`);
    }

    const normalizedDomain = domain.replace(/^\./, "");
    const details = {
      // Flow hosts are HTTPS-only; the extension has no http host permission.
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

  async function findOrOpenFlowTab() {
    const tabs = await new Promise((resolve) =>
      chrome.tabs.query(
        { url: ["https://flow.google.com/*", "https://labs.google/fx/tools/flow*"] },
        resolve
      )
    );
    const current = tabs.find(isFlowTab);

    if (current?.id) {
      await new Promise((resolve) =>
        chrome.tabs.update(current.id, { active: true, url: FLOW_URL }, resolve)
      );
      return current.id;
    }

    const created = await new Promise((resolve) =>
      chrome.tabs.create({ url: FLOW_URL, active: true }, resolve)
    );
    return created?.id;
  }

  async function getAuthenticatedContext() {
    const stored = await storageGet([keys.auth, keys.profile, keys.activeSession]);
    const auth = await refreshStoredSession(stored);
    if (!auth?.access_token || !auth.user?.id) {
      return { auth: null, profile: null, activeSession: null };
    }

    return {
      auth,
      profile: stored[keys.profile] || null,
      activeSession: stored[keys.activeSession] || null
    };
  }

  async function stateSnapshot() {
    const context = await getAuthenticatedContext();
    return {
      authenticated: Boolean(context.auth),
      email: context.profile?.email || context.auth?.user?.email || "",
      name: context.profile?.name || "",
      plan: context.profile?.plan || "Veo",
      role: context.profile?.role || "user",
      tools: context.profile?.tools || [],
      expiresAt: context.profile?.expiresAt || null,
      active: Boolean(context.activeSession?.active),
      activeSince: context.activeSession?.activeSince || null
    };
  }

  async function login(email, password) {
    if (!email || !password) throw new Error("Enter your email and password.");
    const session = await supabase.signInWithPassword(email.trim(), password);
    const profile = await supabase.fetchProfile(session.user, session.access_token);
    const auth = {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      user: session.user
    };

    await storageSet({
      [keys.auth]: auth,
      [keys.profile]: profile,
      [keys.activeSession]: null
    });

    return stateSnapshot();
  }

  async function logout() {
    const context = await getAuthenticatedContext();
    await clearFlowCookies();
    try {
      await supabase.signOut(context.auth?.access_token);
    } catch {
      // Local cleanup must still complete if the network is unavailable.
    }
    await clearLocalSession();
    return stateSnapshot();
  }

  async function injectSession() {
    const context = await getAuthenticatedContext();
    if (!context.auth) throw new Error("Log in before starting a Veo session.");
    if (isExpired(context.profile?.expiresAt)) {
      throw new Error("Your Farix plan has expired.");
    }
    const deviceId = await getDeviceId();
    const accountPayload = await supabase.rpc(
      config.RPCS.getRandomFlowAccount,
      {},
      context.auth.access_token
    );
    const account = supabase.unwrapRpcValue(accountPayload);
    const cookieData = account?.cookie_data || account?.cookies || account;
    const cookies = parseCookieData(cookieData);
    if (!cookies.length) throw new Error("No managed Veo account is available right now.");

    const accountId = account?.id || account?.account_id || null;

    await clearFlowCookies();
    try {
      await Promise.all(cookies.map(setCookie));
    } catch (error) {
      await clearFlowCookies();
      throw error;
    }

    // Session tracking is best-effort: cookies are already injected.
    try {
      const activePayload = await supabase.rpc(
        config.RPCS.setActiveSession,
        config.RPC_ARGUMENTS.setActiveSession(accountId),
        context.auth.access_token
      );
      const activeValue = supabase.unwrapRpcValue(activePayload);
      if (activeValue === false || activeValue?.success === false) {
        await clearFlowCookies();
        throw new Error("This account is already active on another device.");
      }
    } catch (error) {
      if (error?.status && error.status !== 404) {
        await clearFlowCookies();
        throw error;
      }
    }

    const activeSession = {
      active: true,
      activeSince: new Date().toISOString(),
      accountId,
      deviceId
    };
    await storageSet({ [keys.activeSession]: activeSession });
    const tabId = await findOrOpenFlowTab();

    return { ...(await stateSnapshot()), tabId };
  }

  /** Drop the managed cookies + active session, keeping the user logged in. */
  async function clearSession() {
    await clearFlowCookies();
    await storageRemove([keys.activeSession]);
    return stateSnapshot();
  }

  async function cleanup({ clearStorage = false } = {}) {
    try {
      await clearFlowCookies();
    } finally {
      if (clearStorage) {
        await clearLocalSession();
      } else {
        await storageRemove([keys.activeSession]);
      }
    }
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
      try {
        switch (message?.type) {
          case "GET_STATE":
            sendResponse({ ok: true, state: await stateSnapshot() });
            break;
          case "LOGIN":
            sendResponse({
              ok: true,
              state: await login(message.email, message.password)
            });
            break;
          case "LOGOUT":
            sendResponse({ ok: true, state: await logout() });
            break;
          case "INJECT_SESSION":
            sendResponse({ ok: true, state: await injectSession() });
            break;
          case "CLEAR_SESSION":
            sendResponse({ ok: true, state: await clearSession() });
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

  // Heartbeat port used by the content-script lockdown watchdog.
  chrome.runtime.onConnect.addListener((port) => {
    if (port.name !== "flow-lockdown") return;
    port.onMessage.addListener(() => {
      try {
        port.postMessage({ type: "LOCKDOWN_ALIVE" });
      } catch {
        /* port closed */
      }
    });
    port.onDisconnect.addListener(() => void chrome.runtime.lastError);
  });

  chrome.runtime.onInstalled.addListener(() => {
    void getDeviceId();
  });

  chrome.runtime.onStartup.addListener(() => {
    void stateSnapshot();
  });

  if (chrome.management?.onDisabled) {
    chrome.management.onDisabled.addListener((info) => {
      if (info.id === chrome.runtime.id) void cleanup({ clearStorage: true });
    });
  }

  // Chrome does not guarantee a callback on uninstall. This is a best-effort
  // final cleanup for disable/unload paths, while logout always cleans up.
  chrome.runtime.onSuspend.addListener(() => {
    void cleanup();
  });
})();