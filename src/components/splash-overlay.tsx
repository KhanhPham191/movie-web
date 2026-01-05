"use client";

import { useEffect, useState } from "react";

export function SplashOverlay() {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    // Check if splash was already shown (stored in sessionStorage)
    const hasShownSplash = sessionStorage.getItem('splashShown');
    
    if (hasShownSplash === 'true') {
      // If already shown in this session, don't show again
      setIsVisible(false);
      setShouldRender(false);
      return;
    }

    // Hide splash after minimum display time and when page is ready
    const minDisplayTime = 600; // Minimum 600ms display
    const maxDisplayTime = 1800; // Maximum 1.8s display
    const startTime = Date.now();

    let hideTimer: NodeJS.Timeout | null = null;
    let removeTimer: NodeJS.Timeout | null = null;
    let isHiding = false;

    const hideSplash = () => {
      if (isHiding) return;
      isHiding = true;
      
      // Mark splash as shown in sessionStorage
      sessionStorage.setItem('splashShown', 'true');
      
      setIsVisible(false);
      // Remove from DOM after fade out animation completes
      removeTimer = setTimeout(() => {
        setShouldRender(false);
      }, 600); // Match fade out duration (500ms + 100ms delay)
    };

    // Set maximum display time
    hideTimer = setTimeout(() => {
      hideSplash();
    }, maxDisplayTime);

    // Hide when page is fully loaded (but respect minimum time)
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

    // Check if already loaded
    if (document.readyState === "complete") {
      handleLoad();
    } else {
      window.addEventListener("load", handleLoad, { once: true });
    }

    // Also check DOMContentLoaded for faster response
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        const elapsed = Date.now() - startTime;
        if (elapsed >= minDisplayTime) {
          handleLoad();
        } else {
          setTimeout(() => {
            handleLoad();
          }, minDisplayTime - elapsed);
        }
      }, { once: true });
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
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0D0D0D] transition-opacity duration-500 ease-out min-h-screen ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      style={{ 
        pointerEvents: isVisible ? "auto" : "none",
        minHeight: '-webkit-fill-available', // iOS Safari
        paddingTop: 'env(safe-area-inset-top)',
        paddingRight: 'env(safe-area-inset-right)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
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

