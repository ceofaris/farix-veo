const $ = (selector) => document.querySelector(selector);
let state = null;

document.addEventListener("DOMContentLoaded", async () => {
  await restoreTheme();
  bindEvents();
  await refreshState();
});

function bindEvents() {
  $("#login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    runAction("login", {
      email: $("#email").value,
      password: $("#password").value
    });
  });
  $("#inject-button").addEventListener("click", () => runAction("inject"));
  $("#clear-button").addEventListener("click", () => runAction("clear"));
  $("#logout-button").addEventListener("click", () => runAction("logout"));
  $("#open-options").addEventListener("click", () => chrome.runtime.openOptionsPage());
  $("#theme-toggle").addEventListener("click", toggleTheme);
}

async function refreshState() {
  try {
    const response = await send({ type: "getState" });
    state = response.state;
    renderState();
  } catch (error) {
    setStatus("Unable to connect", error.message, "error");
  }
}

async function runAction(type, payload = {}) {
  clearError();
  setBusy(true);
  try {
    const response = await send({ type, ...payload });
    state = response.state;
    renderState();
    if (type === "login") {
      $("#password").value = "";
      setStatus("Ready to go", "Your Farix access is connected", "ready");
    } else if (type === "inject") {
      setStatus("Session active", "Gemini is ready for focused use", "active");
    } else if (type === "clear") {
      setStatus("Session cleared", "Gemini cookies were removed", "ready");
    } else if (type === "logout") {
      setStatus("Signed out", "Your Farix session is cleared", "ready");
    }
  } catch (error) {
    showError(error.message);
    setStatus("Action unavailable", error.message, "error");
  } finally {
    setBusy(false);
  }
}

function renderState() {
  const configured = Boolean(state?.configured);
  const signedIn = Boolean(state?.signedIn);
  $("#setup-callout").hidden = configured;
  $("#login-form").hidden = !configured || signedIn;
  $("#session-controls").hidden = !configured || !signedIn;
  $("#logout-button").hidden = !signedIn;
  $("#signed-in-email").textContent = state?.email || "";
  $("#active-account").hidden = !state?.injected;
  $("#account-label").textContent = state?.accountLabel || "Connected";
  if (!configured) {
    setStatus("Configuration needed", "Add your Supabase project details", "error");
  } else if (!signedIn) {
    setStatus("Sign in required", "Use your Farix account to continue", "ready");
  } else if (state?.injected) {
    setStatus("Session active", state.accountLabel || "Gemini session is ready", "active");
  } else {
    setStatus("Ready to inject", "Choose an isolated Gemini session", "ready");
  }
}

function setStatus(title, detail, tone) {
  $("#status-title").textContent = title;
  $("#status-detail").textContent = detail;
  $("#status-pill").textContent = tone === "active" ? "ACTIVE" : tone === "error" ? "ACTION" : "READY";
  $("#status-orb").className = `status-orb ${tone}`;
}

function setBusy(busy) {
  document.querySelectorAll("button").forEach((button) => {
    button.disabled = busy;
  });
  $("#login-button").querySelector("span").textContent = busy ? "Working…" : "Sign in to Farix";
}

function showError(message) {
  $("#form-error").hidden = false;
  $("#form-error").textContent = message;
}

function clearError() {
  $("#form-error").hidden = true;
  $("#form-error").textContent = "";
}

function send(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      if (!response?.ok) return reject(new Error(response?.error || "Request failed"));
      resolve(response);
    });
  });
}

async function restoreTheme() {
  const stored = await chrome.storage.local.get("farix_theme");
  const theme = stored.farix_theme || "light";
  document.documentElement.dataset.theme = theme;
  $("#theme-icon").textContent = theme === "dark" ? "☼" : "◐";
}

async function toggleTheme() {
  const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = theme;
  $("#theme-icon").textContent = theme === "dark" ? "☼" : "◐";
  await chrome.storage.local.set({ farix_theme: theme });
}