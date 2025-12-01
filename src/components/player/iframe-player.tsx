"use client";

import { useMemo, useEffect, useRef } from "react";

interface IframePlayerProps {
  src: string;
  title?: string;
  className?: string;
  allowAds?: boolean;
}

export function IframePlayer({
  src,
  title = "Player",
  className = "h-full w-full",
  allowAds = false,
}: IframePlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Cải tiến iframe URL: thêm parameter chặn quảng cáo
  const enhancedSrc = useMemo(() => {
    if (!src) return "";

    try {
      const url = new URL(src);
      
      // Thêm parameter chặn quảng cáo nếu chưa có
      if (!allowAds) {
        // Thêm các parameter phổ biến để chặn quảng cáo
        const adBlockParams: Record<string, string> = {
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

        Object.entries(adBlockParams).forEach(([key, value]) => {
          if (!url.searchParams.has(key)) {
            url.searchParams.append(key, value);
          }
        });
      }

      return url.toString();
    } catch {
      // Nếu không phải URL hợp lệ, thêm parameter vào cuối string
      if (!allowAds && !src.includes("?")) {
        return `${src}?ads=false&adblock=1&noads=1&ad=false&advertisement=false&hidead=true&hideads=true&skiphttps=true&no_ads=true&no-ads=true&skip_ads=true`;
      }
      if (!allowAds && !src.includes("ads=")) {
        return `${src}&ads=false&adblock=1&noads=1&ad=false&advertisement=false&hidead=true&hideads=true&skiphttps=true&no_ads=true&no-ads=true&skip_ads=true`;
      }
      return src;
    }
  }, [src, allowAds]);

  // Chặn quảng cáo bằng CSS injection và DOM manipulation
  useEffect(() => {
    if (!iframeRef.current || allowAds) return;

    const injectAdBlockingScript = () => {
      try {
        const iframeDoc =
          iframeRef.current?.contentDocument ||
          iframeRef.current?.contentWindow?.document;

        if (!iframeDoc) return;

        // Tạo style element để ẩn quảng cáo
        const style = iframeDoc.createElement("style");
        style.textContent = `
          /* Ẩn các element quảng cáo phổ biến */
          [class*="ad"], [id*="ad"], [class*="adv"], [id*="adv"],
          [class*="banner"], [id*="banner"], [class*="sponsor"],
          [id*="sponsor"], [class*="popup"], [id*="popup"],
          [class*="modal"], [id*="modal"], [class*="overlay"],
          [class*="advertisement"], [id*="advertisement"],
          .googleads, #googleads, .adsense, #adsense,
          .advertisement-container, #advertisement-container,
          .ad-container, #ad-container, .ad-frame, #ad-frame,
          .advertisement-frame, #advertisement-frame,
          [data-ad-slot], [data-ad-client], [data-ad-format],
          ins.adsbygoogle, iframe[src*="ads"], iframe[src*="advert"],
          iframe[src*="doubleclick"], iframe[src*="googlesyndication"],
          .advert, #advert, .adv-banner, #adv-banner,
          div[id^="google_ads"], div[class*="ad-space"],
          .advertisement-box, #advertisement-box
          { 
            display: none !important; 
            visibility: hidden !important; 
            height: 0 !important; 
            width: 0 !important; 
            position: absolute !important; 
            left: -9999px !important;
          }

          /* Ẩn nút skip ads */
          [class*="skip"], [id*="skip"], button[aria-label*="Skip"],
          .ytp-skip-ad-button, .skip-button, .skip-ads
          { 
            display: none !important; 
          }

          /* Giải phóng không gian bị quảng cáo chiếm */
          body { 
            overflow: visible !important; 
          }
        `;
        iframeDoc.head.appendChild(style);

        // Xóa các iframe quảng cáo
        const removeAdIframes = () => {
          const iframes = iframeDoc.querySelectorAll("iframe");
          iframes.forEach((iframe) => {
            const src = iframe.src || "";
            const className = iframe.className || "";
            const id = iframe.id || "";

            if (
              src.includes("ads") ||
              src.includes("advert") ||
              src.includes("doubleclick") ||
              src.includes("googlesyndication") ||
              className.includes("ad") ||
              id.includes("ad")
            ) {
              iframe.style.display = "none";
              iframe.style.visibility = "hidden";
              iframe.remove();
            }
          });
        };

        // Xóa các element quảng cáo
        const removeAdElements = () => {
          const adElements = iframeDoc.querySelectorAll(
            '[class*="ad"], [id*="ad"], [class*="adv"], [id*="adv"], ' +
            '[class*="banner"], [class*="sponsor"], [class*="popup"], ' +
            '[class*="modal"], [class*="overlay"], [class*="advertisement"], ' +
            'ins.adsbygoogle, [data-ad-slot], [data-ad-client]'
          );

          adElements.forEach((element) => {
            if (element instanceof HTMLElement) {
              element.style.display = "none";
              element.style.visibility = "hidden";
            }
          });
        };

        // Chạy ngay
        removeAdIframes();
        removeAdElements();

        // Chạy lại định kỳ vì quảng cáo có thể load động
        const observer = new MutationObserver(() => {
          removeAdIframes();
          removeAdElements();
        });

        observer.observe(iframeDoc.body, {
          childList: true,
          subtree: true,
          attributes: true,
        });

        // Cleanup
        return () => observer.disconnect();
      } catch (error) {
        console.error("Error injecting ad-blocking script:", error);
      }
    };

    // Delay một chút để chắc chắn iframe đã load
    const timer = setTimeout(injectAdBlockingScript, 1000);

    return () => clearTimeout(timer);
  }, [enhancedSrc, allowAds]);

  return (
    <iframe
      ref={iframeRef}
      src={enhancedSrc}
      className={className}
      allowFullScreen
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      title={title}
      loading="eager"
      sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation allow-popups-to-escape-sandbox"
    />
  );
}
