(() => {
  "use strict";

  // Managed-session lockdown for Google Flow.
  // Listing page: whole page inert except the real "+ New project" tile.
  // Project pages: editor fully usable, only profile/account locked.

  const FLOW_ROOT = "https://flow.google.com/about";
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
  // Whisk (shared tool) pages must stay fully interactive: "Try in a project" etc.
  const isSharedToolPage = () => /^\/fx\/tools\/flow\/shared\//.test(path());
  const isListingPage = () => isFlowPage() && !isProjectPage() && !isSharedToolPage();

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
      [data-farix-hide="1"] {
        display: none !important;
      }
      [data-farix-mask="1"] {
        color: transparent !important;
        text-shadow: none !important;
        background-color: #000 !important;
        border-radius: 4px !important;
      }
      [data-farix-dead="1"], [data-farix-dead="1"] * {
        pointer-events: none !important;
        opacity: .35 !important;
      }
    `;
    (document.head || html).appendChild(style);
  }

  // Silent lockdown: no toasts, no banners.
  function toast() {}

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


  /* ------------------------------------------- listing project cards */

  const PROJECT_LINK_SELECTOR = 'a[href*="/fx/tools/flow/project/"]';

  function hideNode(el) {
    if (!(el instanceof Element)) return;
    if (el.dataset.farixHide === "1") return;
    if (el.closest?.('[data-flow-allow="1"]')) return;
    el.dataset.farixHide = "1";
  }

  function cardRootFor(link) {
    let el = link;
    let hops = 0;
    while (el?.parentElement && hops < 6) {
      const parent = el.parentElement;
      if (parent === document.body || parent.childElementCount > 1) return el;
      el = parent;
      hops += 1;
    }
    return el || link;
  }

  function hideProjectCards() {
    if (!isListingPage()) return;
    document.querySelectorAll(PROJECT_LINK_SELECTOR).forEach((link) => {
      if (link.closest?.('[data-flow-allow="1"]')) return;
      hideNode(cardRootFor(link));
    });
    // Media thumbnails rendered without a project link (previous generations).
    document.querySelectorAll("main video, main img").forEach((media) => {
      if (media.closest?.('[data-flow-allow="1"]')) return;
      if (media.closest?.('[data-farix-hide="1"]')) return;
      if (looksLikeAvatar(media)) return;
      const rect = media.getBoundingClientRect();
      if (rect.width < 120 || rect.height < 80) return;
      const card = cardRootFor(media);
      hideNode(card);
    });
  }

  /* ------------------------------------------------ timestamps */

  // Matches "27 Aug, 13:20", "Aug 27, 09:49 AM", "05:14", "2 hours ago" etc.
  // Contains-style (no anchors) so dates with prefixes/suffixes are still caught.
  const DATE_CONTAINS_RE =
    /(\d{1,2}\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?,?\s*\d{1,4}|(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*\d{1,2},?\s*(\d{4})?|\d{1,2}:\d{2}\s*(am|pm)?|\d{1,2}\/\d{1,2}\/\d{2,4}|(a|an|\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago|yesterday|today)/i;

  function maskTimestamps() {
    if (!isListingPage()) return;
    // Walk every text node; black out any date/time label so it is unreadable.
    const walker = document.createTreeWalker(
      document.body || document.documentElement,
      NodeFilter.SHOW_TEXT
    );
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);
    for (const textNode of nodes) {
      const text = (textNode.textContent || "").trim();
      if (!text || text.length > 40) continue;
      if (!DATE_CONTAINS_RE.test(text)) continue;
      const el = textNode.parentElement;
      if (!(el instanceof Element)) continue;
      if (el.dataset.farixMask === "1") continue;
      if (el.closest?.('[data-flow-allow="1"]')) continue;
      if (el.closest?.('[data-farix-mask="1"]')) continue;
      el.dataset.farixMask = "1";
    }
  }

  /* ------------------------------------------------ model dropdown */

  // Video models only — image models (Imagen, Nano Banana) stay fully open.
  const MODEL_TEXT_RE = /(veo\s*\d|omni\s*flash|flash)/i;
  const ALLOWED_MODEL_RE = /lower\s*priority/i;
  // Never touch controls unrelated to model choice.
  const SAFE_CONTROL_RE = /^(\d+s|x\s*\d|\d+\s*(outputs?|videos?)|16:9|9:16|1:1|generate|send|add|upload)$/i;

  function modelOptionNodes() {
    return document.querySelectorAll(
      "[role='menuitem'], [role='option'], [role='menuitemradio'], [role='radio']"
    );
  }

  function filterModelOptions() {
    if (!isFlowPage()) return;
    modelOptionNodes().forEach((el) => {
      if (el.dataset.farixDead === "1" || el.dataset.farixHide === "1") return;
      if (el.querySelector?.("[role='menuitem'], [role='option']")) return;
      const text = (el.textContent || "").trim();
      if (!text || text.length > 60) return;
      if (SAFE_CONTROL_RE.test(text)) return;
      if (ALLOWED_MODEL_RE.test(text)) return;
      if (!MODEL_TEXT_RE.test(text)) return;
      // Hide model options only; other panel controls stay untouched.
      el.dataset.farixHide = "1";
    });
  }

  // Selected-model label (button/trigger) must never read "Omni Flash".
  function fixSelectedModelLabel() {
    if (!isFlowPage()) return;
    document
      .querySelectorAll("button, [role='combobox'], [aria-haspopup]")
      .forEach((el) => {
        const text = (el.textContent || "").trim();
        if (!text || text.length > 60) return;
        if (!/omni\s*flash/i.test(text)) return;
        const leaf = Array.from(el.querySelectorAll("*")).find(
          (n) => n.childElementCount === 0 && /omni\s*flash/i.test(n.textContent || "")
        );
        const target = leaf || el;
        if (target.dataset.farixLabel === "1") return;
        target.dataset.farixLabel = "1";
        target.textContent = "Veo 3.1 - Lite [Lower Priority]";
      });
  }

  /* ------------------------------------------------------- mode switch */

  function sweep() {
    hideProjectCards();
    maskTimestamps();
    filterModelOptions();
    fixSelectedModelLabel();
  }

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
    sweep();
  }

  /* ---------------------------------------------------- event blocking */

  function blockEvent(event) {
    if (!isFlowPage()) return;

    if (isProfileTarget(event.target)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      return;
    }

    if (isListingPage() && !isAllowedTarget(event.target)) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
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
    sweep();
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
      const domains = ["", ".flow.google.com", "flow.google.com", ".labs.google", "labs.google", ".google.com"];
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

  window.setInterval(() => {
    if (isFlowPage()) sweep();
  }, 800);
})();
