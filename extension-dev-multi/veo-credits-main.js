/*
 * Farix credit detector (MAIN world) for Google Flow / Veo.
 *
 * Watches the Flow app's own network traffic and reports ONLY real completed
 * videos (successful status + a playable media result). Everything else
 * (pending, in-progress, failed, cancelled) is ignored, so nothing is charged.
 *
 * Detection is subtree based: Flow puts the status on a parent node and the
 * playable media URL on a nested child, so status + media are matched across
 * the whole branch instead of a single flat object.
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

  const SUCCESS_RE = /(SUCCE|COMPLETE|FINISH|READY|_DONE|^DONE$|^OK$)/i;
  const FAILURE_RE = /(FAIL|ERROR|CANCEL|PENDING|QUEUE|PROGRESS|RUNNING|PROCESS|MODERAT|BLOCK|REJECT|UNSPECIFIED)/i;
  const STATUS_KEY_RE = /status|state|phase/i;
  const MEDIA_KEY_RE =
    /(fifeUrl|servingBaseUri|videoUrl|videoUri|downloadUri|mediaUrl|playbackUrl|signedUri|gcsUri|^url$|^uri$)/i;
  const MEDIA_URL_RE = /^(https?:\/\/|gs:\/\/)/i;
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

  /** Success status found directly on this object (not on children). */
  function statusOf(node) {
    let result = null;
    for (const [k, v] of Object.entries(node)) {
      if (typeof v !== "string" || !STATUS_KEY_RE.test(k)) continue;
      if (FAILURE_RE.test(v)) return "fail";
      if (SUCCESS_RE.test(v)) result = "ok";
    }
    return result;
  }

  /** First playable media URL anywhere in this subtree. */
  function findMedia(node, depth) {
    if (!node || depth > 6) return null;
    if (Array.isArray(node)) {
      for (const child of node) {
        const hit = findMedia(child, depth + 1);
        if (hit) return hit;
      }
      return null;
    }
    if (typeof node !== "object") return null;
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === "string" && MEDIA_KEY_RE.test(k) && MEDIA_URL_RE.test(v) && v.length > 15) {
        return v;
      }
    }
    for (const v of Object.values(node)) {
      if (v && typeof v === "object") {
        const hit = findMedia(v, depth + 1);
        if (hit) return hit;
      }
    }
    return null;
  }

  function findId(node, url, depth) {
    if (!node || typeof node !== "object" || depth > 4) return null;
    for (const key of ID_KEYS) {
      const value = node[key];
      if (typeof value === "string" && value.length >= 6) return value;
    }
    for (const v of Object.values(node)) {
      if (v && typeof v === "object" && !Array.isArray(v)) {
        const hit = findId(v, url, depth + 1);
        if (hit) return hit;
      }
    }
    return url ? url.split("?")[0] : null;
  }

  function scan(node, depth) {
    if (!node || depth > 10) return;
    if (Array.isArray(node)) {
      node.forEach((child) => scan(child, depth + 1));
      return;
    }
    if (typeof node !== "object") return;

    const status = statusOf(node);
    if (status === "ok") {
      const url = findMedia(node, 0);
      if (url) {
        emit(findId(node, url, 0));
        return;
      }
    }

    for (const value of Object.values(node)) {
      if (value && typeof value === "object") scan(value, depth + 1);
    }
  }

  /** Last-resort parse for streamed / non-JSON payloads. */
  function scanText(text) {
    if (!/(fifeUrl|servingBaseUri|videoUri|videoUrl)/i.test(text)) return;
    if (!/(SUCCE|COMPLETE|READY|DONE)/i.test(text)) return;
    const ids = text.match(/"(?:mediaGenerationId|mediaId|videoId|generationId|operationName)"\s*:\s*"([^"]{6,})"/g);
    if (!ids) return;
    ids.forEach((raw) => {
      const value = raw.split(/"\s*:\s*"/)[1]?.replace(/"$/, "");
      if (value) emit(value);
    });
  }

  function inspect(text) {
    if (!text || text.length > 8_000_000) return;
    if (!/succe|complete|done|ready/i.test(text)) return;
    try {
      scan(JSON.parse(text), 0);
      return;
    } catch {
      /* not plain JSON */
    }
    // Streamed JSON lines / chunked responses.
    let parsedAny = false;
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim().replace(/^data:\s*/, "");
      if (trimmed.length < 2 || !/^[[{]/.test(trimmed)) continue;
      try {
        scan(JSON.parse(trimmed), 0);
        parsedAny = true;
      } catch {
        /* ignore */
      }
    }
    if (!parsedAny) scanText(text);
  }

  const originalFetch = window.fetch;
  window.fetch = async function farixFetch(...args) {
    const response = await originalFetch.apply(this, args);
    try {
      response
        .clone()
        .text()
        .then(inspect)
        .catch(() => {});
    } catch {
      /* ignore */
    }
    return response;
  };

  const originalSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function farixSend(...args) {
    this.addEventListener("load", () => {
      try {
        const type = this.responseType;
        if (type === "" || type === "text") inspect(this.responseText);
        else if (type === "json" && this.response) scan(this.response, 0);
      } catch {
        /* ignore */
      }
    });
    return originalSend.apply(this, args);
  };
})();
