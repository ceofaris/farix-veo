(() => {
  "use strict";

  const config = globalThis.FARIX_CONFIG;
  const themeKey = config.STORAGE_KEYS.theme;
  const $ = (id) => document.getElementById(id);

  const loginView = $("login-view");
  const appView = $("app-view");
  const loginForm = $("login-form");
  const loginButton = $("login-button");
  const injectButton = $("inject-button");
  const clearButton = $("clear-button");
  const selectorWrap = $("selector-wrap");
  const toolList = $("tool-list");

  let selectedTool = null;
  let currentState = null;

  function send(message) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(message, (response) => {
        const runtimeError = chrome.runtime.lastError;
        if (runtimeError) return reject(new Error(runtimeError.message));
        if (!response?.ok) {
          const error = new Error(response?.error || "Something went wrong.");
          error.code = response?.code;
          return reject(error);
        }
        resolve(response);
      });
    });
  }

  function setError(target, message) {
    target.textContent = message || "";
    target.classList.toggle("hidden", !message);
  }

  function setBusy(button, busy, label) {
    button.disabled = busy;
    if (label) button.textContent = label;
  }

  function formatDate(value) {
    if (!value) return "no expiry set";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return String(value);
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric"
    }).format(date);
  }

  /* ----------------------------------------------------------------- theme */

  function applyTheme(theme) {
    document.body.classList.toggle("light", theme === "light");
  }

  chrome.storage.local.get(themeKey, (stored) => applyTheme(stored[themeKey] || "dark"));

  $("theme-button").addEventListener("click", () => {
    const next = document.body.classList.contains("light") ? "dark" : "light";
    applyTheme(next);
    chrome.storage.local.set({ [themeKey]: next });
  });

  /* ---------------------------------------------------------------- render */

  function renderTools(tools) {
    toolList.replaceChildren();
    tools.forEach((item) => {
      const li = document.createElement("li");
      const name = document.createElement("span");
      name.textContent = item.label;
      const pill = document.createElement("span");
      pill.className = `pill ${item.unlocked ? (item.active ? "active" : "idle") : "locked"}`;
      pill.textContent = item.unlocked ? (item.active ? "Active" : "Ready") : "Locked";
      li.append(name, pill);
      toolList.append(li);
    });
  }

  function renderSelector(tools) {
    const unlocked = tools.filter((item) => item.unlocked);
    const showSelector = unlocked.length > 1;
    selectorWrap.classList.toggle("hidden", !showSelector);

    if (!unlocked.some((item) => item.id === selectedTool)) {
      selectedTool = unlocked[0]?.id || null;
    }

    selectorWrap.querySelectorAll(".seg").forEach((button) => {
      const id = button.dataset.tool;
      const tool = tools.find((item) => item.id === id);
      button.disabled = !tool?.unlocked;
      button.classList.toggle("selected", showSelector && id === selectedTool);
    });
  }

  function render(state, currentTool) {
    currentState = state;
    const authenticated = Boolean(state?.authenticated);
    loginView.classList.toggle("hidden", authenticated);
    appView.classList.toggle("hidden", !authenticated);
    $("header-dot").className = `dot ${authenticated && state.active ? "active" : "idle"}`;
    if (!authenticated) return;

    $("user-email").textContent = state.email || "—";
    $("plan-pill").textContent = state.planLabel || "No plan";
    $("expiry-line").textContent = `Access until ${formatDate(state.expiresAt)}`;

    renderTools(state.tools || []);
    if (currentTool && state.tools?.some((item) => item.id === currentTool && item.unlocked)) {
      selectedTool = currentTool;
    }
    renderSelector(state.tools || []);

    const target = state.tools?.find((item) => item.id === selectedTool);
    injectButton.disabled = !target;
    injectButton.textContent = target
      ? `${target.active ? "Restart" : "Inject"} ${target.label} Session`
      : "No tool unlocked";
    clearButton.disabled = !state.tools?.some((item) => item.active);
  }

  async function loadState() {
    try {
      const response = await send({ type: "GET_STATE" });
      render(response.state, response.currentTool);
    } catch (error) {
      setError($("login-error"), error.message);
    }
  }

  /* ---------------------------------------------------------------- events */

  selectorWrap.querySelectorAll(".seg").forEach((button) => {
    button.addEventListener("click", () => {
      if (button.disabled) return;
      selectedTool = button.dataset.tool;
      setError($("error-message"), "");
      render(currentState, null);
    });
  });

  loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    setError($("login-error"), "");
    setBusy(loginButton, true, "Signing in…");
    try {
      const response = await send({
        type: "LOGIN",
        email: $("email").value,
        password: $("password").value
      });
      $("password").value = "";
      render(response.state, null);
      void loadState();
    } catch (error) {
      setError($("login-error"), error.message);
    } finally {
      setBusy(loginButton, false, "Sign in");
    }
  });

  injectButton.addEventListener("click", async () => {
    setError($("error-message"), "");
    const label = injectButton.textContent;
    setBusy(injectButton, true, "Preparing session…");
    try {
      const response = await send({ type: "INJECT_SESSION", tool: selectedTool });
      render(response.state, response.tool);
      window.setTimeout(() => window.close(), 250);
    } catch (error) {
      setBusy(injectButton, false, label);
      setError($("error-message"), error.message);
    }
  });

  clearButton.addEventListener("click", async () => {
    setError($("error-message"), "");
    setBusy(clearButton, true, "Clearing…");
    try {
      const response = await send({ type: "CLEAR_SESSION", tool: selectedTool });
      render(response.state, null);
    } catch (error) {
      setError($("error-message"), error.message);
    } finally {
      setBusy(clearButton, false, "Clear Data");
    }
  });

  $("logout-button").addEventListener("click", async () => {
    setError($("error-message"), "");
    const button = $("logout-button");
    button.disabled = true;
    try {
      const response = await send({ type: "LOGOUT" });
      render(response.state, null);
    } catch (error) {
      setError($("error-message"), error.message);
    } finally {
      button.disabled = false;
    }
  });

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "STATE_UPDATED" && message.state) render(message.state, null);
  });

  void loadState();
})();
