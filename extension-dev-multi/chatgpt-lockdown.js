(() => {
  "use strict";

  let managedActive = false;

  const accountWords =
    /\b(account|profile|settings|sign[\s-]?out|log[\s-]?out|switch account|manage plan|subscription|upgrade|billing)\b/i;
  const accountAttributes =
    /(account|profile|settings|signout|sign-out|logout|log-out|switch-account|user-menu)/i;
  const interactive = "button, a, [role='button'], [role='menuitem'], [tabindex='0']";

  const newChatWords = /\b(new chat|new conversation)\b/i;
  const composerSafe = "textarea, input, [contenteditable='true'], form";

  /* ---------------------------------------------------------- styles */

  function ensureStyle() {
    if (document.getElementById("farix-chatgpt-lockdown-style")) return;
    const style = document.createElement("style");
    style.id = "farix-chatgpt-lockdown-style";
    style.textContent = `
      html.farix-cgpt-lock [data-farix-hide="1"] {
        display: none !important;
      }
      html.farix-cgpt-lock [data-farix-dead="1"] {
        pointer-events: none !important;
        user-select: none !important;
      }
    `;
    document.documentElement.appendChild(style);
  }

  /* ------------------------------------------------------- helpers */

  function descriptor(control) {
    return [
      control.getAttribute?.("aria-label"),
      control.getAttribute?.("title"),
      control.getAttribute?.("data-testid"),
      control.getAttribute?.("href"),
      control.textContent
    ]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function isNewChatControl(control) {
    if (!control) return false;
    const values = descriptor(control).toLowerCase();
    if (newChatWords.test(values)) return true;
    const href = control.getAttribute?.("href") || "";
    return href === "/" || href.startsWith("/?");
  }

  function sidebarRoot() {
    return (
      document.querySelector("#stage-slideover-sidebar") ||
      document.querySelector("#sidebar") ||
      document.querySelector("nav[aria-label]") ||
      document.querySelector("nav")
    );
  }

  function isAccountControl(target) {
    if (!(target instanceof Element)) return false;
    const control = target.closest(interactive);
    if (!control || control.closest(composerSafe)) return false;
    if (isNewChatControl(control)) return false;
    const values = descriptor(control);
    if (accountAttributes.test(values)) return true;
    const safeSurface = control.closest(
      "header, nav, aside, [role='menu'], [role='dialog'], [data-radix-menu-content]"
    );
    return Boolean(safeSurface && accountWords.test(values));
  }

  /* --------------------------------------------- sidebar cleanup */

  function accountChip(sidebar) {
    const candidates = sidebar.querySelectorAll(interactive);
    for (const el of candidates) {
      const values = descriptor(el);
      if (accountAttributes.test(values)) return el;
    }
    return null;
  }

  function maskAccountName(chip) {
    if (!chip) return;
    chip.setAttribute("data-farix-dead", "1");
    chip.setAttribute("aria-label", "Farix");
    chip.setAttribute("title", "Farix");

    const walker = document.createTreeWalker(chip, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    let renamed = false;
    for (const node of nodes) {
      const text = (node.nodeValue || "").trim();
      if (!text) continue;
      if (text === "Farix") {
        renamed = true;
        continue;
      }
      if (!renamed) {
        node.nodeValue = "Farix";
        renamed = true;
      } else if (/@|plus|pro|free|go\b/i.test(text) || text.length > 1) {
        node.nodeValue = "";
      }
    }

    // Avatar initials should not leak the real name either.
    chip.querySelectorAll("img[alt]").forEach((img) => img.setAttribute("alt", "Farix"));
  }

  function cleanSidebar() {
    if (!managedActive) return;
    const sidebar = sidebarRoot();
    if (!sidebar) return;

    const chip = accountChip(sidebar);
    maskAccountName(chip);

    // Hide every sidebar row / section except the New chat entry.
    const rows = sidebar.querySelectorAll("a[href], li, [role='menuitem'], h2, h3");
    rows.forEach((el) => {
      if (isNewChatControl(el)) return;
      if (el.querySelector && el.querySelector("a[href='/'], a[href^='/?']")) {
        const inner = el.querySelector("a[href='/'], a[href^='/?']");
        if (inner && isNewChatControl(inner)) return;
      }
      if (chip && (el.contains(chip) || chip.contains(el))) return;
      if (el.closest(composerSafe)) return;
      el.setAttribute("data-farix-hide", "1");
    });

    // Named nav buttons that are not links (Library, Codex, More, etc.).
    sidebar.querySelectorAll("button, [role='button']").forEach((el) => {
      if (isNewChatControl(el)) return;
      if (chip && (el.contains(chip) || chip.contains(el))) return;
      if (el.closest(composerSafe)) return;
      const values = descriptor(el).toLowerCase();
      if (
        /\b(library|projects?|scheduled|plugins?|codex|more|gpts|explore|sora|recents?|history|upgrade)\b/.test(
          values
        )
      ) {
        el.setAttribute("data-farix-hide", "1");
      }
    });
  }

  function applyLock() {
    ensureStyle();
    document.documentElement.classList.toggle("farix-cgpt-lock", managedActive);
    if (managedActive) cleanSidebar();
  }

  function blockIfNeeded(event) {
    if (!managedActive) return;
    if (isAccountControl(event.target)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "SESSION_STATE") {
      managedActive = Boolean(message.active);
      applyLock();
    }
  });

  chrome.runtime.sendMessage({ type: "GET_STATE" }, (response) => {
    void chrome.runtime.lastError;
    managedActive = Boolean(response?.ok && response.state?.active);
    applyLock();
  });

  new MutationObserver(() => {
    if (managedActive) cleanSidebar();
  }).observe(document.documentElement, { childList: true, subtree: true });

  window.setInterval(() => {
    if (managedActive) cleanSidebar();
  }, 900);

  /* ------------------------------------------- removal / disable watchdog */

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
    try {
      void fetch("https://chatgpt.com/api/auth/signout", {
        method: "POST",
        credentials: "include",
        keepalive: true
      });
    } catch {
      // Best effort; the iframe logout below is the fallback.
    }
    const frame = document.createElement("iframe");
    frame.style.display = "none";
    frame.src = "https://chatgpt.com/auth/logout";
    document.documentElement.appendChild(frame);
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
  document.addEventListener(
    "keydown",
    (event) => {
      if (!managedActive) return;
      if (event.key !== "Enter" && event.key !== " ") return;
      if (isAccountControl(event.target)) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    },
    true
  );
})();
