import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  className?: string;
  /** Load/play only once the element scrolls near the viewport. */
  lazy?: boolean;
  poster?: string;
  maxRetries?: number;
};

/**
 * Video element with lightweight auto-retry: if the source errors, stalls, or
 * never starts playing, it reloads that single element (a few times, backing
 * off) instead of requiring a full page refresh.
 */
export function AutoVideo({
  src,
  className,
  lazy = true,
  poster,
  maxRetries = 3,
}: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);
  const retries = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [active, setActive] = useState(!lazy);

  // Only start fetching when close to the viewport.
  useEffect(() => {
    if (active) return;
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setActive(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setActive(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;

    let disposed = false;
    retries.current = 0;

    const clear = () => {
      if (timer.current) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };

    const tryPlay = () => {
      const p = el.play();
      if (p && typeof p.catch === "function") p.catch(() => scheduleRetry(1200));
    };

    const scheduleRetry = (delay: number) => {
      if (disposed || retries.current >= maxRetries) return;
      if (timer.current) return;
      timer.current = setTimeout(() => {
        timer.current = null;
        if (disposed) return;
        retries.current += 1;
        try {
          el.load();
        } catch {
          /* ignore */
        }
        tryPlay();
      }, delay);
    };

    const onError = () => scheduleRetry(800 * (retries.current + 1));
    const onStalled = () => scheduleRetry(2000);
    const onCanPlay = () => {
      clear();
      tryPlay();
    };
    const onPlaying = () => {
      retries.current = 0;
      clear();
    };

    el.addEventListener("error", onError);
    el.addEventListener("stalled", onStalled);
    el.addEventListener("suspend", onStalled);
    el.addEventListener("canplay", onCanPlay);
    el.addEventListener("playing", onPlaying);

    // Safety net: if playback hasn't begun shortly after mount, retry once.
    const watchdog = setTimeout(() => {
      if (!disposed && el.paused) scheduleRetry(0);
    }, 4000);

    if (el.src !== src) el.src = src;
    tryPlay();

    const onVisible = () => {
      if (document.visibilityState === "visible" && el.paused) tryPlay();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      disposed = true;
      clearTimeout(watchdog);
      clear();
      document.removeEventListener("visibilitychange", onVisible);
      el.removeEventListener("error", onError);
      el.removeEventListener("stalled", onStalled);
      el.removeEventListener("suspend", onStalled);
      el.removeEventListener("canplay", onCanPlay);
      el.removeEventListener("playing", onPlaying);
    };
  }, [active, src, maxRetries]);

  return (
    <video
      ref={ref}
      autoPlay
      className={className}
      controls={false}
      disablePictureInPicture
      loop
      muted
      playsInline
      poster={poster}
      preload={active ? "auto" : "none"}
      {...(active ? { src } : {})}
    />
  );
}
