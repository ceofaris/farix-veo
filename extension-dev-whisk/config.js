/*
 * Farix AI Whisk extension configuration (standalone).
 *
 * Replace the two placeholders below with the public values from your
 * Supabase project. Never put a service_role key in this file.
 */
globalThis.FARIX_CONFIG = Object.freeze({
  SUPABASE_URL: "https://niytnogzleyderixfkaf.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5peXRub2d6bGV5ZGVyaXhma2FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODA5NDEsImV4cCI6MjEwMDc1Njk0MX0.qIFZ9AOqqeWkKQTQ7EVLehXqdWkS0_IlZHuj2rcqQng",

  /* Whisk opens the shared Flow tool URL, but uses the Veo/Flow cookie pool. */
  WHISK_URL: "https://flow.google.com/about",

  TABLES: Object.freeze({
    profiles: "profiles",
    userPlans: "user_plans"
  }),

  PROFILE_USER_COLUMN: "id",
  USER_PLANS_USER_COLUMN: "user_id",

  RPCS: Object.freeze({
    getRandomFlowAccount: "get_random_flow_account",
    setActiveSession: "set_active_session"
  }),

  /*
   * These argument names match the recommended RPC signatures. If your
   * functions use different names, change them here without touching the
   * extension logic.
   */
  RPC_ARGUMENTS: Object.freeze({
    setActiveSession: (toolAccountId) => ({
      p_tool_account_id: toolAccountId
    })
  }),

  STORAGE_KEYS: Object.freeze({
    auth: "farix_whisk_auth",
    profile: "farix_whisk_profile",
    activeSession: "farix_whisk_active_session",
    deviceId: "farix_whisk_device_id"
  })
});