(() => {
  "use strict";

  // Managed-session lockdown: keeps the user inside Google Flow and blocks
  // any interaction with the injected Google account (profile, account menu,
  // account switcher, sign out, accounts.google.com links).

  const ACCOUNT_HOST_PATTERN = /(accounts\.google\.com|myaccount\.google\.com|signout|logout|SignOutOptions|ServiceLogin|AccountChooser)/i;
  const ACCOUNT_TEXT_PATTERN =
    /(sign out|signout|log out|logout|manage your google account|manage account|google account|switch account|add another account|add account|account settings|privacy policy|google apps)/i;
  const PROFILE_LABEL_PATTERN =
    /(google account|account|profile|avatar|user menu|signed in as|sign out|switch)/i;
  // Never block anything that is clearly a Flow workspace control.
  const SAFE_TEXT_PATTERN =
    /(generate|create|new project|prompt|upload|download|scene|render|settings for|aspect|model|extend|add to scene|delete|rename|share project)/i;

  let toastElement = null;
  let toastTimer = 0;

  function isFlowPage() {
    return /^\/fx\/tools\/flow(?:[/?#]|$)/.test(window.location.pathname);
  }

  function ensureStyles() {
    if (document.getElementById("farix-lockdown-styles")) return;
    const style = document.createElement("style");
    style.id = "farix-lockdown-styles";
    style.textContent = `
      #farix-lockdown-toast {
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
        letter-spacing: .01em;
        opacity: 0;
        pointer-events: none;
        transition: opacity .18s ease, transform .18s ease;
      }
      #farix-lockdown-toast.visible {
        opacity: 1;
        transform: translate(-50%, 0);
      }
    `;
    document.documentElement.appendChild(style);
  }

  function showLockedNotice(message = "Account is locked on managed session") {
    ensureStyles();
    if (!toastElement || !toastElement.isConnected) {
      toastElement = document.createElement("div");
      toastElement.id = "farix-lockdown-toast";
      document.documentElement.appendChild(toastElement);
    }
    toastElement.textContent = message;
    requestAnimationFrame(() => toastElement?.classList.add("visible"));
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => {
      toastElement?.classList.remove("visible");
    }, 2200);
  }

  function attributeText(element) {
    const parts = [
      element.getAttribute?.("aria-label"),
      element.getAttribute?.("title"),
      element.getAttribute?.("data-tooltip"),
      element.getAttribute?.("alt")
    ];
    return parts.filter(Boolean).join(" ").toLowerCase();
  }

  function shortText(element) {
    const text = (element.textContent || "").trim();
    return text.length > 120 ? "" : text.toLowerCase();
  }

  function looksLikeAvatar(element) {
    if (!(element instanceof Element)) return false;
    const img = element.matches("img") ? element : element.querySelector?.("img");
    if (!img) return false;
    const src = img.getAttribute("src") || "";
    if (!/(googleusercontent\.com|\/a\/|photo\.jpg|avatar)/i.test(src)) return false;
    const rect = element.getBoundingClientRect();
    // Avatars are small, roughly square, and live in the top bar.
    return (
      rect.width > 0 &&
      rect.width <= 72 &&
      rect.height <= 72 &&
      Math.abs(rect.width - rect.height) <= 12 &&
      rect.top <= 140
    );
  }

  function isBlockedElement(element) {
    if (!(element instanceof Element)) return false;

    const href = element.getAttribute?.("href") || element.closest?.("a")?.getAttribute("href") || "";
    if (href && ACCOUNT_HOST_PATTERN.test(href)) return true;

    const attrs = attributeText(element);
    const text = shortText(element);

    if (SAFE_TEXT_PATTERN.test(text) || SAFE_TEXT_PATTERN.test(attrs)) return false;

    if (attrs && (PROFILE_LABEL_PATTERN.test(attrs) || ACCOUNT_TEXT_PATTERN.test(attrs))) return true;
    if (text && ACCOUNT_TEXT_PATTERN.test(text)) return true;
    if (looksLikeAvatar(element)) return true;

    return false;
  }

  function findBlockedTarget(startNode) {
    let node = startNode instanceof Element ? startNode : startNode?.parentElement;
    let depth = 0;
    while (node && depth < 8) {
      if (isBlockedElement(node)) return node;
      node = node.parentElement;
      depth += 1;
    }
    return null;
  }

  function blockEvent(event) {
    if (!isFlowPage()) return;
    const target = findBlockedTarget(event.target);
    if (!target) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (event.type === "click" || event.type === "keydown" || event.type === "pointerdown") {
      showLockedNotice();
    }
  }

  // Capture phase so Google's own handlers never see the event.
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

  // Block programmatic navigation to Google account surfaces.
  window.addEventListener(
    "beforeunload",
    () => {
      // no-op placeholder: navigation guard handled below
    },
    true
  );

  const guardNavigation = () => {
    const check = () => {
      const href = window.location.href;
      if (ACCOUNT_HOST_PATTERN.test(href)) {
        showLockedNotice();
        window.location.replace("https://labs.google/fx/tools/flow");
      }
    };
    check();
    window.addEventListener("popstate", check);
    window.addEventListener("hashchange", check);
  };
  guardNavigation();

  // Some account links open in a new tab/window; deny those too.
  const nativeOpen = window.open;
  window.open = function farixGuardedOpen(url, ...rest) {
    if (typeof url === "string" && ACCOUNT_HOST_PATTERN.test(url)) {
      showLockedNotice();
      return null;
    }
    return nativeOpen.call(window, url, ...rest);
  };

  // Neutralise account links as they appear, without touching workspace UI.
  const neutralise = (root) => {
    if (!(root instanceof Element)) return;
    const links = [];
    if (root.matches?.("a[href]")) links.push(root);
    root.querySelectorAll?.("a[href]").forEach((link) => links.push(link));
    links.forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (!ACCOUNT_HOST_PATTERN.test(href)) return;
      if (link.dataset.farixLocked === "1") return;
      link.dataset.farixLocked = "1";
      link.setAttribute("aria-disabled", "true");
      link.removeAttribute("target");
      link.style.pointerEvents = "none";
      link.style.opacity = "0.45";
    });
  };

  if (isFlowPage()) {
    neutralise(document.documentElement);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach((node) => neutralise(node));
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();
