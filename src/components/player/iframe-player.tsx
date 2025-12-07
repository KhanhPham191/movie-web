"use client";

import {
  useMemo,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { Loader2, AlertCircle, RefreshCw, FastForward, Rewind } from "lucide-react";

interface IframePlayerProps {
  src: string;
  title?: string;
  className?: string;
  allowAds?: boolean;
}

type GestureMode = "none" | "horizontal" | "vertical-left" | "vertical-right";

interface GestureState {
  startX: number;
  startY: number;
  mode: GestureMode;
  initialTime: number;
}

const ADBLOCK_PARAMS: Record<string, string> = {
  ads: "false",
  adblock: "1",
  noads: "1",
  ad: "false",
  advertisement: "false",
  hidead: "true",
  hideads: "true",
  skiphttps: "true",
  no_ads: "true",
  skip_ads: "true",
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function IframePlayer({
  src,
  title = "Player",
  className = "w-full h-full",
  allowAds = false,
}: IframePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const gestureRef = useRef<GestureState | null>(null);
  const videoControlRef = useRef<{
    currentTime: number;
    duration: number;
    video: HTMLVideoElement | null;
  }>({ currentTime: 0, duration: 0, video: null });

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [hud, setHud] = useState<string | null>(null);

  const enhancedSrc = useMemo(() => {
    if (!src) return "";

    try {
      const url = new URL(src);
      if (!allowAds) {
        Object.entries(ADBLOCK_PARAMS).forEach(([key, value]) => {
          if (!url.searchParams.has(key)) {
            url.searchParams.append(key, value);
          }
        });
      }
      return url.toString();
    } catch {
      if (allowAds) return src;
      const separator = src.includes("?") ? "&" : "?";
      const params = new URLSearchParams(ADBLOCK_PARAMS);
      return `${src}${separator}${params.toString()}`;
    }
  }, [src, allowAds]);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    setRetry((prev) => prev + 1);
  }, []);

  const showHud = useCallback((text: string) => {
    setHud(text);
    window.clearTimeout((showHud as any)._t);
    (showHud as any)._t = window.setTimeout(() => setHud(null), 700);
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !enhancedSrc) return;

    const handleLoad = () => {
      setIsLoading(false);
      setHasError(false);
      
      // Try to find video element in iframe for controls
      setTimeout(() => {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (doc) {
            const video = doc.querySelector('video') as HTMLVideoElement;
            if (video) {
              videoControlRef.current.video = video;
              videoControlRef.current.duration = video.duration || 0;
              videoControlRef.current.currentTime = video.currentTime || 0;
              
              // Ensure video is visible and fills container
              video.style.width = '100%';
              video.style.height = '100%';
              video.style.objectFit = 'contain';
              video.style.display = 'block';
              
              // Ensure parent containers are visible
              let parent = video.parentElement;
              while (parent && parent !== doc.body) {
                parent.style.width = '100%';
                parent.style.height = '100%';
                parent.style.display = 'block';
                parent.style.position = 'relative';
                parent = parent.parentElement;
              }
              
              // Listen to time updates
              video.addEventListener('timeupdate', () => {
                videoControlRef.current.currentTime = video.currentTime;
              });
              
              video.addEventListener('loadedmetadata', () => {
                videoControlRef.current.duration = video.duration || 0;
              });
            }
          }
        } catch (e) {
          // Cross-origin, can't access
        }
      }, 1000);
    };

    const handleError = () => {
      setIsLoading(false);
      setHasError(true);
    };

    iframe.addEventListener("load", handleLoad);
    iframe.addEventListener("error", handleError);

    const timeout = setTimeout(() => {
      if (isLoading) setIsLoading(false);
    }, 10000);

    return () => {
      iframe.removeEventListener("load", handleLoad);
      iframe.removeEventListener("error", handleError);
      clearTimeout(timeout);
    };
  }, [enhancedSrc, isLoading, retry]);

  useEffect(() => {
    if (allowAds || !iframeRef.current) return;

    let active = true;
    let lastCleanup = 0;
    const CLEANUP_WINDOW = 1000;

    const removeAds = (doc: Document) => {
      const now = Date.now();
      if (now - lastCleanup < CLEANUP_WINDOW) return;
      lastCleanup = now;

      try {
        // Protect video elements and their containers
        const video = doc.querySelector('video');
        const videoParents: HTMLElement[] = [];
        if (video) {
          let parent = video.parentElement;
          while (parent && parent !== doc.body) {
            videoParents.push(parent);
            parent = parent.parentElement;
          }
        }

        // Remove ads and overlays, but protect video-related elements
        doc.querySelectorAll("iframe, div, ins, span, button").forEach((node) => {
          const target = node as HTMLElement;
          
          // Skip if it's a video element or its parent
          if (target === video || videoParents.includes(target)) {
            return;
          }
          
          // Skip if it contains video
          if (target.querySelector('video')) {
            return;
          }

          const text = target.textContent?.toLowerCase() || "";
          const haystack = `${target.id} ${target.className} ${target.getAttribute('data-name') || ''}`.toLowerCase();
          const style = window.getComputedStyle(target);
          const zIndex = parseInt(style.zIndex) || 0;
          
          // Skip player-related elements
          if (
            haystack.includes("player") ||
            haystack.includes("video") ||
            haystack.includes("jwplayer") ||
            haystack.includes("plyr") ||
            haystack.includes("vjs")
          ) {
            return;
          }

          // Only remove if it's clearly an ad/overlay
          if (
            (haystack.includes("ad") && !haystack.includes("advance") && !haystack.includes("add")) ||
            (haystack.includes("ads") && !haystack.includes("adsby")) ||
            haystack.includes("advert") ||
            haystack.includes("bet") ||
            haystack.includes("casino") ||
            (haystack.includes("overlay") && !haystack.includes("player")) ||
            (haystack.includes("popup") && !haystack.includes("player")) ||
            (haystack.includes("modal") && !haystack.includes("player")) ||
            text.includes("quảng cáo") ||
            text.includes("advertisement") ||
            (zIndex > 9999 && (style.position === 'fixed' || style.position === 'absolute') && 
             !haystack.includes("player") && !haystack.includes("video"))
          ) {
            // Only hide, don't remove to avoid breaking layout
            target.style.display = "none";
            target.style.visibility = "hidden";
            target.style.opacity = "0";
            target.style.pointerEvents = "none";
            target.style.width = "0";
            target.style.height = "0";
          }
        });
      } catch {
        // ignore cross-origin errors
      }
    };

    const clickSkipButtons = (doc: Document) => {
      const selectors = [
        'button[class*="skip"]',
        'button[id*="skip"]',
        '[aria-label*="skip"]',
        '[aria-label*="Skip"]',
        '[aria-label*="Bỏ qua"]',
        '.skip-ads',
        '#skip-ads',
        '[class*="skip-ad"]',
      ];

      selectors.forEach((selector) => {
        doc.querySelectorAll(selector).forEach((el) => {
          if (el instanceof HTMLElement) {
            el.click();
            el.remove();
          }
        });
      });
    };

    const inject = () => {
      if (!active) return;
      const doc =
        iframeRef.current?.contentDocument ||
        iframeRef.current?.contentWindow?.document;

      if (!doc) return;

      const style = doc.createElement("style");
      style.id = "iframe-ad-block";
      style.textContent = `
        /* Protect video elements */
        video, [class*="player"]:not([class*="ad"]), [id*="player"]:not([id*="ad"]),
        [class*="video"]:not([class*="ad"]), [id*="video"]:not([id*="ad"]) {
          display: block !important;
          visibility: visible !important;
          width: 100% !important;
          height: 100% !important;
          opacity: 1 !important;
          position: relative !important;
          z-index: 1 !important;
        }
        
        /* Hide ads and overlays, but exclude player-related */
        [class*="ad"]:not([class*="advance"]):not([class*="add"]):not([class*="player"]),
        [id*="ad"]:not([id*="advance"]):not([id*="add"]):not([id*="player"]),
        [class*="ads"]:not([class*="adsby"]):not([class*="player"]),
        [class*="adv"]:not([class*="advance"]):not([class*="player"]),
        [class*="banner"]:not([class*="player"]),
        [class*="popup"]:not([class*="player"]):not([class*="popup-player"]),
        [class*="sponsor"]:not([class*="player"]),
        [class*="overlay"]:not([class*="player"]):not([class*="video-overlay"]),
        [id*="overlay"]:not([id*="player"]):not([id*="video-overlay"]),
        [class*="advert"]:not([class*="player"]),
        [data-ad-slot], [data-ad-client],
        ins.adsbygoogle, 
        iframe[src*="ads"]:not([src*="player"]), 
        iframe[src*="advert"]:not([src*="player"]),
        div[class*="modal"]:not([class*="player"]):not([class*="video-modal"]),
        div[id*="modal"]:not([id*="player"]):not([id*="video-modal"]) {
          display: none !important;
          visibility: hidden !important;
          width: 0 !important;
          height: 0 !important;
          opacity: 0 !important;
          pointer-events: none !important;
        }
        
        /* Remove high z-index overlays, but protect video */
        [style*="position: fixed"]:not([class*="player"]):not([id*="player"]):not([class*="video"]):not([id*="video"]) {
          z-index: -1 !important;
        }
        
        /* Ensure video container fills space */
        body, html {
          width: 100% !important;
          height: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
        }
        
        /* Make sure video player container is visible */
        [class*="player"], [id*="player"], [class*="video-container"], [id*="video-container"] {
          width: 100% !important;
          height: 100% !important;
          display: block !important;
          position: relative !important;
        }
      `;

      doc.head?.appendChild(style);
      removeAds(doc);
      clickSkipButtons(doc);

      observerRef.current = new MutationObserver(() => {
        removeAds(doc);
        clickSkipButtons(doc);
      });

      observerRef.current.observe(doc.body || doc.documentElement, {
        childList: true,
        subtree: true,
      });

      intervalRef.current = setInterval(() => {
        removeAds(doc);
        clickSkipButtons(doc);
      }, 2000);
    };

    timeoutRefs.current.push(setTimeout(inject, 400));
    timeoutRefs.current.push(setTimeout(inject, 1000));

    return () => {
      active = false;
      observerRef.current?.disconnect();
      observerRef.current = null;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      timeoutRefs.current.forEach(clearTimeout);
      timeoutRefs.current = [];
    };
  }, [allowAds, enhancedSrc, retry]);

  // Gesture controls for seeking
  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (!container) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const video = videoControlRef.current.video;
    const initialTime = video ? video.currentTime : videoControlRef.current.currentTime;

    gestureRef.current = {
      startX,
      startY,
      mode: "none",
      initialTime,
    };

    container.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    const gesture = gestureRef.current;
    if (!container || !gesture) return;

    const dx = e.clientX - gesture.startX;
    const dy = e.clientY - gesture.startY;

    if (gesture.mode === "none") {
      const threshold = 10;
      if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return;

      if (Math.abs(dx) > Math.abs(dy)) {
        gesture.mode = "horizontal";
      } else {
        const rect = container.getBoundingClientRect();
        const isLeft = e.clientX < rect.left + rect.width / 2;
        gesture.mode = isLeft ? "vertical-left" : "vertical-right";
      }
    }

    if (gesture.mode === "horizontal") {
      const video = videoControlRef.current.video;
      const duration = video ? video.duration : videoControlRef.current.duration || 100;
      const deltaSeconds = (dx / 80) * 10; // 80px ~ 10s
      const newTime = clamp(gesture.initialTime + deltaSeconds, 0, duration);
      
      if (video) {
        try {
          video.currentTime = newTime;
        } catch (e) {
          // May fail if video not ready
        }
      }
      
      const icon = dx > 0 ? "⏩" : "⏪";
      const seconds = Math.round(newTime);
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      showHud(`${icon} ${minutes}:${secs.toString().padStart(2, '0')}`);
      return;
    }

    if (gesture.mode === "vertical-right") {
      const video = videoControlRef.current.video;
      if (video) {
        const delta = -dy / 200; // 200px ~ 1.0 volume
        const newVolume = clamp((video.volume || 1) + delta, 0, 1);
        try {
          video.volume = newVolume;
          showHud(`🔊 ${Math.round(newVolume * 100)}%`);
        } catch (e) {
          // May fail
        }
      }
      return;
    }
  }, [showHud]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const container = containerRef.current;
    if (container) {
      try {
        container.releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
    gestureRef.current = null;
  }, []);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        const container = iframe.closest(".aspect-video") || iframe;
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        } else {
          container.requestFullscreen?.().catch(() => {});
        }
      }

      // Keyboard shortcuts for seeking
      const video = videoControlRef.current.video;
      if (video) {
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          const newTime = clamp(video.currentTime - 10, 0, video.duration);
          video.currentTime = newTime;
          showHud(`⏪ ${Math.round(newTime)}s`);
        } else if (event.key === "ArrowRight") {
          event.preventDefault();
          const newTime = clamp(video.currentTime + 10, 0, video.duration);
          video.currentTime = newTime;
          showHud(`⏩ ${Math.round(newTime)}s`);
        } else if (event.key === "ArrowUp") {
          event.preventDefault();
          const newVolume = clamp(video.volume + 0.1, 0, 1);
          video.volume = newVolume;
          showHud(`🔊 ${Math.round(newVolume * 100)}%`);
        } else if (event.key === "ArrowDown") {
          event.preventDefault();
          const newVolume = clamp(video.volume - 0.1, 0, 1);
          video.volume = newVolume;
          showHud(`🔉 ${Math.round(newVolume * 100)}%`);
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [showHud]);

  if (!enhancedSrc) {
    return (
      <div className={`${className} flex items-center justify-center bg-black/40`}>
        <div className="text-center text-white/70">
          <AlertCircle className="mx-auto mb-2 h-8 w-8" />
          <p className="text-sm">Không có nguồn phát</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`${className} relative`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70">
          <div className="text-center text-white">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin" />
            <p className="text-sm">Đang tải video...</p>
          </div>
        </div>
      )}

      {hasError && !isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80">
          <div className="text-center text-white">
            <AlertCircle className="mx-auto mb-4 h-10 w-10 text-red-500" />
            <p className="mb-4 text-sm">Không thể tải video</p>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 rounded-lg bg-[#fb743E] px-4 py-2 font-semibold text-black transition-colors hover:bg-[#fb743E]/90"
            >
              <RefreshCw className="h-4 w-4" />
              Thử lại
            </button>
          </div>
        </div>
      )}

      <iframe
        key={retry}
        ref={iframeRef}
        src={enhancedSrc}
        className="h-full w-full border-0 pointer-events-auto"
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          position: 'relative',
        }}
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        title={title}
        loading="eager"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        referrerPolicy="no-referrer-when-downgrade"
      />

      {/* Gesture HUD */}
      {hud && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
          <div className="px-4 py-2 rounded-full bg-black/80 backdrop-blur-sm text-white text-sm sm:text-base font-semibold border border-white/20">
            {hud}
          </div>
        </div>
      )}
    </div>
  );
}
 