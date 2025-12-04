"use client";

import {
  useMemo,
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
  allowAds?: boolean;
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

export function IframePlayer({
  src,
  title = "Player",
  className = "w-full h-full",
  allowAds = false,
}: IframePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [retry, setRetry] = useState(0);

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

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !enhancedSrc) return;

    const handleLoad = () => {
      setIsLoading(false);
      setHasError(false);
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
        doc.querySelectorAll("iframe, div, ins").forEach((node) => {
          const target = node as HTMLElement;
          const text = target.textContent?.toLowerCase() || "";
          const haystack = `${target.id} ${target.className}`.toLowerCase();

          if (
            haystack.includes("ad") ||
            haystack.includes("ads") ||
            haystack.includes("advert") ||
            haystack.includes("bet") ||
            haystack.includes("casino") ||
            text.includes("quảng cáo") ||
            text.includes("advertisement")
          ) {
            target.style.display = "none";
            target.remove();
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
        [class*="ad"], [id*="ad"], [class*="adv"], [id*="adv"],
        [class*="banner"], [id*="banner"], [class*="popup"], [id*="popup"],
        [class*="sponsor"], [id*="sponsor"], [class*="overlay"], [id*="overlay"],
        [class*="advert"], [id*="advert"], [data-ad-slot], [data-ad-client],
        ins.adsbygoogle, iframe[src*="ads"], iframe[src*="advert"] {
          display: none !important;
          visibility: hidden !important;
          width: 0 !important;
          height: 0 !important;
          opacity: 0 !important;
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
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

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
    <div className={`${className} relative`}>
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
        className="h-full w-full border-0"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        title={title}
        loading="eager"
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
 