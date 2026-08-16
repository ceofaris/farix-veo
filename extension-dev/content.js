(() => {
  "use strict";

  /*
   * Credit metering for Google Flow.
   *
   * Rules:
   * - Credits are NEVER deducted on login, popup open, session inject or page load.
   * - Only a genuinely NEW generated video that appears while the page is open counts.
   *
   * To achieve that, every navigation starts a "baseline" window. Videos that
   * already exist (or appear immediately, i.e. previously generated results being
   * rendered) are recorded as seen and never billed.
   */

  const BASELINE_MS = 8000;
  const SETTLE_MS = 1500;

  const seenVideos = new WeakSet();
  const sentKeys = new Set();
  let baselineUntil = Date.now() + BASELINE_MS;
  let lastUrl = location.href;
  let warningElement = null;
  let statusElement = null;

  function isFlowPage() {
    return /^\/fx\/tools\/flow(?:[/?#]|$)/.test(window.location.pathname);
  }

  function inBaseline() {
    return Date.now() < baselineUntil;
  }

  function resetBaseline() {
    baselineUntil = Date.now() + BASELINE_MS;
    // Snapshot whatever is already rendered so it can never be billed.
    document.querySelectorAll("video").forEach(markSeen);
  }

  function markSeen(video) {
    if (!(video instanceof HTMLVideoElement)) return;
    seenVideos.add(video);
    const key = stableKey(video);
    if (key) sentKeys.add(key);
  }

  function stableKey(video) {
    const source = video.currentSrc || video.src || video.getAttribute("src") || "";
    if (!source) return "";
    return source.split("#")[0].trim().slice(0, 500);
  }

  function isGeneratedVideo(video) {
    const rect = video.getBoundingClientRect();
    const hasSource = Boolean(video.currentSrc || video.src || video.getAttribute("src"));
    return hasSource && rect.width >= 160 && rect.height >= 90;
  }

  function reportGeneration(video) {
    if (!isFlowPage() || seenVideos.has(video)) return;
    if (!isGeneratedVideo(video)) return;

    const key = stableKey(video);
    if (!key || sentKeys.has(key)) return;

    seenVideos.add(video);
    sentKeys.add(key);

    if (inBaseline()) return; // pre-existing content, not a new generation

    chrome.runtime.sendMessage(
      { type: "MEDIA_DETECTED", generationKey: key },
      () => void chrome.runtime.lastError,
    );
  }

  function inspectVideo(video) {
    if (!(video instanceof HTMLVideoElement) || seenVideos.has(video)) return;
    if (inBaseline()) {
      // Give the src a moment to attach, then record it as baseline content.
      window.setTimeout(() => {
        if (inBaseline()) markSeen(video);
        else reportGeneration(video);
      }, SETTLE_MS);
      return;
    }
    // Wait for the source to attach before billing.
    window.setTimeout(() => reportGeneration(video), SETTLE_MS);
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
      <strong>Not enough credits</strong>
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
    resetBaseline();

    const observer = new MutationObserver((mutations) => {
      if (lastUrl !== location.href) {
        lastUrl = location.href;
        resetBaseline();
      }
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(scanAddedNode);
      }
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });

    document.addEventListener("DOMContentLoaded", resetBaseline, { once: true });
    window.addEventListener("load", () => {
      document.querySelectorAll("video").forEach((video) => {
        if (inBaseline()) markSeen(video);
      });
    });
  }
})();
