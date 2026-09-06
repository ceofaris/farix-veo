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
      !config?.SUPABASE_URL ||
      !config?.SUPABASE_ANON_KEY ||
      !/^https:\/\//.test(config.SUPABASE_URL)
    ) {
      throw new SupabaseError("Supabase configuration is missing.", {
        code: "CONFIGURATION_REQUIRED"
      });
    }
  }

  function headers(accessToken) {
    const result = {
      apikey: config.SUPABASE_ANON_KEY,
      "Content-Type": "application/json"
    };
    if (accessToken) result.Authorization = `Bearer ${accessToken}`;
    return result;
  }

  async function request(path, options = {}, accessToken) {
    ensureConfigured();
    const response = await fetch(`${config.SUPABASE_URL.replace(/\/+$/, "")}${path}`, {
      ...options,
      headers: { ...headers(accessToken), ...(options.headers || {}) }
    });
    const text = await response.text();
    let payload = null;
    try {
      payload = text ? JSON.parse(text) : null;
    } catch {
      payload = text;
    }

    if (!response.ok) {
      throw new SupabaseError(
        payload?.msg ||
          payload?.message ||
          payload?.error_description ||
          payload?.error ||
          `Supabase request failed (${response.status})`,
        { status: response.status, code: payload?.code || payload?.error_code, payload }
      );
    }
    return payload;
  }

  async function signInWithPassword(email, password) {
    const session = await request("/auth/v1/token?grant_type=password", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    if (!session?.access_token || !session?.user?.id) {
      throw new SupabaseError("Supabase returned an incomplete login session.", {
        code: "INVALID_SESSION"
      });
    }
    return session;
  }

  async function refreshSession(refreshToken) {
    const session = await request("/auth/v1/token?grant_type=refresh_token", {
      method: "POST",
      body: JSON.stringify({ refresh_token: refreshToken })
    });
    if (!session?.access_token) {
      throw new SupabaseError("Your Farix session expired. Please log in again.", {
        code: "SESSION_EXPIRED"
      });
    }
    return session;
  }

  async function signOut(accessToken) {
    if (accessToken) await request("/auth/v1/logout", { method: "POST" }, accessToken);
  }

  async function selectRows(table, filters, accessToken, select = "*", limit) {
    const params = new URLSearchParams({ select });
    if (limit) params.set("limit", String(limit));
    Object.entries(filters).forEach(([column, expression]) => params.set(column, expression));
    return request(`/rest/v1/${encodeURIComponent(table)}?${params.toString()}`, {}, accessToken);
  }

  async function rpc(name, args, accessToken) {
    return request(
      `/rest/v1/rpc/${encodeURIComponent(name)}`,
      { method: "POST", body: JSON.stringify(args || {}) },
      accessToken
    );
  }

  const PLAN_LABELS = {
    master: "Master Plan",
    pro: "Pro",
    free: "Free Trial"
  };

  /**
   * Builds the multi-tool profile: which tools the plan unlocks, and when the
   * plan expires. Feature locks are reported (not thrown) so the popup can show
   * Active / Locked status per tool.
   */
  async function fetchProfile(user, accessToken) {
    const [profileRows, planRows] = await Promise.all([
      selectRows(
        config.TABLES.profiles,
        { [config.PROFILE_USER_COLUMN]: `eq.${user.id}` },
        accessToken,
        "id,email,full_name,role,expires_at,is_active,trial_ends_at,trial_used,status",
        1
      ),
      selectRows(
        config.TABLES.userPlans,
        { [config.USER_PLANS_USER_COLUMN]: `eq.${user.id}` },
        accessToken,
        "user_id,plan,expires_at",
        1
      )
    ]);

    const profileRow = Array.isArray(profileRows) ? profileRows[0] : profileRows;
    const planRow = Array.isArray(planRows) ? planRows[0] : planRows;

    if (!profileRow) {
      throw new SupabaseError("No Farix profile was found for this account.", {
        code: "PROFILE_NOT_FOUND"
      });
    }
    if (profileRow.is_active === false) {
      throw new SupabaseError("Your Farix account is disabled.", { code: "ACCOUNT_DISABLED" });
    }

    if (profileRow.status === "suspended") {
      throw new SupabaseError("Your Farix account is suspended.", { code: "ACCOUNT_SUSPENDED" });
    }

    const isKing = profileRow.role === "king";
    const paidExpiry = planRow?.expires_at || profileRow.expires_at || null;
    const paidActive =
      isKing || (!!planRow && (!paidExpiry || new Date(paidExpiry).getTime() > Date.now()));

    // Free trial: no paid plan row, but the 1-hour trial window is still open.
    const trialEndsAt = profileRow.trial_ends_at || null;
    const trialActive =
      !paidActive && !!trialEndsAt && new Date(trialEndsAt).getTime() > Date.now();

    const plan = paidActive ? planRow?.plan || (isKing ? "master" : null) : trialActive ? "free" : null;
    const planActive = paidActive || trialActive;
    const expiresAt = paidActive ? paidExpiry : trialActive ? trialEndsAt : paidExpiry;

    if (!isKing && !planRow && !trialActive) {
      throw new SupabaseError("No active Farix plan is assigned to this account.", {
        code: "NO_ACTIVE_PLAN"
      });
    }

    const access = {};
    Object.values(config.TOOLS).forEach((tool) => {
      access[tool.id] = Boolean(planActive && plan && tool.plans.indexOf(plan) !== -1);
    });

    return {
      id: profileRow.id || user.id,
      email: profileRow.email || user.email || "",
      name: profileRow.full_name || "",
      role: profileRow.role || "user",
      plan,
      planLabel: PLAN_LABELS[plan] || "No plan",
      planActive,
      access,
      expiresAt
    };
  }

  function unwrapRpcValue(value) {
    if (Array.isArray(value)) return value[0] ?? null;
    if (value && typeof value === "object" && "data" in value) return unwrapRpcValue(value.data);
    return value;
  }

  globalThis.FarixSupabase = Object.freeze({
    SupabaseError,
    signInWithPassword,
    refreshSession,
    signOut,
    fetchProfile,
    rpc,
    unwrapRpcValue
  });
})();
