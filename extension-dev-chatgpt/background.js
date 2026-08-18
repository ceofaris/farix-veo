importScripts("config.js", "supabase.js");

(() => {
  "use strict";

  const config = globalThis.FARIX_CONFIG;
  const supabase = globalThis.FarixSupabase;
  const keys = config.STORAGE_KEYS;

  const get = (keyOrKeys) =>
    new Promise((resolve) => chrome.storage.local.get(keyOrKeys, resolve));
  const set = (values) =>
    new Promise((resolve) => chrome.storage.local.set(values, resolve));
  const remove = (values) =>
    new Promise((resolve) => chrome.storage.local.remove(values, resolve));

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

  async function authContext() {
    const stored = await get([keys.auth, keys.profile, keys.activeSession]);
    let auth = stored[keys.auth];
    if (!auth?.access_token) {
      return { auth: null, profile: null, activeSession: null };
    }

    const expiry = Number(auth.expires_at || 0) * 1000;
    if (expiry && expiry <= Date.now() + 60_000 && auth.refresh_token) {
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
        await remove([keys.auth, keys.profile, keys.activeSession]);
        return { auth: null, profile: null, activeSession: null };
      }
    }
    return {
      auth,
      profile: stored[keys.profile] || null,
      activeSession: stored[keys.activeSession] || null
    };
  }

  async function snapshot() {
    const context = await authContext();
    return {
      authenticated: Boolean(context.auth),
      email: context.profile?.email || context.auth?.user?.email || "",
      name: context.profile?.name || "",
      plan: context.profile?.plan || "ChatGPT",
      expiresAt: context.profile?.expiresAt || null,
      active: Boolean(context.activeSession?.active),
      activeSince: context.activeSession?.activeSince || null
    };
  }

  function sendToChatTabs(message) {
    return new Promise((resolve) => {
      chrome.tabs.query({ url: ["https://chatgpt.com/*"] }, (tabs) => {
        Promise.all(
          tabs.map(
            (tab) =>
              new Promise((done) => {
                if (!tab.id) {
                  done();
                  return;
                }
                chrome.tabs.sendMessage(tab.id, message, () => {
                  void chrome.runtime.lastError;
                  done();
                });
              })
          )
        ).finally(resolve);
      });
    });
  }

  async function clearChatCookies() {
    const cookies = await new Promise((resolve) => {
      chrome.cookies.getAll({ domain: config.CHATGPT_HOST }, resolve);
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

  function allowedCookieDomain(domain) {
    const normalized = String(domain || config.CHATGPT_HOST)
      .replace(/^\./, "")
      .toLowerCase();
    return normalized === config.CHATGPT_HOST || normalized.endsWith(`.${config.CHATGPT_HOST}`);
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
        item && typeof item === "object"
          ? { name, ...item }
          : { name, value: String(item) }
      );
    }
    throw new Error("The managed account did not include cookie data.");
  }

  async function injectCookie(cookie) {
    const domain = cookie.domain || config.CHATGPT_HOST;
    if (!allowedCookieDomain(domain)) {
      throw new Error(`Unsupported cookie domain returned: ${domain}`);
    }
    const normalizedDomain = domain.replace(/^\./, "");
    const details = {
      url: `https://${normalizedDomain}${cookie.path || "/"}`,
      name: String(cookie.name),
      value: String(cookie.value ?? ""),
      path: cookie.path || "/",
      secure: cookie.secure !== false,
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

  async function openChatGPT() {
    const tabs = await new Promise((resolve) =>
      chrome.tabs.query({ url: ["https://chatgpt.com/*"] }, resolve)
    );
    const current = tabs.find((tab) => tab.id);
    if (current?.id) {
      await new Promise((resolve) =>
        chrome.tabs.update(current.id, { active: true, url: config.CHATGPT_URL }, resolve)
      );
      return current.id;
    }
    const created = await new Promise((resolve) =>
      chrome.tabs.create({ url: config.CHATGPT_URL, active: true }, resolve)
    );
    return created?.id;
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
      [keys.activeSession]: null
    });
    return snapshot();
  }

  async function clearSession() {
    await clearChatCookies();
    await remove([keys.activeSession]);
    await sendToChatTabs({ type: "SESSION_STATE", active: false });
    return snapshot();
  }

  async function logout() {
    const context = await authContext();
    await clearChatCookies();
    try {
      await supabase.signOut(context.auth?.access_token);
    } catch {
      // Local cleanup must still complete during a network failure.
    }
    await remove([keys.auth, keys.profile, keys.activeSession]);
    await sendToChatTabs({ type: "SESSION_STATE", active: false });
    return snapshot();
  }

  async function injectSession() {
    const context = await authContext();
    if (!context.auth) throw new Error("Log in before injecting a ChatGPT session.");
    if (expired(context.profile?.expiresAt)) throw new Error("Your Farix plan has expired.");

    const accountPayload = await supabase.rpc(
      config.RPCS.getRandomAccount,
      {},
      context.auth.access_token
    );
    const account = supabase.unwrapRpcValue(accountPayload);
    const cookies = parseCookieData(account?.cookie_data || account?.cookies || account);
    if (!cookies.length) throw new Error("No managed ChatGPT account is available right now.");

    let accountId = null;
    await clearChatCookies();
    try {
      await Promise.all(cookies.map(injectCookie));
      accountId = account?.id || account?.account_id || account?.chatgpt_account_id || null;
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
      await clearChatCookies();
      throw error;
    }

    await set({
      [keys.activeSession]: {
        active: true,
        activeSince: new Date().toISOString(),
        accountId
      }
    });
    const tabId = await openChatGPT();
    await sendToChatTabs({ type: "SESSION_STATE", active: true });
    return { ...(await snapshot()), tabId };
  }

  async function cleanup({ clearStorage = false } = {}) {
    await clearChatCookies();
    if (clearStorage) {
      await remove([keys.auth, keys.profile, keys.activeSession]);
    } else {
      await remove([keys.activeSession]);
    }
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    (async () => {
      try {
        switch (message?.type) {
          case "GET_STATE":
            sendResponse({ ok: true, state: await snapshot() });
            break;
          case "LOGIN":
            sendResponse({ ok: true, state: await login(message.email, message.password) });
            break;
          case "INJECT_SESSION":
            sendResponse({ ok: true, state: await injectSession() });
            break;
          case "CLEAR_SESSION":
            sendResponse({ ok: true, state: await clearSession() });
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

  chrome.runtime.onInstalled.addListener(() => void deviceId());
  if (chrome.management?.onDisabled) {
    chrome.management.onDisabled.addListener((info) => {
      if (info.id === chrome.runtime.id) void cleanup({ clearStorage: true });
    });
  }
})();