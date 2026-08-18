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

  function showToast(text = "Account is locked on managed session") {
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

  function blockIfNeeded(event) {
    if (!managedActive || !isAccountControl(event.target)) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    showToast();
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "SESSION_STATE") managedActive = Boolean(message.active);
  });

  chrome.runtime.sendMessage({ type: "GET_STATE" }, (response) => {
    void chrome.runtime.lastError;
    managedActive = Boolean(response?.ok && response.state?.active);
  });

  document.addEventListener("click", blockIfNeeded, true);
  document.addEventListener("pointerdown", blockIfNeeded, true);
  document.addEventListener("keydown", (event) => {
    if (
      managedActive &&
      (event.key === "Enter" || event.key === " ") &&
      isAccountControl(event.target)
    ) {
      event.preventDefault();
      event.stopImmediatePropagation();
      showToast();
    }
  }, true);
})();