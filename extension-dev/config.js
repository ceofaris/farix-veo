/*
 * Farix AI extension configuration.
 *
 * Replace the two placeholders below with the public values from your
 * Supabase project. Never put a service_role key in this file.
 */
globalThis.FARIX_CONFIG = Object.freeze({
  SUPABASE_URL: "https://niytnogzleyderixfkaf.supabase.co",
  SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5peXRub2d6bGV5ZGVyaXhma2FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODA5NDEsImV4cCI6MjEwMDc1Njk0MX0.qIFZ9AOqqeWkKQTQ7EVLehXqdWkS0_IlZHuj2rcqQng",

  FLOW_URL: "https://labs.google/fx/tools/flow",
  CREDIT_COST: 30,

  TABLES: Object.freeze({
    profiles: "profiles",
    userTools: "user_tools"
  }),

  PROFILE_USER_COLUMN: "id",
  USER_TOOLS_USER_COLUMN: "user_id",

  RPCS: Object.freeze({
    getRandomFlowAccount: "get_random_flow_account",
    setActiveSession: "set_active_session",
    checkAndDeductCredits: "check_and_deduct_credits"
  }),

  /*
   * These argument names match the recommended RPC signatures. If your
   * functions use different names, change them here without touching the
   * extension logic.
   */
  RPC_ARGUMENTS: Object.freeze({
    setActiveSession: (toolAccountId) => ({
      p_tool_account_id: toolAccountId
    }),
    checkAndDeductCredits: (userId, amount) => ({
      p_user_id: userId,
      p_amount: amount
    })
  }),

  STORAGE_KEYS: Object.freeze({
    auth: "farix_auth",
    profile: "farix_profile",
    credits: "farix_credits",
    activeSession: "farix_active_session",
    deviceId: "farix_device_id",
    recentGenerations: "farix_recent_generations"
  })
});