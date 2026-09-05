/*
 * Farix AI Master extension configuration (Veo 3 + Gemini Pro + Whisk).
 * Only use the public Supabase anon key here. Never use a service_role key.
 */
globalThis.FARIX_CONFIG = Object.freeze({
  SUPABASE_URL: "https://niytnogzleyderixfkaf.supabase.co",
  SUPABASE_ANON_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5peXRub2d6bGV5ZGVyaXhma2FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODA5NDEsImV4cCI6MjEwMDc1Njk0MX0.qIFZ9AOqqeWkKQTQ7EVLehXqdWkS0_IlZHuj2rcqQng",

  APP_BASE_URL: "https://farixai.com",

  /** Origins allowed to hand a website session to the extension. */
  SITE_ORIGINS: Object.freeze([
    "https://farixai.com",
    "https://www.farixai.com",
    "https://farixai.lovable.app"
  ]),

  /** Per-tool isolation: hosts, entry URLs, and account RPCs never mix. */
  TOOLS: Object.freeze({
    veo: Object.freeze({
      id: "veo",
      label: "Veo 3 (Flow)",
      host: "flow.google.com",
      hosts: Object.freeze(["flow.google.com", "labs.google"]),
      url: "https://flow.google.com/about",
      tabMatches: [
        "https://flow.google.com/*",
        "https://labs.google/fx/tools/flow*"
      ],
      urlPattern: /^https:\/\/([a-z0-9-]+\.)*(flow\.google\.com|labs\.google)\//i,
      accountRpc: "get_random_flow_account",
      probeUrl: "https://flow.google.com/about",
      probeKind: "google",
      /** Inject works from any tab — the extension opens Flow itself. */
      opensOwnTab: true,
      plans: ["pro", "master"]
    }),
    gemini: Object.freeze({
      id: "gemini",
      label: "Gemini Pro",
      host: "gemini.google.com",
      hosts: Object.freeze([
        "gemini.google.com",
        "accounts.google.com",
        "myaccount.google.com",
        "google.com"
      ]),
      url: "https://gemini.google.com/app",
      tabMatches: ["https://gemini.google.com/*"],
      urlPattern: /^https:\/\/gemini\.google\.com\//i,
      accountRpc: "get_random_gemini_account",
      probeUrl: "https://gemini.google.com/app",
      probeKind: "google",
      plans: ["master"]
    }),
    /**
     * Whisk has no cookie pool of its own: it reuses the Flow/Veo accounts and
     * only differs by the URL that is opened after injection.
     */
    whisk: Object.freeze({
      id: "whisk",
      label: "Whisk",
      host: "flow.google.com",
      hosts: Object.freeze(["flow.google.com", "labs.google"]),
      url: "https://flow.google.com/about",
      tabMatches: [
        "https://flow.google.com/*",
        "https://labs.google/fx/tools/flow/shared/tool/*"
      ],
      urlPattern: /^https:\/\/labs\.google\/fx\/tools\/flow\/shared\/tool\//i,
      accountRpc: "get_random_flow_account",
      probeUrl: "https://flow.google.com/about",
      probeKind: "google",
      opensOwnTab: true,
      /** Same Flow cookie jar as Veo 3. */
      sharesCookiesWith: "veo",
      plans: ["master"]
    }),


  }),

  TABLES: Object.freeze({
    profiles: "profiles",
    userPlans: "user_plans"
  }),

  PROFILE_USER_COLUMN: "id",
  USER_PLANS_USER_COLUMN: "user_id",

  RPCS: Object.freeze({
    setActiveSession: "set_active_session",
    markExpired: "mark_tool_account_expired"
  }),

  RPC_ARGUMENTS: Object.freeze({
    setActiveSession: (toolAccountId) => ({
      p_tool_account_id: toolAccountId
    })
  }),

  STORAGE_KEYS: Object.freeze({
    auth: "farix_multi_auth",
    profile: "farix_multi_profile",
    sessions: "farix_multi_sessions",
    deviceId: "farix_multi_device_id",
    theme: "farix_multi_theme"
  })
});
