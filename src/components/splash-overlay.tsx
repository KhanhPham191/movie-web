"use client";

import { useEffect, useState } from "react";

// Check sessionStorage synchronously to avoid mounting heavy component
function hasShownSplash(): boolean {
  try {
    return typeof window !== "undefined" && sessionStorage.getItem("splashShown") === "true";
  } catch {
    return false;
  }
}

export function SplashOverlay() {
  // Khởi tạo true trên server (chưa biết sessionStorage), client sẽ sửa ngay trong useEffect
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // Check sessionStorage ngay lập tức trên client
    // Nếu đã hiển thị splash trước đó → ẩn ngay, không delay
    if (hasShownSplash()) {
      setIsVisible(false);
      setShouldRender(false);
      return;
    }

    // Lần đầu truy cập → hiển thị splash
    const minDisplayTime = 150;
    const maxDisplayTime = 400;
    const startTime = Date.now();

    let hideTimer: NodeJS.Timeout | null = null;
    let removeTimer: NodeJS.Timeout | null = null;
    let isHiding = false;

    const hideSplash = () => {
      if (isHiding) return;
      isHiding = true;
      
      sessionStorage.setItem('splashShown', 'true');
      
      setIsVisible(false);
      // Remove from DOM sau khi fade out xong (duration-300)
      removeTimer = setTimeout(() => {
        setShouldRender(false);
      }, 350);
    };

    hideTimer = setTimeout(() => {
      hideSplash();
    }, maxDisplayTime);

    const handleLoad = () => {
      if (hideTimer) {
        clearTimeout(hideTimer);
      }
      
      const elapsed = Date.now() - startTime;
      if (elapsed >= minDisplayTime) {
        hideSplash();
      } else {
        setTimeout(() => {
          hideSplash();
        }, minDisplayTime - elapsed);
      }
    };

    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad, { once: true });
    }

    return () => {
      if (hideTimer) clearTimeout(hideTimer);
      if (removeTimer) clearTimeout(removeTimer);
      window.removeEventListener("load", handleLoad);
    };
  }, []);

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0D0D0D] transition-opacity duration-300 ease-out ${
        isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      style={{ 
        pointerEvents: isVisible ? "auto" : "none",
      }}
      aria-hidden={!isVisible}
    >
      {/* Brand text with animation */}
      <div 
        className="flex flex-col items-center justify-center gap-3 px-4 w-full max-w-full text-center"
      >
        <span 
          className="text-6xl sm:text-7xl md:text-8xl font-extrabold text-[#F6C453] tracking-tight break-words"
          style={{
            animation: isVisible 
              ? 'textFadeInScale 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' 
              : 'textFadeOutScale 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            textShadow: '0 0 20px rgba(246, 196, 83, 0.5), 0 0 40px rgba(246, 196, 83, 0.3)',
          }}
        >
          MovPey
        </span>
        <span 
          className="text-xl sm:text-2xl md:text-3xl font-medium text-gray-300 tracking-wide break-words"
          style={{
            animation: isVisible 
              ? 'textFadeInUp 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s both' 
              : 'textFadeOutUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both',
          }}
        >
          Phim xịn mỗi ngày
        </span>
      </div>
    </div>
  );
}

