"use client";

import { ReactNode, useEffect, useState, useRef } from "react";
import { usePathname } from "next/navigation";
import { useIsMobile } from "@/hooks/useIsMobile";

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(true);
  const prevPathRef = useRef(pathname);

  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname;

      // On mobile: skip transform animation, just fade opacity
      if (isMobile) {
        setIsVisible(false);
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
        return;
      }

      setIsVisible(false);
      // Trigger fade-in on next frame
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsVisible(true);
        });
      });
    }
  }, [pathname, isMobile]);

  return (
    <div
      className="min-h-screen"
      style={{
        opacity: isVisible ? 1 : 0,
        // Skip transform on mobile — reduces layout recalculation
        transform: isMobile ? undefined : (isVisible ? "translateY(0)" : "translateY(8px)"),
        transition: isMobile
          ? "opacity 0.15s ease-out"
          : "opacity 0.2s ease-out, transform 0.2s ease-out",
      }}
    >
      {children}
    </div>
  );
}


















