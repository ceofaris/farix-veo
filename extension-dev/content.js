(() => {
  "use strict";

  /*
   * Veo generation metering.
   *
   * Billing is deliberately guarded by two independent conditions:
   *   1. the tab is inside a concrete Flow project editor; and
   *   2. the user has just started a generation from that editor.
   *
   * Existing/lazily-loaded project media is always learned without billing.
   * A generation's newly-created video outputs are batched into one message.
   */

  const PROJECT_PATH = /^\/fx\/tools\/flow\/project\/[^/?#]+(?:\/|$)/;
  const BASELINE_MIN_MS = 2_000;
  const BASELINE_QUIET_MS = 1_800;
  const BASELINE_MAX_MS = 15_000;
  const SOURCE_SETTLE_MS = 900;
  const OUTPUT_BATCH_MS = 2_500;
  const GENERATION_INTENT_MS = 15 * 60 * 1000;

  let projectState = null;
  let warningElement = null;
  let statusElement = null;

  function isProjectPage() {
    return PROJECT_PATH.test(window.location.pathname);
  }

  function projectKey() {
    return isProjectPage() ? `${window.location.origin}${window.location.pathname}` : "";
  }

  function mediaSource(video) {
    if (!(video instanceof HTMLVideoElement)) return "";
    const source =
      video.currentSrc ||
      video.src ||
      video.getAttribute("src") ||
      video.querySelector("source[src]")?.src ||
      video.querySelector("source[src]")?.getAttribute("src") ||
      "";
    return String(source).split("#")[0].trim().slice(0, 1600);
  }

  function mediaKey(video) {
    const source = mediaSource(video);
    if (source) return `src:${source}`;

    const stableId =
      video.getAttribute("data-generation-id") ||
      video.getAttribute("data-media-id") ||
      video.getAttribute("data-testid") ||
      video.id;
    return stableId ? `id:${stableId}` : "";
  }

  function isActualVideoOutput(video) {
    if (!(video instanceof HTMLVideoElement) || !mediaSource(video)) return false;
    const rect = video.getBoundingClientRect();
    if (rect.width < 240 || rect.height < 120) return false;
    if (video.closest('[aria-hidden="true"], [hidden]')) return false;
    return true;
  }

  function clearStateTimers(state) {
    if (!state) return;
    window.clearTimeout(state.baselineTimer);
    window.clearTimeout(state.baselineMaxTimer);
    window.clearTimeout(state.outputTimer);
    state.baselineTimer = 0;
    state.baselineMaxTimer = 0;
    state.outputTimer = 0;
  }

  function snapshotCurrentMedia(state) {
    if (!state || state !== projectState) return;
    document.querySelectorAll("video").forEach((video) => {
      const key = mediaKey(video);
      if (key) state.knownMediaKeys.add(key);
    });
  }

  function finishBaseline(state) {
    if (!state || state !== projectState || state.ready || !isProjectPage()) return;
    snapshotCurrentMedia(state);
    state.ready = true;
    window.clearTimeout(state.baselineTimer);
    window.clearTimeout(state.baselineMaxTimer);
    state.baselineTimer = 0;
    state.baselineMaxTimer = 0;
  }

  function scheduleBaseline(state) {
    if (!state || state !== projectState || state.ready || !isProjectPage()) return;
    snapshotCurrentMedia(state);
    window.clearTimeout(state.baselineTimer);

    const elapsed = Date.now() - state.enteredAt;
    const delay = Math.max(BASELINE_QUIET_MS, BASELINE_MIN_MS - elapsed);
    state.baselineTimer = window.setTimeout(() => finishBaseline(state), delay);
  }

  function enterProject(key) {
    clearStateTimers(projectState);
    projectState = {
      key,
      enteredAt: Date.now(),
      ready: false,
      blocked: false,
      baselineTimer: 0,
      baselineMaxTimer: 0,
      outputTimer: 0,
      generationIntentUntil: 0,
      knownMediaKeys: new Set(),
      pendingOutputKeys: new Set()
    };
    snapshotCurrentMedia(projectState);
    scheduleBaseline(projectState);
    projectState.baselineMaxTimer = window.setTimeout(
      () => finishBaseline(projectState),
      BASELINE_MAX_MS
    );
  }

  function syncRoute() {
    const key = projectKey();
    if (!key) {
      clearStateTimers(projectState);
      projectState = null;
      return;
    }
    if (!projectState || projectState.key !== key) enterProject(key);
  }

  function hasGenerationIntent(state) {
    return Boolean(state && Date.now() <= state.generationIntentUntil);
  }

  function markGenerationIntent(event) {
    syncRoute();
    const state = projectState;
    if (!state || !state.ready || state.blocked || !isProjectPage()) return;

    const path = typeof event.composedPath === "function" ? event.composedPath() : [];
    const control = path.find(
      (node) =>
        node instanceof HTMLElement &&
        (node.matches("button, [role='button']") || node.getAttribute("type") === "submit")
    );
    if (!(control instanceof HTMLElement)) return;

    const label = `${control.innerText || ""} ${control.getAttribute("aria-label") || ""} ${control.getAttribute("title") || ""}`
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();

    // Flow changes labels periodically. These terms cover create/generate,
    // retry, extend and submit controls while explicitly excluding New project.
    if (!/(generate|create|submit|send|retry|redo|extend)/i.test(label)) return;
    if (/new project/i.test(label)) return;

    state.generationIntentUntil = Date.now() + GENERATION_INTENT_MS;
    state.pendingOutputKeys.clear();
    window.clearTimeout(state.outputTimer);
    state.outputTimer = 0;
  }

  function submitOutputBatch(state) {
    if (
      !state ||
      state !== projectState ||
      !state.ready ||
      state.blocked ||
      !isProjectPage() ||
      !hasGenerationIntent(state) ||
      state.pendingOutputKeys.size === 0
    ) {
      return;
    }

    const outputKeys = [...state.pendingOutputKeys].sort();
    state.pendingOutputKeys.clear();
    state.outputTimer = 0;
    // Consume the intent before messaging so this generation can never send a
    // second request, even if Flow re-renders the output during the RPC.
    state.generationIntentUntil = 0;
    const generationKey = `${state.key}|${outputKeys.join("|")}`.slice(0, 5000);

    chrome.runtime.sendMessage({ type: "MEDIA_DETECTED", generationKey }, (response) => {
      void chrome.runtime.lastError;
      if (state !== projectState) return;
      if (!response?.ok || response?.result?.deducted === false) {
        state.blocked = true;
        state.pendingOutputKeys.clear();
        window.clearTimeout(state.outputTimer);
        state.outputTimer = 0;
      }
    });
  }

  function inspectVideoAfterSettling(video, state) {
    window.setTimeout(() => {
      if (!state || state !== projectState || !isProjectPage()) return;
      const key = mediaKey(video);
      if (!key || state.knownMediaKeys.has(key)) return;

      // Learn every source immediately. Media that appears without an active
      // generation intent is old/lazy UI media and can never be billed later.
      state.knownMediaKeys.add(key);
      if (!state.ready || !hasGenerationIntent(state) || !isActualVideoOutput(video)) return;

      state.pendingOutputKeys.add(key);
      if (!state.outputTimer) {
        state.outputTimer = window.setTimeout(() => submitOutputBatch(state), OUTPUT_BATCH_MS);
      }
    }, SOURCE_SETTLE_MS);
  }

  function videosInNode(node) {
    if (!(node instanceof Element)) return [];
    const videos = [];
    if (node instanceof HTMLVideoElement) videos.push(node);
    node.querySelectorAll?.("video").forEach((video) => videos.push(video));
    return videos;
  }

  function handleMutations(mutations) {
    const previousKey = projectState?.key || "";
    syncRoute();
    const state = projectState;
    if (!state || state.key !== previousKey || !isProjectPage()) return;

    let mediaChanged = false;
    for (const mutation of mutations) {
      const videos =
        mutation.type === "attributes" && mutation.target instanceof HTMLVideoElement
          ? [mutation.target]
          : [...mutation.addedNodes].flatMap(videosInNode);
      if (videos.length) mediaChanged = true;

      if (!state.ready) {
        videos.forEach((video) => {
          const key = mediaKey(video);
          if (key) state.knownMediaKeys.add(key);
        });
      } else {
        videos.forEach((video) => inspectVideoAfterSettling(video, state));
      }
    }
    if (!state.ready && mediaChanged) scheduleBaseline(state);
  }

  function ensureOverlayStyles() {
    if (document.getElementById("farix-veo-overlay-styles")) return;
    const style = document.createElement("style");
    style.id = "farix-veo-overlay-styles";
    style.textContent = `
      #farix-veo-warning, #farix-veo-status { position: fixed; z-index: 2147483647; right: 24px; font-family: Inter, ui-sans-serif, system-ui, sans-serif; box-shadow: 0 18px 50px rgba(4,10,28,.28); }
      #farix-veo-warning { top: 24px; max-width: 360px; padding: 18px 20px; color: #fff; border: 1px solid rgba(255,255,255,.16); border-radius: 16px; background: linear-gradient(135deg,#191d3a,#30245b); }
      #farix-veo-warning strong { display:block; margin-bottom:6px; font-size:14px; }
      #farix-veo-warning span { display:block; color:#d9d8ee; font-size:13px; line-height:1.45; }
      #farix-veo-warning button { margin-top:14px; padding:8px 12px; color:#201742; border:0; border-radius:9px; background:#f0d6ff; font:inherit; font-size:12px; font-weight:700; cursor:pointer; }
      #farix-veo-status { bottom:24px; padding:10px 14px; color:#eef1ff; border:1px solid rgba(144,162,255,.28); border-radius:999px; background:rgba(25,30,64,.9); font-size:12px; opacity:0; transform:translateY(8px); transition:opacity .2s ease,transform .2s ease; }
      #farix-veo-status.visible { opacity:1; transform:translateY(0); }
    `;
    document.documentElement.appendChild(style);
  }

  function showCreditWarning(message) {
    if (warningElement?.isConnected) return;
    ensureOverlayStyles();
    warningElement = document.createElement("div");
    warningElement.id = "farix-veo-warning";
    warningElement.innerHTML = "<strong>Not enough credits</strong><span></span><button type='button'>Dismiss</button>";
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
    if (message?.type === "CREDIT_UPDATE") showCreditStatus(message.cost, message.credits);
  });

  document.addEventListener("click", markGenerationIntent, true);
  document.addEventListener("submit", markGenerationIntent, true);
  window.addEventListener("popstate", syncRoute);
  window.addEventListener("hashchange", syncRoute);

  syncRoute();
  const observer = new MutationObserver(handleMutations);
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["src"]
  });
})();