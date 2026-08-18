(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const loginView = $("login-view");
  const appView = $("app-view");
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

  function setBusy(button, busy, label) {
    button.disabled = busy;
    if (label) button.querySelector("span").textContent = label;
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

  function initial(state) {
    return (state.name || state.email || "F").trim().charAt(0).toUpperCase();
  }

  function render(state) {
    const authenticated = Boolean(state?.authenticated);
    loginView.classList.toggle("hidden", authenticated);
    appView.classList.toggle("hidden", !authenticated);
    if (!authenticated) return;

    $("user-name").textContent = state.name || "Farix user";
    $("user-email").textContent = state.email || "—";
    $("avatar").textContent = initial(state);
    $("plan").textContent = state.plan || "ChatGPT";
    $("expiry").textContent = formatDate(state.expiresAt);

    const active = Boolean(state.active);
    $("session-status").textContent = active ? "Session active" : "No session injected";
    $("session-status").className = `status-pill ${active ? "active" : "idle"}`;
    $("session-copy").textContent = active
      ? "Managed ChatGPT account is ready."
      : "No session injected.";
    $("inject-label").textContent = active ? "Restart session" : "Inject session";
    clearButton.disabled = !active;
  }

  async function loadState() {
    try {
      const response = await send({ type: "GET_STATE" });
      render(response.state);
    } catch (error) {
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
      window.setTimeout(() => window.close(), 250);
    } catch (error) {
      setBusy(injectButton, false, "Inject session");
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
      setBusy(clearButton, false, "Clear session");
    }
  });

  $("logout-button").addEventListener("click", async () => {
    const button = $("logout-button");
    setError("");
    setBusy(button, true, "Logging out…");
    try {
      const response = await send({ type: "LOGOUT" });
      render(response.state);
    } catch (error) {
      setError(error.message);
    } finally {
      setBusy(button, false, "Log out");
    }
  });

  void loadState();
})();