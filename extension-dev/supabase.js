(() => {
  "use strict";

  const config = globalThis.FARIX_CONFIG;

  class SupabaseError extends Error {
    constructor(message, details = {}) {
      super(message);
      this.name = "SupabaseError";
      Object.assign(this, details);
    }
  }

  function ensureConfigured() {
    if (
      !config ||
      !config.SUPABASE_URL ||
      config.SUPABASE_URL.includes("YOUR_PROJECT_REF") ||
      !config.SUPABASE_ANON_KEY ||
      config.SUPABASE_ANON_KEY.includes("YOUR_SUPABASE_ANON_KEY")
    ) {
      throw new SupabaseError(
        "Add your Supabase URL and anon key in config.js before using the extension.",
        { code: "CONFIGURATION_REQUIRED" }
      );
    }
  }

  function getBaseUrl() {
    return config.SUPABASE_URL.replace(/\/+$/, "");
  }

  function getHeaders(accessToken) {
    const headers = {
      apikey: config.SUPABASE_ANON_KEY,
      "Content-Type": "application/json"
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    return headers;
  }

  async function request(path, options = {}, accessToken) {
    ensureConfigured();

    const response = await fetch(`${getBaseUrl()}${path}`, {
      ...options,
      headers: {
        ...getHeaders(accessToken),
        ...(options.headers || {})
      }
    });

    const text = await response.text();
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = text;
    }

    if (!response.ok) {
      const message =
        payload?.msg ||
        payload?.message ||
        payload?.error_description ||
        payload?.error ||
        `Supabase request failed (${response.status})`;
      throw new SupabaseError(message, {
        status: response.status,
        code: payload?.code || payload?.error_code,
        payload
      });
    }

    return payload;
  }

  async function signInWithPassword(email, password) {
    const session = await request(
      "/auth/v1/token?grant_type=password",
      {
        method: "POST",
        body: JSON.stringify({ email, password })
      }
    );

    if (!session?.access_token || !session?.user?.id) {
      throw new SupabaseError("Supabase returned an incomplete login session.", {
        code: "INVALID_SESSION"
      });
    }

    return session;
  }

  async function refreshSession(refreshToken) {
    const session = await request(
      "/auth/v1/token?grant_type=refresh_token",
      {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken })
      }
    );

    if (!session?.access_token) {
      throw new SupabaseError("Your session expired. Please log in again.", {
        code: "SESSION_EXPIRED"
      });
    }

    return session;
  }

  async function signOut(accessToken) {
    if (!accessToken) return;
    await request("/auth/v1/logout", { method: "POST" }, accessToken);
  }

  async function selectRows(table, filters, accessToken) {
    const params = new URLSearchParams({ select: "*" });
    for (const [column, expression] of Object.entries(filters)) {
      params.set(column, expression);
    }

    return request(
      `/rest/v1/${encodeURIComponent(table)}?${params.toString()}`,
      { method: "GET" },
      accessToken
    );
  }

  async function rpc(name, args, accessToken) {
    return request(
      `/rest/v1/rpc/${encodeURIComponent(name)}`,
      {
        method: "POST",
        body: JSON.stringify(args || {})
      },
      accessToken
    );
  }

  function firstDefined(...values) {
    return values.find((value) => value !== undefined && value !== null);
  }

  function normalizeTools(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed)) return parsed;
      } catch {
        return value
          .split(",")
          .map((tool) => tool.trim())
          .filter(Boolean);
      }
    }
    if (value && typeof value === "object") return Object.keys(value);
    return [];
  }

  function normalizeProfile(profileRow, toolRow, user) {
    const merged = { ...(profileRow || {}), ...(toolRow || {}) };
    const expiryValue = firstDefined(
      toolRow?.expiry,
      toolRow?.expires_at,
      toolRow?.expiry_date,
      profileRow?.expiry,
      profileRow?.expires_at,
    );

    return {
      id: user?.id || profileRow?.id || toolRow?.user_id,
      email: user?.email || profileRow?.email || "",
      name:
        firstDefined(
          profileRow?.full_name,
          profileRow?.name,
          profileRow?.display_name,
          user?.user_metadata?.full_name,
          user?.user_metadata?.name
        ) || "",
      role: firstDefined(profileRow?.role, toolRow?.role, "user"),
      plan: firstDefined(
        toolRow?.plan,
        toolRow?.plan_name,
        profileRow?.plan,
        profileRow?.plan_name,
        "Veo"
      ),
      tools: normalizeTools(
        firstDefined(toolRow?.tools, profileRow?.tools, merged.tool_access)
      ),
      expiresAt: expiryValue || null
    };
  }

  async function fetchProfile(user, accessToken) {
    const [profileRows, toolRows] = await Promise.all([
      selectRows(
        config.TABLES.profiles,
        {
          [config.PROFILE_USER_COLUMN]: `eq.${user.id}`
        },
        accessToken
      ),
      selectRows(
        config.TABLES.userTools,
        {
          [config.USER_TOOLS_USER_COLUMN]: `eq.${user.id}`
        },
        accessToken
      )
    ]);

    const profileRow = Array.isArray(profileRows) ? profileRows[0] : profileRows;
    const toolRow = Array.isArray(toolRows) ? toolRows[0] : toolRows;

    if (!profileRow && !toolRow) {
      throw new SupabaseError(
        "Your account is authenticated, but no Farix profile was found.",
        { code: "PROFILE_NOT_FOUND" }
      );
    }

    return normalizeProfile(profileRow, toolRow, user);
  }

  function unwrapRpcValue(value) {
    if (Array.isArray(value)) return value[0] ?? null;
    if (value && typeof value === "object" && "data" in value) {
      return unwrapRpcValue(value.data);
    }
    return value;
  }

  globalThis.FarixSupabase = Object.freeze({
    SupabaseError,
    ensureConfigured,
    signInWithPassword,
    refreshSession,
    signOut,
    fetchProfile,
    rpc,
    unwrapRpcValue,
    normalizeProfile
  });
})();