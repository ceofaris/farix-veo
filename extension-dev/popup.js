(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const loginView = $("login-view");
  const appView = $("app-view");
  const configNotice = $("configuration-notice");
  const loginForm = $("login-form");
  const loginButton = $("login-button");
  const injectButton = $("inject-button");
  const injectLabel = $("inject-label");
  const errorMessage = $("error-message");

  function send(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) {
          reject(new Error(runtimeError.message));
          return;
        }
        if (!response?.ok) {
          const error = new Error(response?.error || "Something went wrong.");
          error.code = response?.code;
          reject(error);
          return;
        }
        resolve(response);
      });
    });
  }

  function setError(message) {
    errorMessage.textContent = message || "";
    errorMessage.classList.toggle("hidden", !message);
  }

  function formatDate(value) {
    if (!value) return "No expiry";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(date);
  }

  function getInitial(name, email) {
    return (name || email || "F").trim().charAt(0).toUpperCase();
  }

  function render(state) {
    const authenticated = Boolean(state?.authenticated);
    loginView.classList.toggle("hidden", authenticated);
    appView.classList.toggle("hidden", !authenticated);

    if (!authenticated) return;

    $("user-name").textContent = state.name || "Farix user";
    $("user-email").textContent = state.email || "—";
    $("avatar").textContent = getInitial(state.name, state.email);
    $("plan-badge").textContent = state.plan || "Veo";
    $("credits").textContent = Number(state.credits ?? 0).toLocaleString();
    $("plan").textContent = state.plan || "Veo";
    $("expiry").textContent = formatDate(state.expiresAt);

    const active = Boolean(state.active);
    $("session-status").textContent = active ? "Active" : "Not injected";
    $("session-status").className = `status-pill ${active ? "active" : "idle"}`;
    $("session-copy").textContent = active
      ? "Your managed account is ready in the Flow workspace."
      : "No managed session is active.";
    injectLabel.textContent = active ? "Restart session" : "Inject session";
  }

  function setBusy(button, busy, label) {
    button.disabled = busy;
    if (label) button.querySelector("span").textContent = label;
  }

  async function loadState() {
    if (
      globalThis.FARIX_CONFIG?.SUPABASE_URL?.includes("YOUR_PROJECT_REF") ||
      globalThis.FARIX_CONFIG?.SUPABASE_ANON_KEY?.includes("YOUR_SUPABASE_ANON_KEY")
    ) {
      configNotice.classList.remove("hidden");
    }

    try {
      const response = await send({ type: "GET_STATE" });
      render(response.state);
    } catch (error) {
      if (error.code === "CONFIGURATION_REQUIRED" || error.message.includes("config.js")) {
        configNotice.classList.remove("hidden");
      }
      setError(error.message);
    }
  }

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setError("");
    setBusy(loginButton, true, "Signing in…");

    try {
      const response = await send({
        type: "LOGIN",
        email: $("email").value,
        password: $("password").value
      });
      $("password").value = "";
      render(response.state);
    } catch (error) {
      if (error.code === "CONFIGURATION_REQUIRED" || error.message.includes("config.js")) {
        configNotice.classList.remove("hidden");
      }
      setError(error.message);
    } finally {
      setBusy(loginButton, false, "Sign in");
    }
  });

  injectButton.addEventListener("click", async () => {
    setError("");
    setBusy(injectButton, true, "Preparing session…");
    try {
      const response = await send({ type: "INJECT_SESSION" });
      render(response.state);
      setBusy(injectButton, false);
      window.setTimeout(() => window.close(), 250);
    } catch (error) {
      setBusy(injectButton, false, "Inject session");
      setError(error.message);
    }
  });

  $("logout-button").addEventListener("click", async () => {
    setError("");
    const button = $("logout-button");
    button.disabled = true;
    try {
      const response = await send({ type: "LOGOUT" });
      render(response.state);
    } catch (error) {
      setError(error.message);
      button.disabled = false;
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "STATE_UPDATED" && message.state) render(message.state);
  });

  void loadState();
})();