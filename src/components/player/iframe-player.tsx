"use client";

import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

interface IframePlayerProps {
  src: string;
  title?: string;
  className?: string;
}

type GestureMode = "none" | "horizontal" | "vertical-left" | "vertical-right";

interface GestureState {
  startX: number;
  startY: number;
  mode: GestureMode;
  initialTime: number;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

export function IframePlayer({
  src,
  title = "Player",
  className = "w-full h-full",
}: IframePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
  const hudTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleRetry = useCallback(() => {
    setHasError(false);
    setIsLoading(true);
    setRetry((prev) => prev + 1);
  }, []);

  const showHud = useCallback((text: string) => {
    setHud(text);
    if (hudTimeoutRef.current) {
      clearTimeout(hudTimeoutRef.current);
    }
    hudTimeoutRef.current = setTimeout(() => setHud(null), 700);
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !src) return;

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
        } catch {
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
  }, [src, isLoading, retry]);

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
        } catch {
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
        } catch {
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

  if (!src) {
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
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#FF2EBC] to-[#D946EF] px-4 py-2 font-semibold text-white transition-all hover:from-[#FF2EBC]/90 hover:to-[#D946EF]/90 shadow-[0_4px_15px_rgba(255,46,188,0.3)]"
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
        src={src}
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
 