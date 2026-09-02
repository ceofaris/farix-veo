/*
 * Farix credit bridge (isolated world) for Google Flow / Veo.
 *
 * - Shows the remaining credit balance on the Flow page.
 * - Blocks generation when the balance is below 30 credits.
 * - Relays "video really completed" events to the background worker, which
 *   deducts 30 credits per successful video (idempotent per media id).
 */
(() => {
  "use strict";

  const COST = 30;
  const state = { credits: null, networkSeen: false, blocked: false };

  /* ------------------------------------------------------------- injection */

  try {
    const script = document.createElement("script");
    script.src = chrome.runtime.getURL("veo-credits-main.js");
    script.onload = () => script.remove();
    (document.head || document.documentElement).appendChild(script);
  } catch {
    /* ignore */
  }

  /* ------------------------------------------------------------------- UI */

  let pill;
  function ensurePill() {
    if (pill && pill.isConnected) return pill;
    pill = document.createElement("div");
    pill.id = "farix-credit-pill";
    pill.style.cssText = [
      "position:fixed",
      "right:16px",
      "bottom:16px",
      "z-index:2147483646",
      "padding:8px 14px",
      "border-radius:999px",
      "font:600 12px/1.2 system-ui,sans-serif",
      "color:#fff",
      "background:linear-gradient(135deg,#6d28d9,#db2777)",
      "box-shadow:0 8px 24px rgba(0,0,0,.28)",
      "pointer-events:none",
      "white-space:nowrap"
    ].join(";");
    (document.body || document.documentElement).appendChild(pill);
    return pill;
  }

  function render() {
    const node = ensurePill();
    if (state.credits === null) {
      node.textContent = "Farix • credits …";
      return;
    }
    node.textContent = `Farix • ${state.credits.toLocaleString("en-US")} credits`;
    node.style.background =
      state.credits < COST ? "linear-gradient(135deg,#b91c1c,#ef4444)" : "linear-gradient(135deg,#6d28d9,#db2777)";
  }

  let noticeTimer;
  function notice(text) {
    let box = document.getElementById("farix-credit-notice");
    if (!box) {
      box = document.createElement("div");
      box.id = "farix-credit-notice";
      box.style.cssText = [
        "position:fixed",
        "left:50%",
        "top:24px",
        "transform:translateX(-50%)",
        "z-index:2147483647",
        "padding:12px 18px",
        "border-radius:12px",
        "font:600 13px/1.35 system-ui,sans-serif",
        "color:#fff",
        "background:#b91c1c",
        "box-shadow:0 10px 30px rgba(0,0,0,.35)",
        "max-width:min(90vw,420px)",
        "text-align:center"
      ].join(";");
      (document.body || document.documentElement).appendChild(box);
    }
    box.textContent = text;
    box.style.display = "block";
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(() => {
      box.style.display = "none";
    }, 4000);
  }

  /* -------------------------------------------------------------- messaging */

  function send(message) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(message, (response) => {
          void chrome.runtime.lastError;
          resolve(response || null);
        });
      } catch {
        resolve(null);
      }
    });
  }

  async function refresh() {
    const res = await send({ type: "VEO_CREDIT_STATUS" });
    if (res?.ok && typeof res.credits === "number") {
      state.credits = res.credits;
      render();
    }
  }

  async function charge(jobId) {
    const res = await send({ type: "VEO_CHARGE_SUCCESS", jobId });
    if (res?.ok && typeof res.credits === "number") {
      state.credits = res.credits;
      render();
    }
  }

  window.addEventListener("message", (event) => {
    if (event.source !== window) return;
    const data = event.data;
    if (!data || data.source !== "farix-veo") return;
    if (data.type === "VEO_MEDIA_SUCCESS" && data.id) {
      state.networkSeen = true;
      void charge(data.id);
    }
  });

  /* ------------------------------------------------------ generation gate */

  const GENERATE_RE = /(generate|create|render|make video|send)/i;

  function isGenerateTarget(node) {
    let el = node instanceof Element ? node : node?.parentElement;
    let depth = 0;
    while (el && depth < 6) {
      const label = [
        el.getAttribute?.("aria-label"),
        el.getAttribute?.("title"),
        el.getAttribute?.("data-testid"),
        (el.textContent || "").trim().length <= 40 ? el.textContent : ""
      ]
        .filter(Boolean)
        .join(" ");
      if (label && GENERATE_RE.test(label)) return true;
      if (el.matches?.("button[type='submit']")) return true;
      el = el.parentElement;
      depth += 1;
    }
    return false;
  }

  function blockIfBroke(event) {
    if (state.credits === null || state.credits >= COST) return;
    if (!isGenerateTarget(event.target)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    notice(`Insufficient credits — you need at least ${COST} credits. Contact your reseller to top up.`);
    void refresh();
  }

  ["pointerdown", "mousedown", "click", "keydown"].forEach((type) => {
    document.addEventListener(
      type,
      (event) => {
        if (type === "keydown" && event.key !== "Enter") return;
        blockIfBroke(event);
      },
      true
    );
  });

  /* --------------------------------------------------- DOM success fallback */

  // Only used when the network detector never fired on this page, so a single
  // video can never be counted twice.
  const domSeen = new Set();
  const observer = new MutationObserver(() => {
    if (state.networkSeen) return;
    document.querySelectorAll("video[src]").forEach((video) => {
      const src = (video.getAttribute("src") || "").split("?")[0];
      if (!src || !/^https?:/.test(src) || domSeen.has(src)) return;
      if (!video.duration && video.readyState < 2) return;
      domSeen.add(src);
      setTimeout(() => {
        if (state.networkSeen) return;
        void charge(`dom:${src}`);
      }, 1500);
    });
  });

  function start() {
    render();
    void refresh();
    observer.observe(document.documentElement, { childList: true, subtree: true, attributes: true });
    setInterval(refresh, 60_000);
  }

  if (document.body) start();
  else document.addEventListener("DOMContentLoaded", start, { once: true });
})();
