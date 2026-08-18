(() => {
  "use strict";

  let managedActive = false;
  let toastTimer = null;
  let toastElement = null;

  const accountWords =
    /\b(account|profile|settings|sign[\s-]?out|log[\s-]?out|switch account|manage plan|subscription)\b/i;
  const accountAttributes =
    /(account|profile|settings|signout|sign-out|logout|log-out|switch-account|user-menu)/i;
  const interactive = "button, a, [role='button'], [role='menuitem'], [tabindex='0']";

  const historyHrefPattern = /^\/(c|g|gpts|codex|library|project|projects|share)\b/i;
  const historyWords = /\b(library|projects?|gpts|explore gpts|chat history|recent)\b/i;
  const newChatWords = /\b(new chat|new conversation)\b/i;

  function ensureUi() {
    if (!toastElement) {
      const style = document.createElement("style");
      style.id = "farix-chatgpt-lockdown-style";
      style.textContent = `
        #farix-chatgpt-lockdown-toast {
          position: fixed;
          z-index: 2147483647;
          left: 50%;
          bottom: 28px;
          max-width: 320px;
          padding: 12px 16px;
          color: #f7f5ff;
          border: 1px solid rgba(203, 178, 255, .28);
          border-radius: 12px;
          background: linear-gradient(135deg, #211a45, #31265d);
          box-shadow: 0 16px 40px rgba(9, 6, 27, .3);
          font: 600 13px/1.4 Inter, ui-sans-serif, system-ui, sans-serif;
          text-align: center;
          opacity: 0;
          pointer-events: none;
          transform: translate(-50%, 8px);
          transition: opacity .2s ease, transform .2s ease;
        }
        #farix-chatgpt-lockdown-toast.visible {
          opacity: 1;
          transform: translate(-50%, 0);
        }
        html.farix-history-lock [data-farix-history-lock="1"] {
          pointer-events: none !important;
          user-select: none !important;
          filter: grayscale(1) blur(2px);
          opacity: .45;
        }
      `;
      document.documentElement.appendChild(style);
      toastElement = document.createElement("div");
      toastElement.id = "farix-chatgpt-lockdown-toast";
      document.documentElement.appendChild(toastElement);
    }
  }

  function showToast(text = "Account is locked on managed session") {
    ensureUi();
    toastElement.textContent = text;
    toastElement.classList.add("visible");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastElement?.classList.remove("visible"), 2600);
  }



  function descriptor(control) {
    return [
      control.getAttribute("aria-label"),
      control.getAttribute("title"),
      control.getAttribute("data-testid"),
      control.getAttribute("data-state"),
      control.getAttribute("href"),
      control.textContent
    ]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isAccountControl(target) {
    if (!(target instanceof Element)) return false;
    const control = target.closest(interactive);
    if (!control || control.closest("textarea, [contenteditable='true']")) return false;
    const values = descriptor(control);
    if (accountAttributes.test(values)) return true;

    const safeSurface = control.closest(
      "header, nav, [role='menu'], [role='dialog'], [data-radix-menu-content]"
    );
    return Boolean(safeSurface && accountWords.test(values));
  }

  /* ------------------------------------------------ chat history lock */

  function sidebarRoot() {
    return (
      document.querySelector("#stage-slideover-sidebar") ||
      document.querySelector("#sidebar") ||
      document.querySelector("nav[aria-label], nav")
    );
  }

  function isNewChatControl(control) {
    const values = descriptor(control).toLowerCase();
    if (newChatWords.test(values)) return true;
    const href = control.getAttribute("href") || "";
    return href === "/" || href === "/?model=auto";
  }

  function isHistoryControl(target) {
    if (!(target instanceof Element)) return false;
    const control = target.closest(interactive);
    if (!control || control.closest("textarea, [contenteditable='true']")) return false;
    if (isNewChatControl(control)) return false;

    const sidebar = sidebarRoot();
    const inSidebar = Boolean(sidebar && sidebar.contains(control));
    const href = control.getAttribute("href") || "";
    const values = descriptor(control);

    if (href && historyHrefPattern.test(href)) return true;
    if (inSidebar && historyWords.test(values)) return true;
    // Any other sidebar row that is not new-chat / search / settings-free
    if (inSidebar && control.closest("a[href]")) return true;
    return false;
  }

  function markHistory() {
    if (!managedActive) return;
    const sidebar = sidebarRoot();
    if (!sidebar) return;
    sidebar.querySelectorAll("a[href], li, [role='menuitem']").forEach((el) => {
      if (isNewChatControl(el)) return;
      const href = el.getAttribute?.("href") || "";
      const values = descriptor(el);
      if ((href && historyHrefPattern.test(href)) || historyWords.test(values)) {
        el.setAttribute("data-farix-history-lock", "1");
        el.setAttribute("aria-disabled", "true");
      }
    });
  }

  function applyHistoryLock() {
    ensureUi();
    document.documentElement.classList.toggle("farix-history-lock", managedActive);
    if (managedActive) markHistory();
  }

  function blockIfNeeded(event) {
    if (!managedActive) return;
    if (isAccountControl(event.target)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showToast();
      return;
    }
    if (isHistoryControl(event.target)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showToast("Chat history is locked on managed session");
    }
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "SESSION_STATE") {
      managedActive = Boolean(message.active);
      applyHistoryLock();
    }
  });

  chrome.runtime.sendMessage({ type: "GET_STATE" }, (response) => {
    void chrome.runtime.lastError;
    managedActive = Boolean(response?.ok && response.state?.active);
    applyHistoryLock();
  });

  new MutationObserver(() => {
    if (managedActive) markHistory();
  }).observe(document.documentElement, { childList: true, subtree: true });

  /* ------------------------------------------- removal / disable watchdog */

  const REMOVED_URL =
    "https://id-preview--c513a605-0d52-445c-abdb-f6f9785f1722.lovable.app/extension-removed";
  let watchdogPort = null;
  let loggedOut = false;

  function wipeReadableCookies() {
    const host = location.hostname;
    const domains = [host, `.${host}`, ".chatgpt.com", "chatgpt.com"];
    document.cookie.split(";").forEach((entry) => {
      const name = entry.split("=")[0]?.trim();
      if (!name) return;
      domains.forEach((domain) => {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${domain}`;
      });
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      // Storage access can be blocked; cookie wipe is the critical part.
    }
  }

  function forceManagedLogout() {
    if (loggedOut) return;
    loggedOut = true;
    wipeReadableCookies();
    // Hits ChatGPT's own logout flow so httpOnly session cookies are dropped
    // server-side, then lands the user on the Farix removal notice.
    const frame = document.createElement("iframe");
    frame.style.display = "none";
    frame.src = "https://chatgpt.com/auth/logout";
    document.documentElement.appendChild(frame);
    window.setTimeout(() => location.replace(REMOVED_URL), 600);
  }

  function connectWatchdog() {
    try {
      watchdogPort = chrome.runtime.connect({ name: "farix-chatgpt-watchdog" });
    } catch {
      forceManagedLogout();
      return;
    }
    watchdogPort.onDisconnect.addListener(() => {
      void chrome.runtime?.lastError;
      watchdogPort = null;
      forceManagedLogout();
    });
  }

  connectWatchdog();
  window.setInterval(() => {
    if (loggedOut) return;
    if (!chrome.runtime?.id) {
      forceManagedLogout();
      return;
    }
    if (!watchdogPort) {
      connectWatchdog();
      return;
    }
    try {
      watchdogPort.postMessage({ type: "PING" });
    } catch {
      watchdogPort = null;
      forceManagedLogout();
    }
  }, 5000);

  document.addEventListener("click", blockIfNeeded, true);
  document.addEventListener("pointerdown", blockIfNeeded, true);
  document.addEventListener("keydown", (event) => {
    if (!managedActive) return;
    if (event.key !== "Enter" && event.key !== " ") return;
    if (isAccountControl(event.target)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showToast();
    } else if (isHistoryControl(event.target)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showToast("Chat history is locked on managed session");
    }
  }, true);
})();
