(() => {
  "use strict";

  /**
   * Farix AI — Gemini managed-session lockdown.
   * Silent block only: no toast, no banner, no alert.
   * Chat, composer, new chat, sidebar and conversation switching stay usable.
   */

  const GEMINI_APP = "https://gemini.google.com/app";

  const ACCOUNT_URL_RE =
    /(accounts\.google\.com|myaccount\.google\.com|SignOutOptions|ServiceLogin|AccountChooser|\/logout|\/signout|one\.google\.com|payments\.google\.com|play\.google\.com\/store\/paymentmethods)/i;

  const BLOCK_TEXT_RE =
    /(google account|manage your google account|account settings|switch account|add another account|add account|sign out|signed out|log out|logout|signout|settings|settings & help|help & settings|billing|subscription|upgrade|manage plan|your plan|google one|gemini advanced|pricing|payment)/i;

  const ALLOW_TEXT_RE =
    /(new chat|ask gemini|send message|submit|prompt|open sidebar|close sidebar|expand sidebar|collapse sidebar|main menu|students|images|microphone|voice|upload|add files|deep research|canvas|share|copy|edit)/i;

  // Visible but dead (silent block on click).
  const SIDEBAR_BLOCK_TEXT_RE = /(search chats)/i;

  // Completely hidden from the sidebar.
  const HIDE_TEXT_RE =
    /^(recents?|notebooks?|new notebook|library|videos)$/i;
  const HIDE_LABEL_RE =
    /(recents?|notebooks?|new notebook|library|videos)/i;

  const ALLOW_SELECTOR =
    "rich-textarea, textarea, input[type='text'], [contenteditable='true'], " +
    "[data-test-id='send-button'], [data-test-id='new-chat-button'], " +
    "[data-test-id='side-nav-menu-button'], [data-test-id='expanded-button'], " +
    "[data-test-id='collapsed-button'], [data-test-id='students-button'], " +
    "[data-test-id='images-button']";

  const SIDEBAR_ITEM_SELECTOR =
    "bard-sidenav a, bard-sidenav button, bard-sidenav [role='button'], " +
    "bard-sidenav [role='link'], bard-sidenav [data-test-id], " +
    "nav a, nav button, nav [role='button'], nav [data-test-id]";

  const BLOCK_SELECTOR =
    "a[href*='accounts.google.com'], a[href*='myaccount.google.com'], " +
    "a[href*='one.google.com'], a[href*='SignOutOptions'], " +
    "#gb, .gb_A, .gb_z, [aria-label*='Google Account' i], " +
    "[data-test-id='settings-and-help-button'], [data-test-id='settings-button'], " +
    "[data-test-id='bard-mode-menu-button'][data-upgrade], " +
    "[data-test-id='upgrade-button'], [data-test-id='user-info'], " +
    "[data-test-id='account-chip'], .gb_d[aria-label], " +
    "settings-and-help-menu, .user-info, .account-chip";

  const html = document.documentElement;

  function attrText(el) {
    if (!(el instanceof Element)) return "";
    return [
      el.getAttribute("aria-label"),
      el.getAttribute("title"),
      el.getAttribute("data-tooltip"),
      el.getAttribute("data-test-id"),
      el.getAttribute("alt"),
      el.getAttribute("href"),
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
  }

  function shortText(el) {
    const text = (el.textContent || "").trim();
    return text.length > 90 ? "" : text.toLowerCase();
  }

  function isAllowed(el) {
    if (!(el instanceof Element)) return false;
    if (el.closest(ALLOW_SELECTOR)) return true;
    const label = attrText(el);
    return Boolean(label && ALLOW_TEXT_RE.test(label) && !ACCOUNT_URL_RE.test(label));
  }

  function looksLikeAvatarChip(el) {
    if (!(el instanceof Element)) return false;
    const img = el.matches("img") ? el : el.querySelector("img");
    if (!img) return false;
    const src = img.getAttribute("src") || "";
    if (!/googleusercontent\.com|\/a\/|avatar|photo/i.test(src)) return false;
    const rect = el.getBoundingClientRect();
    return rect.width > 0 && rect.width <= 80 && rect.height <= 80;
  }

  function isBlockedElement(el) {
    if (!(el instanceof Element)) return false;
    if (isAllowed(el)) return false;
    if (el.matches(BLOCK_SELECTOR)) return true;
    const href = el.getAttribute?.("href") || "";
    if (href && ACCOUNT_URL_RE.test(href)) return true;
    const label = attrText(el);
    if (label && BLOCK_TEXT_RE.test(label)) return true;
    if (label && SIDEBAR_BLOCK_TEXT_RE.test(label)) return true;
    const text = shortText(el);
    if (text && BLOCK_TEXT_RE.test(text)) return true;
    if (text && SIDEBAR_BLOCK_TEXT_RE.test(text)) return true;
    return looksLikeAvatarChip(el);
  }

  function isBlockedTarget(node) {
    let el = node instanceof Element ? node : node?.parentElement;
    let depth = 0;
    while (el && depth < 8) {
      if (el.dataset?.farixBlock === "1") return true;
      if (el.dataset?.farixHide === "1") return true;
      if (isAllowed(el)) return false;
      if (isBlockedElement(el)) return true;
      el = el.parentElement;
      depth += 1;
    }
    return false;
  }

  function ensureStyles() {
    if (document.getElementById("farix-gemini-lock-style")) return;
    const style = document.createElement("style");
    style.id = "farix-gemini-lock-style";
    style.textContent = `
      [data-farix-block="1"], [data-farix-block="1"] * {
        pointer-events: none !important;
        user-select: none !important;
      }
      [data-farix-hide="1"] {
        display: none !important;
      }
    `;
    (document.head || html).appendChild(style);
  }

  function markBlocked(root) {
    if (!(root instanceof Element || root instanceof Document)) return;
    const nodes = [];
    if (root instanceof Element && root.matches("a[href], button, [role='button'], [role='menuitem'], img, [data-test-id]")) {
      nodes.push(root);
    }
    root
      .querySelectorAll?.("a[href], button, [role='button'], [role='menuitem'], img, [data-test-id]")
      .forEach((el) => nodes.push(el));

    for (const el of nodes) {
      if (el.dataset.farixBlock === "1") continue;
      if (!isBlockedElement(el)) continue;
      const target = el.matches("img") ? el.closest("a, button, [role='button']") || el : el;
      target.dataset.farixBlock = "1";
      target.setAttribute("aria-hidden", "true");
      target.setAttribute("tabindex", "-1");
      target.removeAttribute("target");
    }
  }

  function hideSidebarSections(root) {
    if (!(root instanceof Element || root instanceof Document)) return;
    const nodes = [];
    if (root instanceof Element && root.matches(SIDEBAR_ITEM_SELECTOR)) nodes.push(root);
    root.querySelectorAll?.(SIDEBAR_ITEM_SELECTOR).forEach((el) => nodes.push(el));

    for (const el of nodes) {
      if (el.dataset.farixHide === "1" || el.dataset.farixAllow === "1") continue;
      const text = (el.textContent || "").trim();
      const label = attrText(el);
      if (isAllowed(el) || ALLOW_TEXT_RE.test(text) || ALLOW_TEXT_RE.test(label)) {
        el.dataset.farixAllow = "1";
        continue;
      }
      if (!HIDE_TEXT_RE.test(text) && !HIDE_LABEL_RE.test(label)) continue;
      const target =
        el.closest("bard-sidenav a, bard-sidenav button, bard-sidenav [role='button'], bard-sidenav [role='listitem'], nav a, nav button, li") ||
        el;
      target.dataset.farixHide = "1";
      target.setAttribute("aria-hidden", "true");
    }

    // Hide the Recents / chat-history list containers as a whole.
    const historyContainers =
      ".conversation-items-container, [data-test-id='conversation-items-container'], " +
      "[data-test-id='chat-history-list'], [data-test-id='recent-chats'], " +
      "bard-sidenav [role='list'], .chat-history-list, .recents-container";
    root.querySelectorAll?.(historyContainers).forEach((el) => {
      if (el.querySelector("rich-textarea, textarea, [contenteditable='true']")) return;
      el.dataset.farixHide = "1";
      el.setAttribute("aria-hidden", "true");
    });

    // Hide standalone "Recents" section headings and their parent section.
    root
      .querySelectorAll?.("bard-sidenav h2, bard-sidenav h3, bard-sidenav span, nav h2, nav h3, nav span")
      .forEach((el) => {
        const text = (el.textContent || "").trim();
        if (!HIDE_TEXT_RE.test(text)) return;
        let section = el.parentElement;
        let depth = 0;
        while (section && depth < 4 && section.childElementCount < 2) {
          section = section.parentElement;
          depth += 1;
        }
        (section || el).dataset.farixHide = "1";
        (section || el).setAttribute("aria-hidden", "true");
      });
  }

  const BRAND_NAME = "Farix";

  const EMAIL_RE = /@[\w.-]+\.\w{2,}/;
  const PLAN_RE = /^(ultra|pro|advanced|google one|gemini advanced|free)$/i;

  function chipContainerFor(el) {
    let node = el;
    let depth = 0;
    while (node && depth < 6) {
      const text = (node.textContent || "").trim();
      if (text && text.length <= 90 && node.childElementCount > 0) return node;
      node = node.parentElement;
      depth += 1;
    }
    return el.parentElement || el;
  }

  function maskAccountIdentity(root) {
    if (!(root instanceof Element || root instanceof Document)) return;

    const avatars = [];
    root.querySelectorAll?.("img").forEach((img) => {
      const src = img.getAttribute("src") || "";
      if (!/googleusercontent\.com|\/a\/|avatar|photo/i.test(src)) return;
      avatars.push(img);
    });

    const containers = new Set();
    avatars.forEach((img) => containers.add(chipContainerFor(img)));
    root
      .querySelectorAll?.("[data-test-id='user-info'], [data-test-id='account-chip'], .user-info, .account-chip")
      .forEach((el) => containers.add(el));

    for (const container of containers) {
      if (!(container instanceof Element)) continue;
      if (container.querySelector("rich-textarea, textarea, [contenteditable='true']")) continue;

      const leaves = [];
      container.querySelectorAll("*").forEach((el) => {
        if (el.childElementCount > 0) return;
        const text = (el.textContent || "").trim();
        if (!text || text.length > 90) return;
        leaves.push({ el, text });
      });

      // Direct text nodes on the container itself.
      container.childNodes.forEach((node) => {
        if (node.nodeType !== Node.TEXT_NODE) return;
        const text = (node.textContent || "").trim();
        if (!text) return;
        if (node.__farixMasked) return;
        node.textContent = "";
      });

      let named = container.dataset.farixName === "1";
      for (const { el, text } of leaves) {
        if (el.dataset.farixName === "1") {
          if (el.textContent !== BRAND_NAME) el.textContent = BRAND_NAME;
          named = true;
          continue;
        }
        if (el.dataset.farixHide === "1") continue;
        if (EMAIL_RE.test(text) || PLAN_RE.test(text)) {
          el.dataset.farixHide = "1";
          el.setAttribute("aria-hidden", "true");
          continue;
        }
        if (!named) {
          el.dataset.farixName = "1";
          el.textContent = BRAND_NAME;
          container.dataset.farixName = "1";
          named = true;
        }
      }

      ["aria-label", "title", "data-tooltip", "alt"].forEach((attr) => {
        if (container.hasAttribute(attr)) container.setAttribute(attr, BRAND_NAME);
      });
      container.querySelectorAll("img").forEach((img) => {
        if (img.hasAttribute("alt")) img.setAttribute("alt", BRAND_NAME);
      });
    }
  }

  function removeAccountDialogs(root) {
    if (!(root instanceof Element || root instanceof Document)) return;
    root
      .querySelectorAll?.("[role='dialog'], [role='menu'], [aria-modal='true'], iframe[src*='accounts.google.com']")
      .forEach((el) => {
        if (el.querySelector("textarea, rich-textarea, [contenteditable='true']")) return;
        const text = `${attrText(el)} ${shortText(el)}`;
        const src = el.getAttribute?.("src") || "";
        if (BLOCK_TEXT_RE.test(text) || ACCOUNT_URL_RE.test(src) || ACCOUNT_URL_RE.test(text)) {
          el.remove();
        }
      });
  }

  function silentBlock(event) {
    if (!isBlockedTarget(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }

  ["pointerdown", "mousedown", "mouseup", "click", "auxclick", "contextmenu", "touchstart"].forEach(
    (type) => document.addEventListener(type, silentBlock, true),
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Enter" && event.key !== " " && event.key !== "Spacebar") return;
      silentBlock(event);
    },
    true,
  );

  const nativeOpen = window.open;
  window.open = function farixGuardedOpen(url, ...rest) {
    if (typeof url === "string" && ACCOUNT_URL_RE.test(url)) return null;
    return nativeOpen.call(window, url, ...rest);
  };

  function guardLocation() {
    if (ACCOUNT_URL_RE.test(location.href)) {
      location.replace(GEMINI_APP);
    }
  }

  ["popstate", "hashchange"].forEach((type) => window.addEventListener(type, guardLocation));

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (!(node instanceof Element)) return;
        markBlocked(node);
        hideSidebarSections(node);
        removeAccountDialogs(node);
      });
    }
  });

  function start() {
    ensureStyles();
    markBlocked(document);
    hideSidebarSections(document);
    removeAccountDialogs(document);
    observer.observe(html, { childList: true, subtree: true });
    guardLocation();
    window.setInterval(() => {
      markBlocked(document);
      hideSidebarSections(document);
      removeAccountDialogs(document);
    }, 1500);
  }

  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start, { once: true });
})();
