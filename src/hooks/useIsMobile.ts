"use client";

import { useState, useEffect } from "react";

/**
 * Detect mobile devices using matchMedia.
 * Returns true on mobile/tablet (<1024px) to skip heavy desktop-only features.
 * Defaults to true on SSR to avoid loading heavy features on mobile first paint.
 */
export function useIsMobile(breakpoint: number = 1024): boolean {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    setIsMobile(mql.matches);

    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, [breakpoint]);

  return isMobile;
}
