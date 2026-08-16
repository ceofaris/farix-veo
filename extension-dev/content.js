(() => {
  "use strict";

  /*
   * Veo credit metering.
   *
   * Detection is deliberately disabled on the Flow listing page. A project
   * must finish loading and remain quiet before detection is armed. Everything
   * discovered before that point becomes baseline media and can never be
   * billed. New video sources appearing together are treated as one generation.
   */

  const PROJECT_PATH = /^\/fx\/tools\/flow\/project(?:\/|$)/;
  const BASELINE_MIN_MS = 10_000;
  const BASELINE_QUIET_MS = 3_000;
  const SOURCE_SETTLE_MS = 1_200;
  const GENERATION_BATCH_MS = 3_500;
  const GENERATION_COOLDOWN_MS = 8_000;

  let currentProjectUrl = "";
  let projectState = null;
  let warningElement = null;
  let statusElement = null;

  function isProjectPage() {
    return PROJECT_PATH.test(window.location.pathname);
  }

  function normalizeProjectUrl() {
    return `${window.location.origin}${window.location.pathname}`;
  }

  function mediaSource(video) {
    if (!(video instanceof HTMLVideoElement)) return "";

    const directSource =
      video.currentSrc ||
      video.src ||
      video.getAttribute("src") ||
      video.querySelector("source[src]")?.src ||
      video.querySelector("source[src]")?.getAttribute("src") ||
      "";

    return String(directSource).split("#")[0].trim().slice(0, 1000);
  }

  function mediaIdentity(video) {
    const source = mediaSource(video);
    if (source) return `src:${source}`;

    const stableId =
      video.getAttribute("data-generation-id") ||
      video.getAttribute("data-media-id") ||
      video.getAttribute("data-testid") ||
      video.id;

    return stableId ? `id:${stableId}` : "";
  }

  function isVisibleVideo(video) {
    if (!(video instanceof HTMLVideoElement)) return false;
    const rect = video.getBoundingClientRect();
    return Boolean(mediaSource(video)) && rect.width >= 160 && rect.height >= 90;
  }

  function clearProjectTimers(state) {
    if (!state) return;
    window.clearTimeout(state.baselineTimer);
    window.clearTimeout(state.candidateTimer);
    state.baselineTimer = 0;
    state.candidateTimer = 0;
  }

  function addCurrentMediaToBaseline(state) {
    if (!state || state !== projectState) return;

    document.querySelectorAll("video").forEach((video) => {
      const identity = mediaIdentity(video);
      if (identity) state.seenMedia.add(identity);
    });
  }

  function armDetectionWhenSettled(state) {
    if (!state || state !== projectState || state.armed || !isProjectPage()) return;

    addCurrentMediaToBaseline(state);
    window.clearTimeout(state.baselineTimer);

    const elapsed = Date.now() - state.enteredAt;
    const remainingMinimum = Math.max(0, BASELINE_MIN_MS - elapsed);
    const delay = Math.max(BASELINE_QUIET_MS, remainingMinimum);

    state.baselineTimer = window.setTimeout(() => {
      if (state !== projectState || !isProjectPage()) return;

      // Take one final snapshot at the exact moment detection becomes active.
      addCurrentMediaToBaseline(state);
      state.armed = true;
    }, delay);
  }

  function enterProject() {
    const projectUrl = normalizeProjectUrl();
    if (projectState && currentProjectUrl === projectUrl) return;

    clearProjectTimers(projectState);
    currentProjectUrl = projectUrl;
    projectState = {
      enteredAt: Date.now(),
      armed: false,
      blocked: false,
      baselineTimer: 0,
      candidateTimer: 0,
      cooldownUntil: 0,
      seenMedia: new Set(),
      pendingMedia: new Set()
    };

    addCurrentMediaToBaseline(projectState);
    armDetectionWhenSettled(projectState);
  }

  function leaveProject() {
    clearProjectTimers(projectState);
    currentProjectUrl = "";
    projectState = null;
  }

  function syncRoute() {
    if (!isProjectPage()) {
      leaveProject();
      return;
    }

    enterProject();
  }

  function submitGenerationBatch(state) {
    if (
      !state ||
      state !== projectState ||
      !state.armed ||
      state.blocked ||
      !isProjectPage() ||
      state.pendingMedia.size === 0
    ) {
      return;
    }

    const identities = [...state.pendingMedia].sort();
    state.pendingMedia.clear();
    state.candidateTimer = 0;
    state.cooldownUntil = Date.now() + GENERATION_COOLDOWN_MS;

    // All outputs that appeared in this short window belong to one generation.
    // The key is deterministic, and the background worker also deduplicates it.
    const generationKey = identities.join("|").slice(0, 4000);

    chrome.runtime.sendMessage(
      { type: "MEDIA_DETECTED", generationKey },
      (response) => {
        void chrome.runtime.lastError;
        if (state !== projectState) return;

        const result = response?.result;
        if (response?.ok && result?.deducted === false) {
          // A failed/insufficient deduction stops further requests for this
          // project visit. The background script already shows one warning.
          state.blocked = true;
          state.pendingMedia.clear();
          window.clearTimeout(state.candidateTimer);
          state.candidateTimer = 0;
        }
      }
    );
  }

  function queueNewVideo(video, state) {
    if (
      !state ||
      state !== projectState ||
      !state.armed ||
      state.blocked ||
      !isProjectPage()
    ) {
      return;
    }

    const identity = mediaIdentity(video);
    if (!identity || state.seenMedia.has(identity)) return;

    // Mark before any async work so repeated mutations for the same source can
    // never create repeated requests.
    state.seenMedia.add(identity);

    if (!isVisibleVideo(video)) return;
    if (Date.now() < state.cooldownUntil) return;

    state.pendingMedia.add(identity);
    if (state.candidateTimer) return;

    state.candidateTimer = window.setTimeout(
      () => submitGenerationBatch(state),
      GENERATION_BATCH_MS
    );
  }

  function inspectVideo(video) {
    const state = projectState;
    if (!state || !isProjectPage()) return;

    if (!state.armed) {
      addCurrentMediaToBaseline(state);
      armDetectionWhenSettled(state);
      return;
    }

    window.setTimeout(() => queueNewVideo(video, state), SOURCE_SETTLE_MS);
  }

  function inspectNode(node) {
    if (!(node instanceof Element)) return;
    if (node.matches("video")) inspectVideo(node);
    node.querySelectorAll?.("video").forEach(inspectVideo);
  }

  function handleMutations(mutations) {
    const previousProjectUrl = currentProjectUrl;
    syncRoute();

    // A route transition only establishes a baseline; never inspect the same
    // navigation mutation as a generation.
    if (!isProjectPage() || previousProjectUrl !== currentProjectUrl) return;

    const state = projectState;
    for (const mutation of mutations) {
      if (mutation.type === "attributes" && mutation.target instanceof HTMLVideoElement) {
        inspectVideo(mutation.target);
      }
      mutation.addedNodes.forEach(inspectNode);
    }

    if (state && !state.armed) armDetectionWhenSettled(state);
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
    // A visible warning is singleton, even if another extension context sends
    // the same warning while this one is already open.
    if (warningElement?.isConnected) return;

    ensureOverlayStyles();
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
    if (message?.type === "CREDIT_WARNING") showCreditWarning(message.message);
    if (message?.type === "CREDIT_UPDATE") {
      showCreditStatus(message.cost, message.credits);
    }
  });

  syncRoute();

  const observer = new MutationObserver(handleMutations);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src"]
  });

  window.addEventListener("popstate", syncRoute);
  window.addEventListener("hashchange", syncRoute);
})();