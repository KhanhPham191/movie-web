"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface UseScrollRevealOptions {
  /** Threshold (0-1) - how much of the element must be visible */
  threshold?: number;
  /** Root margin - extend/shrink the trigger area */
  rootMargin?: string;
  /** Only trigger once */
  triggerOnce?: boolean;
  /** Disable animation (for reduced-motion) */
  disabled?: boolean;
}

/**
 * Custom hook for scroll-triggered reveal animations.
 * Uses Intersection Observer API for performant scroll detection.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: UseScrollRevealOptions = {}
) {
  const {
    threshold = 0.1,
    rootMargin = "0px 0px -60px 0px",
    triggerOnce = true,
    disabled = false,
  } = options;

  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (disabled) {
      setIsVisible(true);
      return;
    }

    const element = ref.current;
    if (!element) return;

    // Check prefers-reduced-motion
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (triggerOnce) {
            observer.unobserve(element);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [threshold, rootMargin, triggerOnce, disabled]);

  return { ref, isVisible };
}
