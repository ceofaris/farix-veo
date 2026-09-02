/*
 * Farix credit detector (MAIN world) for Google Flow / Veo.
 *
 * Watches the Flow app's own network traffic and reports ONLY real completed
 * videos (successful status + a playable media result). Everything else
 * (pending, in-progress, failed, cancelled) is ignored, so nothing is charged.
 *
 * It never charges anything itself — it posts the media id to the isolated
 * content script, which asks the background worker to deduct credits. The
 * deduction is idempotent per media id in the database.
 */
(() => {
  "use strict";
  if (window.__farixVeoCredits) return;
  window.__farixVeoCredits = true;

  const seen = new Set();

  function emit(id) {
    const key = String(id || "").trim();
    if (!key || seen.has(key)) return;
    seen.add(key);
    window.postMessage({ source: "farix-veo", type: "VEO_MEDIA_SUCCESS", id: key }, "*");
  }

  const SUCCESS_RE = /(SUCCE|COMPLETE|FINISH|READY|_DONE|^DONE$)/i;
  const FAILURE_RE = /(FAIL|ERROR|CANCEL|PENDING|QUEUE|PROGRESS|RUNNING|PROCESS|MODERAT|BLOCK)/i;
  const MEDIA_KEYS = [
    "fifeUrl",
    "servingBaseUri",
    "videoUrl",
    "videoUri",
    "downloadUri",
    "mediaUrl",
    "playbackUrl",
    "url",
    "uri"
  ];
  const ID_KEYS = [
    "mediaGenerationId",
    "mediaId",
    "videoId",
    "generationId",
    "operationName",
    "workflowId",
    "sceneId",
    "name",
    "id"
  ];

  function successStatus(obj) {
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v !== "string") continue;
      if (!/status|state|phase/i.test(k)) continue;
      if (FAILURE_RE.test(v)) return false;
      if (SUCCESS_RE.test(v)) return true;
    }
    return false;
  }

  function mediaUrl(obj) {
    for (const key of MEDIA_KEYS) {
      const value = obj[key];
      if (typeof value === "string" && /^https?:\/\//.test(value) && /\.(mp4|webm)|video|media/i.test(value)) {
        return value;
      }
    }
    return null;
  }

  function idOf(obj, url) {
    for (const key of ID_KEYS) {
      const value = obj[key];
      if (typeof value === "string" && value.length >= 6) return value;
    }
    return url ? url.split("?")[0] : null;
  }

  function scan(node, depth) {
    if (!node || depth > 8) return;
    if (Array.isArray(node)) {
      node.forEach((child) => scan(child, depth + 1));
      return;
    }
    if (typeof node !== "object") return;

    const url = mediaUrl(node);
    if (url && successStatus(node)) emit(idOf(node, url));

    for (const value of Object.values(node)) {
      if (value && typeof value === "object") scan(value, depth + 1);
    }
  }

  function inspect(text) {
    if (!text || text.length > 4_000_000) return;
    if (!/succe|complete|done|ready/i.test(text)) return;
    try {
      scan(JSON.parse(text), 0);
    } catch {
      /* not JSON — ignore */
    }
  }

  const originalFetch = window.fetch;
  window.fetch = async function farixFetch(...args) {
    const response = await originalFetch.apply(this, args);
    try {
      const contentType = response.headers.get("content-type") || "";
      if (/json/i.test(contentType)) {
        response
          .clone()
          .text()
          .then(inspect)
          .catch(() => {});
      }
    } catch {
      /* ignore */
    }
    return response;
  };

  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function farixSend(...args) {
    this.addEventListener("load", () => {
      try {
        if (this.responseType === "" || this.responseType === "text") inspect(this.responseText);
      } catch {
        /* ignore */
      }
    });
    return originalSend.apply(this, args);
  };
})();
