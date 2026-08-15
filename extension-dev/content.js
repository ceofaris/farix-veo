(() => {
  "use strict";

  const seenVideos = new WeakSet();
  const sentKeys = new Set();
  let warningElement = null;
  let statusElement = null;

  function isFlowPage() {
    return /^\/fx\/tools\/flow(?:[/?#]|$)/.test(window.location.pathname);
  }

  function stableKey(video) {
    const source =
      video.currentSrc ||
      video.src ||
      video.getAttribute("src") ||
      video.getAttribute("poster") ||
      `${video.videoWidth}x${video.videoHeight}:${video.closest("main")?.textContent?.slice(0, 120) || ""}`;
    return source.trim().slice(0, 500);
  }

  function isVisibleVideo(video) {
    const rect = video.getBoundingClientRect();
    const hasSize = rect.width >= 96 && rect.height >= 96;
    const hasSource = Boolean(video.currentSrc || video.src || video.getAttribute("src"));
    return hasSize || (hasSource && rect.width > 0 && rect.height > 0);
  }

  function sendVideo(video) {
    if (!isFlowPage() || seenVideos.has(video) || !isVisibleVideo(video)) return;
    const key = stableKey(video);
    if (!key || sentKeys.has(key)) return;
    seenVideos.add(video);
    sentKeys.add(key);

    chrome.runtime.sendMessage(
      {
        type: "MEDIA_DETECTED",
        generationKey: key
      },
      () => void chrome.runtime.lastError
    );
  }

  function inspectVideo(video) {
    if (!(video instanceof HTMLVideoElement) || seenVideos.has(video)) return;
    if (isVisibleVideo(video)) {
      sendVideo(video);
      return;
    }

    window.setTimeout(() => sendVideo(video), 1200);
  }

  function scanAddedNode(node) {
    if (!(node instanceof Element)) return;
    if (node.matches("video")) inspectVideo(node);
    node.querySelectorAll?.("video").forEach(inspectVideo);
  }

  function ensureOverlayStyles() {
    if (document.getElementById("farix-veo-overlay-styles")) return;
    const style = document.createElement("style");
    style.id = "farix-veo-overlay-styles";
    style.textContent = `
      #farix-veo-warning, #farix-veo-status {
        position: fixed;
        z-index: 2147483647;
        right: 24px;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        box-shadow: 0 18px 50px rgba(4, 10, 28, .28);
      }
      #farix-veo-warning {
        top: 24px;
        max-width: 360px;
        padding: 18px 20px;
        color: #fff;
        border: 1px solid rgba(255,255,255,.16);
        border-radius: 16px;
        background: linear-gradient(135deg, #191d3a, #30245b);
      }
      #farix-veo-warning strong {
        display: block;
        margin-bottom: 6px;
        font-size: 14px;
        letter-spacing: .01em;
      }
      #farix-veo-warning span {
        display: block;
        color: #d9d8ee;
        font-size: 13px;
        line-height: 1.45;
      }
      #farix-veo-warning button {
        margin-top: 14px;
        padding: 8px 12px;
        color: #201742;
        border: 0;
        border-radius: 9px;
        background: #f0d6ff;
        font: inherit;
        font-size: 12px;
        font-weight: 700;
        cursor: pointer;
      }
      #farix-veo-status {
        bottom: 24px;
        padding: 10px 14px;
        color: #eef1ff;
        border: 1px solid rgba(144, 162, 255, .28);
        border-radius: 999px;
        background: rgba(25, 30, 64, .9);
        font-size: 12px;
        opacity: 0;
        transform: translateY(8px);
        transition: opacity .2s ease, transform .2s ease;
      }
      #farix-veo-status.visible {
        opacity: 1;
        transform: translateY(0);
      }
    `;
    document.documentElement.appendChild(style);
  }

  function showCreditWarning(message) {
    ensureOverlayStyles();
    warningElement?.remove();
    warningElement = document.createElement("div");
    warningElement.id = "farix-veo-warning";
    warningElement.innerHTML = `
      <strong>Generation paused</strong>
      <span></span>
      <button type="button">Dismiss</button>
    `;
    warningElement.querySelector("span").textContent = message;
    warningElement.querySelector("button").addEventListener("click", () => {
      warningElement?.remove();
      warningElement = null;
    });
    document.documentElement.appendChild(warningElement);
  }

  function showCreditStatus(cost, credits) {
    ensureOverlayStyles();
    statusElement?.remove();
    statusElement = document.createElement("div");
    statusElement.id = "farix-veo-status";
    statusElement.textContent = `${cost} credits used · ${credits} remaining`;
    document.documentElement.appendChild(statusElement);
    requestAnimationFrame(() => statusElement?.classList.add("visible"));
    window.setTimeout(() => {
      statusElement?.classList.remove("visible");
      window.setTimeout(() => statusElement?.remove(), 250);
    }, 3200);
  }

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "CREDIT_WARNING") {
      showCreditWarning(message.message);
    }
    if (message?.type === "CREDIT_UPDATE") {
      showCreditStatus(message.cost, message.credits);
    }
  });

  if (isFlowPage()) {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(scanAddedNode);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
})();