/*
 * Supabase public configuration.
 *
 * The anon key is intended for browser clients. Never put a Supabase
 * service_role key in this extension or commit one to the project.
 *
 * These values are used as the initial defaults. They can also be changed
 * from the extension's small settings page and are stored locally in Chrome.
 */
export const DEFAULT_CONFIG = Object.freeze({
  supabaseUrl: "https://niytnogzleyderixfkaf.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5peXRub2d6bGV5ZGVyaXhma2FmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUxODA5NDEsImV4cCI6MjEwMDc1Njk0MX0.qIFZ9AOqqeWkKQTQ7EVLehXqdWkS0_IlZHuj2rcqQng",
  toolSlug: "gemini",
  rpc: Object.freeze({
    getRandomAccount: "get_random_gemini_account",
    setActiveSession: "set_active_session",
    clearActiveSession: "clear_active_session"
  })
});

export const GEMINI_HOSTS = Object.freeze([
  "gemini.google.com",
  "accounts.google.com",
  "myaccount.google.com",
  "google.com"
]);

export const GEMINI_COOKIE_DOMAINS = Object.freeze([
  "gemini.google.com",
  "accounts.google.com",
  "google.com",
  "www.google.com"
]);

export const GEMINI_COOKIE_URLS = Object.freeze([
  "https://gemini.google.com/",
  "https://accounts.google.com/",
  "https://myaccount.google.com/",
  "https://google.com/"
]);