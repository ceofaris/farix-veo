/*
 * Farix AI Multi extension configuration (Veo 3 + ChatGPT).
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
      label: "Veo 3",
      host: "labs.google",
      hosts: Object.freeze(["labs.google"]),
      url: "https://labs.google/fx/tools/flow",
      tabMatches: ["https://labs.google/fx/tools/flow*"],
      urlPattern: /^https:\/\/([a-z0-9-]+\.)*labs\.google\//i,
      accountRpc: "get_random_flow_account",
      plans: ["veo3_ultra", "master"]
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
      plans: ["master"]
    }),
    chatgpt: Object.freeze({
      id: "chatgpt",
      label: "ChatGPT",
      host: "chatgpt.com",
      hosts: Object.freeze(["chatgpt.com"]),
      url: "https://chatgpt.com",
      tabMatches: ["https://chatgpt.com/*", "https://*.chatgpt.com/*"],
      urlPattern: /^https:\/\/([a-z0-9-]+\.)*chatgpt\.com\//i,
      accountRpc: "get_random_chatgpt_account",
      plans: ["chatgpt_premium", "master"]
    })
  }),

  TABLES: Object.freeze({
    profiles: "profiles",
    userPlans: "user_plans"
  }),

  PROFILE_USER_COLUMN: "id",
  USER_PLANS_USER_COLUMN: "user_id",

  RPCS: Object.freeze({
    setActiveSession: "set_active_session"
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
