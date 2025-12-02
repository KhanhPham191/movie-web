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
        style.id = "adblock-style";
        style.textContent = `
          /* Ẩn các element quảng cáo phổ biến */
          [class*="ad"], [id*="ad"], [class*="adv"], [id*="adv"],
          [class*="banner"], [id*="banner"], [class*="sponsor"],
          [id*="sponsor"], [class*="popup"], [id*="popup"],
          [class*="modal"], [id*="modal"], [class*="overlay"],
          [class*="advertisement"], [id*="advertisement"],
          [class*="quảng cáo"], [id*="quảng cáo"],
          [class*="quang-cao"], [id*="quang-cao"],
          .googleads, #googleads, .adsense, #adsense,
          .advertisement-container, #advertisement-container,
          .ad-container, #ad-container, .ad-frame, #ad-frame,
          .advertisement-frame, #advertisement-frame,
          [data-ad-slot], [data-ad-client], [data-ad-format],
          ins.adsbygoogle, iframe[src*="ads"], iframe[src*="advert"],
          iframe[src*="doubleclick"], iframe[src*="googlesyndication"],
          .advert, #advert, .adv-banner, #adv-banner,
          div[id^="google_ads"], div[class*="ad-space"],
          .advertisement-box, #advertisement-box,
          /* VSbet và các nhà cái */
          [class*="vsbet"], [id*="vsbet"], [class*="bet"], [id*="bet"],
          [class*="casino"], [id*="casino"], [class*="gambling"],
          /* Overlay quảng cáo */
          [class*="ad-overlay"], [id*="ad-overlay"],
          [class*="ad-banner"], [id*="ad-banner"],
          [class*="ad-popup"], [id*="ad-popup"]
          { 
            display: none !important; 
            visibility: hidden !important; 
            height: 0 !important; 
            width: 0 !important; 
            position: absolute !important; 
            left: -9999px !important;
            opacity: 0 !important;
            pointer-events: none !important;
          }

          /* Ẩn overlay quảng cáo */
          [class*="overlay"][class*="ad"],
          [id*="overlay"][id*="ad"],
          div[style*="position: fixed"][style*="z-index"]:has([class*="ad"]),
          div[style*="position: absolute"][style*="z-index"]:has([class*="ad"])
          {
            display: none !important;
            visibility: hidden !important;
          }

          /* Giải phóng không gian bị quảng cáo chiếm */
          body { 
            overflow: visible !important; 
          }
        `;
        
        // Xóa style cũ nếu có
        const oldStyle = iframeDoc.getElementById("adblock-style");
        if (oldStyle) oldStyle.remove();
        
        iframeDoc.head.appendChild(style);

        // Tự động click nút skip quảng cáo
        const clickSkipButtons = () => {
          const skipSelectors = [
            'button[class*="skip"]',
            'button[id*="skip"]',
            'button[aria-label*="Skip"]',
            'button[aria-label*="skip"]',
            'button[aria-label*="Bỏ qua"]',
            'button[aria-label*="bỏ qua"]',
            'button:contains("Bỏ qua")',
            'button:contains("Skip")',
            '.skip-button',
            '.skip-ads',
            '#skip-button',
            '#skip-ads',
            '[class*="skip-ad"]',
            '[id*="skip-ad"]',
            'a[class*="skip"]',
            'a[id*="skip"]',
            'div[class*="skip"][role="button"]',
            'span[class*="skip"][role="button"]',
            // Tiếng Việt
            'button:contains("Bỏ qua quảng cáo")',
            'button:contains("BỎ QUA")',
            'button:contains("Bỏ qua")',
            '[title*="Bỏ qua"]',
            '[title*="Skip"]',
          ];

          skipSelectors.forEach((selector) => {
            try {
              // Thử querySelector
              const elements = iframeDoc.querySelectorAll(selector);
              elements.forEach((el) => {
                if (el instanceof HTMLElement) {
                  // Kiểm tra text content
                  const text = el.textContent?.toLowerCase() || '';
                  if (text.includes('skip') || text.includes('bỏ qua') || text.includes('bỏ qua quảng cáo')) {
                    el.click();
                    el.style.display = 'none';
                    el.remove();
                  }
                }
              });

              // Tìm tất cả buttons và check text
              const allButtons = iframeDoc.querySelectorAll('button, a, div[role="button"], span[role="button"]');
              allButtons.forEach((btn) => {
                const text = btn.textContent?.toLowerCase() || '';
                const ariaLabel = btn.getAttribute('aria-label')?.toLowerCase() || '';
                const title = btn.getAttribute('title')?.toLowerCase() || '';
                
                if (
                  (text.includes('skip') || text.includes('bỏ qua') || text.includes('bỏ qua quảng cáo')) ||
                  (ariaLabel.includes('skip') || ariaLabel.includes('bỏ qua')) ||
                  (title.includes('skip') || title.includes('bỏ qua'))
                ) {
                  if (btn instanceof HTMLElement) {
                    btn.click();
                    btn.style.display = 'none';
                    btn.remove();
                  }
                }
              });
            } catch (e) {
              // Ignore errors
            }
          });
        };

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
              src.includes("vsbet") ||
              src.includes("bet") ||
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
            '[class*="vsbet"], [id*="vsbet"], [class*="bet"], ' +
            'ins.adsbygoogle, [data-ad-slot], [data-ad-client]'
          );

          adElements.forEach((element) => {
            if (element instanceof HTMLElement) {
              const text = element.textContent?.toLowerCase() || '';
              // Nếu là quảng cáo, xóa luôn
              if (
                text.includes('quảng cáo') ||
                text.includes('quang cao') ||
                text.includes('advertisement') ||
                text.includes('vsbet') ||
                text.includes('cược') ||
                text.includes('bet')
              ) {
                element.style.display = "none";
                element.style.visibility = "hidden";
                element.remove();
              } else {
                element.style.display = "none";
                element.style.visibility = "hidden";
              }
            }
          });
        };

        // Chạy ngay
        removeAdIframes();
        removeAdElements();
        clickSkipButtons();

        // Chạy lại định kỳ vì quảng cáo có thể load động
        const observer = new MutationObserver(() => {
          removeAdIframes();
          removeAdElements();
          clickSkipButtons();
        });

        observer.observe(iframeDoc.body || iframeDoc.documentElement, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class', 'id', 'style'],
        });

        // Chạy lại sau mỗi 500ms để đảm bảo bắt được quảng cáo
        const interval = setInterval(() => {
          removeAdIframes();
          removeAdElements();
          clickSkipButtons();
        }, 500);

        // Cleanup
        return () => {
          observer.disconnect();
          clearInterval(interval);
        };
      } catch (error) {
        console.error("Error injecting ad-blocking script:", error);
      }
    };

    // Thử inject ngay và sau đó retry
    const tryInject = () => {
      try {
        injectAdBlockingScript();
      } catch (e) {
        // Retry sau 500ms
        setTimeout(tryInject, 500);
      }
    };

    // Delay một chút để chắc chắn iframe đã load
    const timer1 = setTimeout(tryInject, 500);
    const timer2 = setTimeout(tryInject, 1000);
    const timer3 = setTimeout(tryInject, 2000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
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
