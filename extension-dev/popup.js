(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const loginView = $("login-view");
  const appView = $("app-view");
  const configNotice = $("configuration-notice");
  const loginForm = $("login-form");
  const loginButton = $("login-button");
  const injectButton = $("inject-button");
  const clearButton = $("clear-button");
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
    if (!value) return "No expiry set";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(date);
  }

  function render(state) {
    const authenticated = Boolean(state?.authenticated);
    loginView.classList.toggle("hidden", authenticated);
    appView.classList.toggle("hidden", !authenticated);

    const active = authenticated && Boolean(state.active);
    $("header-dot").className = `dot ${active ? "active" : "idle"}`;
    if (!authenticated) return;

    $("user-email").textContent = state.email || "—";
    $("session-status").textContent = active ? "Active" : "Inactive";
    $("session-status").className = `pill ${active ? "active" : "idle"}`;
    $("session-copy").textContent = active ? "Session active" : "No session injected";
    $("expiry-line").textContent = `Access until ${formatDate(state.expiresAt)}`;
    injectButton.textContent = active ? "Restart Session" : "Inject Session";
    clearButton.disabled = !active;
  }

  function setBusy(button, busy, label) {
    button.disabled = busy;
    if (label) button.textContent = label;
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
    const label = injectButton.textContent;
    setBusy(injectButton, true, "Preparing session…");
    try {
      const response = await send({ type: "INJECT_SESSION" });
      render(response.state);
      injectButton.disabled = false;
      window.setTimeout(() => window.close(), 250);
    } catch (error) {
      setBusy(injectButton, false, label);
      setError(error.message);
    }
  });

  clearButton.addEventListener("click", async () => {
    setError("");
    setBusy(clearButton, true, "Clearing…");
    try {
      const response = await send({ type: "CLEAR_SESSION" });
      render(response.state);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(clearButton, false, "Clear Session");
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
    } finally {
      button.disabled = false;
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "STATE_UPDATED" && message.state) render(message.state);
  });

  void loadState();
})();
