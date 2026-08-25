(() => {
  "use strict";

  // Managed-session lockdown for Google Flow.
  // Listing page: whole page inert except the real "+ New project" tile.
  // Project pages: editor fully usable, only profile/account locked.

  const FLOW_ROOT = "https://labs.google/fx/tools/flow";
  const LOGOUT_URL = "https://accounts.google.com/Logout";

  const ACCOUNT_HREF_PATTERN =
    /(accounts\.google\.com|myaccount\.google\.com|signout|logout|SignOutOptions|ServiceLogin|AccountChooser)/i;
  const PROFILE_TEXT_PATTERN =
    /(google account|manage your google account|manage account|switch account|add another account|add account|sign out|signout|log out|logout|signed in as|account settings|profile|avatar)/i;
  const NEW_PROJECT_PATTERN = /(new project|create project|new\s*\+|start new project)/i;

  const html = document.documentElement;

  /* ---------------------------------------------------------------- pages */

  const path = () => window.location.pathname;
  const isFlowPage = () => /^\/fx\/tools\/flow(?:[/?#]|$)/.test(path());
  const isProjectPage = () => /^\/fx\/tools\/flow\/project\//.test(path());
  const isListingPage = () => isFlowPage() && !isProjectPage();

  /* --------------------------------------------------------------- styles */

  function ensureStyles() {
    if (document.getElementById("flow-lockdown-styles")) return;
    const style = document.createElement("style");
    style.id = "flow-lockdown-styles";
    style.textContent = `
      html.flow-lockdown body * {
        pointer-events: none !important;
      }
      html.flow-lockdown [data-flow-allow="1"],
      html.flow-lockdown [data-flow-allow="1"] * {
        pointer-events: auto !important;
      }
      html.flow-profile-lock [data-flow-profile-lock="1"],
      html.flow-profile-lock [data-flow-profile-lock="1"] * {
        pointer-events: none !important;
        filter: grayscale(1);
        opacity: .55;
        user-select: none !important;
      }
      #flow-lockdown-toast {
        position: fixed;
        z-index: 2147483647;
        top: 24px;
        left: 50%;
        transform: translate(-50%, -8px);
        padding: 10px 16px;
        color: #f4f2ff;
        border: 1px solid rgba(160, 140, 255, .35);
        border-radius: 999px;
        background: rgba(24, 20, 48, .94);
        box-shadow: 0 16px 40px rgba(4, 10, 28, .32);
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
        font-size: 13px;
        opacity: 0;
        pointer-events: none !important;
        transition: opacity .18s ease, transform .18s ease;
      }
      #flow-lockdown-toast.visible {
        opacity: 1;
        transform: translate(-50%, 0);
      }
    `;
    (document.head || html).appendChild(style);
  }

  let toastElement = null;
  let toastTimer = 0;

  function toast(message = "Account is locked on managed session") {
    ensureStyles();
    if (!toastElement || !toastElement.isConnected) {
      toastElement = document.createElement("div");
      toastElement.id = "flow-lockdown-toast";
      html.appendChild(toastElement);
    }
    toastElement.textContent = message;
    requestAnimationFrame(() => toastElement?.classList.add("visible"));
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastElement?.classList.remove("visible"), 2200);
  }

  /* -------------------------------------------------------- detection */

  function attrText(el) {
    return [
      el.getAttribute?.("aria-label"),
      el.getAttribute?.("title"),
      el.getAttribute?.("data-tooltip"),
      el.getAttribute?.("data-testid"),
      el.getAttribute?.("alt")
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function shortText(el) {
    const text = (el.textContent || "").trim();
    return text.length > 120 ? "" : text.toLowerCase();
  }

  function looksLikeAvatar(el) {
    if (!(el instanceof Element)) return false;
    const img = el.matches("img") ? el : el.querySelector?.("img");
    if (!img) return false;
    const src = img.getAttribute("src") || "";
    if (!/(googleusercontent\.com|\/a\/|photo\.jpg|avatar)/i.test(src)) return false;
    const rect = el.getBoundingClientRect();
    return (
      rect.width > 0 &&
      rect.width <= 72 &&
      rect.height <= 72 &&
      Math.abs(rect.width - rect.height) <= 12 &&
      rect.top <= 160
    );
  }

  function isProfileElement(el) {
    if (!(el instanceof Element)) return false;
    const href = el.getAttribute?.("href") || "";
    if (href && ACCOUNT_HREF_PATTERN.test(href)) return true;
    const attrs = attrText(el);
    if (attrs && PROFILE_TEXT_PATTERN.test(attrs)) return true;
    const text = shortText(el);
    if (text && PROFILE_TEXT_PATTERN.test(text)) return true;
    return looksLikeAvatar(el);
  }

  function isProfileTarget(node) {
    let el = node instanceof Element ? node : node?.parentElement;
    let depth = 0;
    while (el && depth < 10) {
      if (el.dataset?.flowProfileLock === "1" || isProfileElement(el)) return true;
      el = el.parentElement;
      depth += 1;
    }
    return false;
  }

  function markProfileRoots(root) {
    if (!(root instanceof Element)) return;
    const candidates = [];
    if (root.matches?.("a[href], button, [role='button'], img")) candidates.push(root);
    root
      .querySelectorAll?.("a[href], button, [role='button'], img")
      .forEach((el) => candidates.push(el));

    for (const el of candidates) {
      if (el.dataset.flowProfileLock === "1") continue;
      if (!isProfileElement(el)) continue;
      const target = el.matches("img") ? el.closest("button, a, [role='button']") || el : el;
      target.dataset.flowProfileLock = "1";
      target.setAttribute("aria-disabled", "true");
      target.removeAttribute("target");
    }
  }

  /* ------------------------------------------------- new project tile */

  function scoreTile(el) {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return Infinity;
    return rect.width * rect.height;
  }

  function findNewProjectTile() {
    const nodes = Array.from(
      document.querySelectorAll("button, a, [role='button'], [data-testid], div[tabindex]")
    );
    const matches = nodes.filter((el) => {
      const attrs = attrText(el);
      const text = shortText(el);
      return NEW_PROJECT_PATTERN.test(attrs) || NEW_PROJECT_PATTERN.test(text);
    });
    if (!matches.length) return null;
    // Prefer the most compact (innermost) match so we do not unlock large wrappers.
    matches.sort((a, b) => scoreTile(a) - scoreTile(b));
    const best = matches.find((el) => scoreTile(el) !== Infinity);
    return best || null;
  }

  let allowedTile = null;

  function refreshAllowedTile() {
    if (!isListingPage()) return;
    if (allowedTile && allowedTile.isConnected) return;
    const tile = findNewProjectTile();
    if (!tile) return;
    allowedTile?.removeAttribute?.("data-flow-allow");
    allowedTile = tile;
    tile.setAttribute("data-flow-allow", "1");
  }

  function isAllowedTarget(node) {
    let el = node instanceof Element ? node : node?.parentElement;
    while (el) {
      if (el.dataset?.flowAllow === "1") return true;
      el = el.parentElement;
    }
    return false;
  }

  /* ------------------------------------------------------- mode switch */

  function applyMode() {
    if (!isFlowPage()) {
      html.classList.remove("flow-lockdown", "flow-profile-lock");
      return;
    }
    ensureStyles();
    html.classList.add("flow-profile-lock");
    if (isListingPage()) {
      html.classList.add("flow-lockdown");
      refreshAllowedTile();
    } else {
      html.classList.remove("flow-lockdown");
      allowedTile?.removeAttribute?.("data-flow-allow");
      allowedTile = null;
    }
    markProfileRoots(document.body || html);
  }

  /* ---------------------------------------------------- event blocking */

  function blockEvent(event) {
    if (!isFlowPage()) return;

    if (isProfileTarget(event.target)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      if (event.type === "click" || event.type === "pointerdown" || event.type === "keydown") toast();
      return;
    }

    if (isListingPage() && !isAllowedTarget(event.target)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      if (event.type === "click") toast("Only creating a new project is allowed here");
    }
  }

  ["pointerdown", "mousedown", "mouseup", "click", "auxclick", "contextmenu", "touchstart"].forEach(
    (type) => document.addEventListener(type, blockEvent, true)
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Enter" && event.key !== " " && event.key !== "Spacebar") return;
      blockEvent(event);
    },
    true
  );

  // Guard programmatic navigation to account surfaces.
  const nativeOpen = window.open;
  window.open = function flowGuardedOpen(url, ...rest) {
    if (typeof url === "string" && ACCOUNT_HREF_PATTERN.test(url)) {
      toast();
      return null;
    }
    return nativeOpen.call(window, url, ...rest);
  };

  const checkLocation = () => {
    if (ACCOUNT_HREF_PATTERN.test(window.location.href)) {
      window.location.replace(FLOW_ROOT);
      return;
    }
    applyMode();
  };

  ["popstate", "hashchange"].forEach((type) => window.addEventListener(type, checkLocation));
  let lastPath = path();
  window.setInterval(() => {
    if (path() !== lastPath) {
      lastPath = path();
      checkLocation();
    }
  }, 400);

  /* -------------------------------------------------------- observers */

  const observer = new MutationObserver((mutations) => {
    if (!isFlowPage()) return;
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) markProfileRoots(node);
      });
    }
    if (isListingPage()) refreshAllowedTile();
  });

  const startObserving = () => {
    observer.observe(html, { childList: true, subtree: true });
    applyMode();
  };

  if (document.body) startObserving();
  else document.addEventListener("DOMContentLoaded", startObserving, { once: true });

  applyMode();

  /* ------------------------------------------- extension removal watchdog */

  function purgeAndLogout() {
    try {
      const cookies = document.cookie ? document.cookie.split(";") : [];
      const domains = ["", ".labs.google", "labs.google", ".google.com"];
      for (const cookie of cookies) {
        const name = cookie.split("=")[0]?.trim();
        if (!name) continue;
        for (const domain of domains) {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${
            domain ? `; domain=${domain}` : ""
          }`;
        }
      }
    } catch {
      /* ignore */
    }
    window.location.replace(LOGOUT_URL);
  }

  let port = null;
  let watchdogActive = false;

  function connectWatchdog() {
    if (!isFlowPage()) return;
    try {
      port = chrome.runtime.connect({ name: "flow-lockdown" });
      watchdogActive = true;
      port.onDisconnect.addListener(() => {
        port = null;
        // Service worker sleeping is normal; a removed extension makes the API unusable.
        window.setTimeout(() => {
          if (!extensionAlive()) purgeAndLogout();
          else connectWatchdog();
        }, 1500);
      });
    } catch {
      if (watchdogActive) purgeAndLogout();
    }
  }

  function extensionAlive() {
    try {
      return Boolean(chrome?.runtime?.id);
    } catch {
      return false;
    }
  }

  window.setInterval(() => {
    if (!isFlowPage()) return;
    if (!extensionAlive()) {
      if (watchdogActive) purgeAndLogout();
      return;
    }
    if (port) {
      try {
        port.postMessage({ type: "LOCKDOWN_HEARTBEAT" });
      } catch {
        port = null;
      }
    } else {
      connectWatchdog();
    }
  }, 5000);

  connectWatchdog();
})();
