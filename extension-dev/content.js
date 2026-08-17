(() => {
  "use strict";

  // Competitor-style detection: DOM <video> baseline seeding, no network hooks.
  const SEED_MS = 4000;

  let warningElement = null;
  let statusElement = null;
  let warned = false;

  /** @type {{ key: string, knownMediaKeys: Set<string>, seeding: boolean, seedTimer: number, blocked: boolean } | null} */
  let projectState = null;

  function projectKey() {
    const match = location.pathname.match(/^\/fx\/tools\/flow\/project\/([^/?#]+)/);
    return match ? match[1] : "";
  }

  function isProjectPage() {
    return location.hostname === "labs.google" && Boolean(projectKey());
  }

  function mediaKey(video) {
    const src = video?.currentSrc || video?.getAttribute("src") || video?.src || "";
    if (!src || src.startsWith("data:")) return "";
    return `v:${src}`;
  }

  function seedAll(state) {
    document.querySelectorAll("video").forEach((video) => {
      const key = mediaKey(video);
      if (key) state.knownMediaKeys.add(key);
    });
  }

  function startProject(key) {
    const state = {
      key,
      knownMediaKeys: new Set(),
      seeding: true,
      seedTimer: 0,
      blocked: false
    };
    projectState = state;
    seedAll(state);

    // Keep re-seeding across the whole seeding window: Flow hydrates lazily.
    const interval = window.setInterval(() => {
      if (projectState !== state) {
        window.clearInterval(interval);
        return;
      }
      seedAll(state);
    }, 400);

    state.seedTimer = window.setTimeout(() => {
      window.clearInterval(interval);
      if (projectState !== state) return;
      seedAll(state);
      state.seeding = false;
    }, SEED_MS);
  }

  function syncRoute() {
    if (!isProjectPage()) {
      projectState = null;
      return;
    }
    const key = projectKey();
    if (projectState?.key === key) return;
    startProject(key);
  }

  function reportGeneration(state, key) {
    // Mark known before the round-trip so a re-render can never double bill.
    state.knownMediaKeys.add(key);
    if (state.blocked) return;

    chrome.runtime.sendMessage({ type: "MEDIA_DETECTED", generationKey: key }, (response) => {
      void chrome.runtime.lastError;
      if (projectState !== state) return;
      if (!response?.ok || response?.result?.deducted === false) state.blocked = true;
    });
  }

  function considerVideo(video) {
    syncRoute();
    const state = projectState;
    if (!state || !isProjectPage()) return;

    const key = mediaKey(video);
    if (!key) return;
    if (state.knownMediaKeys.has(key)) return;

    if (state.seeding) {
      state.knownMediaKeys.add(key);
      return;
    }

    reportGeneration(state, key);
  }

  function videosInNode(node) {
    if (!(node instanceof Element)) return [];
    const videos = [];
    if (node instanceof HTMLVideoElement) videos.push(node);
    node.querySelectorAll?.("video").forEach((video) => videos.push(video));
    return videos;
  }

  function handleMutations(mutations) {
    syncRoute();
    if (!projectState) return;
    for (const mutation of mutations) {
      const videos =
        mutation.type === "attributes" && mutation.target instanceof HTMLVideoElement
          ? [mutation.target]
          : [...mutation.addedNodes].flatMap(videosInNode);
      videos.forEach(considerVideo);
    }
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
    if (warned && warningElement?.isConnected) return;
    if (warningElement?.isConnected) return;
    warned = true;
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

  document.addEventListener(
    "loadeddata",
    (event) => {
      if (event.target instanceof HTMLVideoElement) considerVideo(event.target);
    },
    true
  );
  document.addEventListener(
    "play",
    (event) => {
      if (event.target instanceof HTMLVideoElement) considerVideo(event.target);
    },
    true
  );

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
