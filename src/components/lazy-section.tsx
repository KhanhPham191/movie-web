"use client";

import React, { useEffect, useRef, useState } from "react";

interface LazySectionProps {
  children: React.ReactNode;
  /** Fallback shown before section enters viewport */
  fallback?: React.ReactNode;
  /** How far before viewport to start mounting (px) */
  rootMargin?: string;
  /** Keep rendered once mounted */
  keepMounted?: boolean;
  /** Additional CSS class */
  className?: string;
  /** Minimum height for the placeholder to preserve scroll layout */
  minHeight?: string;
}

/**
 * Lazy-mount wrapper: children are NOT rendered into the DOM until
 * the container scrolls near the viewport. This prevents off-screen
 * images from being fetched and decoded on initial page load.
 *
 * Unlike ScrollReveal (which only toggles opacity/transform),
 * LazySection actually defers React rendering / mounting.
 */
export function LazySection({
  children,
  fallback,
  rootMargin = "200px 0px",
  keepMounted = true,
  className = "",
  minHeight = "200px",
}: LazySectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // If already in viewport on mount (e.g. top sections), mount immediately
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setMounted(true);
          if (keepMounted) observer.disconnect();
        } else if (!keepMounted) {
          setMounted(false);
        }
      },
      { rootMargin, threshold: 0 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin, keepMounted]);

  return (
    <div
      ref={ref}
      className={className}
      style={mounted ? undefined : { minHeight }}
    >
      {mounted
        ? children
        : fallback || (
            <div
              style={{ minHeight }}
              className="animate-pulse bg-[#191b24]/80 rounded-xl"
            />
          )}
    </div>
  );
}
