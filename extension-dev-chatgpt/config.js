/*
 * Farix AI ChatGPT extension configuration.
 * Only use the public Supabase anon key here. Never use a service_role key.
 */
globalThis.FARIX_CONFIG = Object.freeze({
  SUPABASE_URL: "https://niytnogzleyderixfkaf.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5peXRub2d6bGV5ZGVyaXhma2FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODA5NDEsImV4cCI6MjEwMDc1Njk0MX0.qIFZ9AOqqeWkKQTQ7EVLehXqdWkS0_IlZHuj2rcqQng",

  CHATGPT_URL: "https://chatgpt.com",
  CHATGPT_HOST: "chatgpt.com",
  CHATGPT_LOGOUT_URL: "https://chatgpt.com/auth/logout",
  // Public published app host (no Lovable login required).
  APP_BASE_URL: "https://farixai.com",
  TOOL_NAME: "chatgpt",

  TABLES: Object.freeze({
    profiles: "profiles",
    userPlans: "user_plans"
  }),

  PROFILE_USER_COLUMN: "id",
  USER_PLANS_USER_COLUMN: "user_id",

  RPCS: Object.freeze({
    getRandomAccount: "get_random_chatgpt_account",
    setActiveSession: "set_active_session"
  }),

  RPC_ARGUMENTS: Object.freeze({
    setActiveSession: (toolAccountId) => ({
      p_tool_account_id: toolAccountId
    })
  }),

  STORAGE_KEYS: Object.freeze({
    auth: "farix_chatgpt_auth",
    profile: "farix_chatgpt_profile",
    activeSession: "farix_chatgpt_active_session",
    deviceId: "farix_chatgpt_device_id"
  })
});