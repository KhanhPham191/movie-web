"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export function SplashOverlay() {
  const [isVisible, setIsVisible] = useState(true);
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
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
      
      setIsVisible(false);
      // Remove from DOM after fade out animation completes
      removeTimer = setTimeout(() => {
        setShouldRender(false);
      }, 500); // Match fade out duration
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
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-[#0D0D0D] transition-opacity duration-500 ease-out ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      style={{ pointerEvents: isVisible ? "auto" : "none" }}
      aria-hidden={!isVisible}
    >
      <div className="relative flex flex-col items-center justify-center gap-6">
        {/* Logo with glow effect */}
        <div className="relative">
          {/* Outer glow ring */}
          <div className="absolute inset-0 -m-8 rounded-full bg-[#F6C453]/20 blur-2xl animate-pulse" />
          
          {/* Spinning ring */}
          <div className="h-24 w-24 rounded-full border-[3px] border-t-[#F6C453] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
          
          {/* Logo in center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-12 w-12 drop-shadow-[0_0_24px_rgba(246,196,83,0.95)]">
              <Image
                src="/logo.svg"
                alt="MovPey"
                fill
                sizes="48px"
                priority
                className="rounded-xl"
              />
            </div>
          </div>
        </div>

        {/* Brand text */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl font-extrabold text-[#F6C453] tracking-tight">
            MovPey
          </span>
          <span className="text-sm font-medium text-gray-300 tracking-wide">
            Phim xịn mỗi ngày
          </span>
        </div>
      </div>
    </div>
  );
}

