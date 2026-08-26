(() => {
  "use strict";

  const BLOCKED_WORDS = [
    "profile",
    "account",
    "settings",
    "billing",
    "upgrade",
    "plan",
    "subscription",
    "manage your google account",
    "google account",
    "sign out",
    "signout",
    "log out",
    "logout"
  ];
  const ALLOWED_WORDS = [
    "new chat",
    "send message",
    "prompt",
    "conversation",
    "collapse sidebar",
    "expand sidebar"
  ];
  const BLOCKED_ROUTES = /(?:^|\/)(settings|billing|upgrade|plans?|subscriptions?)(?:\/|$)/i;
  const ACCOUNT_ROUTE = /accounts\.google\.com|myaccount\.google\.com/i;
  let lastUrl = location.href;
  let applyingRoute = false;

  function textOf(element) {
    if (!(element instanceof Element)) return "";
    const attributes = [
      element.getAttribute("aria-label"),
      element.getAttribute("data-tooltip"),
      element.getAttribute("title")
    ];
    const ownText = element.children.length === 0 ? element.textContent : "";
    return attributes.concat(ownText)
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }

  function isChatControl(element) {
    const text = textOf(element);
    if (ALLOWED_WORDS.some((word) => text.includes(word))) return true;
    return Boolean(element.closest(
      "textarea, [contenteditable='true'], [data-message-id]"
    ));
  }

  function isBlockedControl(element) {
    if (!(element instanceof Element) || isChatControl(element)) return false;
    const chain = [];
    let current = element;
    for (let index = 0; current && index < 5; index += 1, current = current.parentElement) {
      chain.push(current);
    }
    return chain.some((item) => {
      const text = textOf(item);
      return BLOCKED_WORDS.some((word) => text.includes(word));
    });
  }

  function silentlyBlock(event) {
    if (!isBlockedControl(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function silentlyBlockKeyboard(event) {
    if ((event.key !== "Enter" && event.key !== " ") || !isBlockedControl(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function removeAccountSurfaces(root) {
    if (!(root instanceof Element || root instanceof Document)) return;
    const candidates = root.querySelectorAll(
      "[role='dialog'], [role='menu'], [aria-modal='true'], [data-popup], [class*='overlay'], [class*='dialog']"
    );
    candidates.forEach((element) => {
      if (isBlockedControl(element) && !element.querySelector("textarea, [contenteditable='true']")) {
        element.remove();
      }
    });
  }

  function routeIsBlocked(url) {
    return ACCOUNT_ROUTE.test(url) || BLOCKED_ROUTES.test(new URL(url).pathname);
  }

  function keepOnGeminiChat() {
    if (applyingRoute || !routeIsBlocked(location.href)) return;
    applyingRoute = true;
    if (ACCOUNT_ROUTE.test(location.href)) {
      location.replace("https://gemini.google.com/app");
    } else {
      history.replaceState(null, "", "https://gemini.google.com/app");
      window.dispatchEvent(new PopStateEvent("popstate"));
      applyingRoute = false;
    }
  }

  const originalPushState = history.pushState.bind(history);
  history.pushState = (...args) => {
    originalPushState(...args);
    keepOnGeminiChat();
  };
  const originalReplaceState = history.replaceState.bind(history);
  history.replaceState = (...args) => {
    originalReplaceState(...args);
    keepOnGeminiChat();
  };

  document.addEventListener("click", silentlyBlock, true);
  document.addEventListener("pointerdown", silentlyBlock, true);
  document.addEventListener("keydown", silentlyBlockKeyboard, true);
  document.addEventListener("submit", (event) => {
    if (isBlockedControl(event.target)) {
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  }, true);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof Element) removeAccountSurfaces(node);
      });
    }
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      keepOnGeminiChat();
    }
  });

  function start() {
    removeAccountSurfaces(document);
    observer.observe(document.documentElement || document, { childList: true, subtree: true });
    keepOnGeminiChat();
  }

  if (document.documentElement) start();
  else document.addEventListener("DOMContentLoaded", start, { once: true });
})();