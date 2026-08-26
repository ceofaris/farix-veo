import { DEFAULT_CONFIG } from "./config.js";

const $ = (selector) => document.querySelector(selector);

document.addEventListener("DOMContentLoaded", async () => {
  const stored = await chrome.storage.local.get("farix_supabase_config");
  const config = { ...DEFAULT_CONFIG, ...(stored.farix_supabase_config || {}) };
  $("#supabase-url").value = config.supabaseUrl.includes("YOUR_PROJECT") ? "" : config.supabaseUrl;
  $("#supabase-key").value = config.supabaseAnonKey.includes("YOUR_") ? "" : config.supabaseAnonKey;
  $("#rpc-random").value = config.rpc?.getRandomAccount || DEFAULT_CONFIG.rpc.getRandomAccount;
  $("#rpc-set").value = config.rpc?.setActiveSession || DEFAULT_CONFIG.rpc.setActiveSession;
  $("#rpc-clear").value = config.rpc?.clearActiveSession || DEFAULT_CONFIG.rpc.clearActiveSession;
});

$("#config-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const config = {
    supabaseUrl: $("#supabase-url").value.trim().replace(/\/+$/, ""),
    supabaseAnonKey: $("#supabase-key").value.trim(),
    toolSlug: "gemini",
    rpc: {
      getRandomAccount: $("#rpc-random").value.trim(),
      setActiveSession: $("#rpc-set").value.trim(),
      clearActiveSession: $("#rpc-clear").value.trim()
    }
  };
  await chrome.storage.local.set({ farix_supabase_config: config });
  $("#message").textContent = "Connection saved. You can close this tab.";
});