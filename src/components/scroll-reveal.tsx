"use client";

import React from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useIsMobile } from "@/hooks/useIsMobile";

type AnimationVariant =
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "zoom-in"
  | "fade";

interface ScrollRevealProps {
  children: React.ReactNode;
  /** Animation variant */
  variant?: AnimationVariant;
  /** Delay in ms before animation starts */
  delay?: number;
  /** Duration in ms */
  duration?: number;
  /** How much of the element must be visible (0-1) */
  threshold?: number;
  /** Additional CSS class */
  className?: string;
  /** Use a custom tag instead of div */
  as?: keyof React.JSX.IntrinsicElements;
  /**
   * Use a lightweight reveal on desktop.
   * (We still reveal; we just avoid transform-heavy transitions for performance.)
   */
  desktopDisabled?: boolean;
}

const variantStyles: Record<
  AnimationVariant,
  { hidden: React.CSSProperties; visible: React.CSSProperties }
> = {
  "fade-up": {
    hidden: { opacity: 0, transform: "translateY(32px)" },
    visible: { opacity: 1, transform: "translateY(0)" },
  },
  "fade-down": {
    hidden: { opacity: 0, transform: "translateY(-32px)" },
    visible: { opacity: 1, transform: "translateY(0)" },
  },
  "fade-left": {
    hidden: { opacity: 0, transform: "translateX(-32px)" },
    visible: { opacity: 1, transform: "translateX(0)" },
  },
  "fade-right": {
    hidden: { opacity: 0, transform: "translateX(32px)" },
    visible: { opacity: 1, transform: "translateX(0)" },
  },
  "zoom-in": {
    hidden: { opacity: 0, transform: "scale(0.94)" },
    visible: { opacity: 1, transform: "scale(1)" },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
};

/**
 * Scroll-triggered reveal animation wrapper.
 * Wraps children and animates them into view when they enter the viewport.
 */
export function ScrollReveal({
  children,
  variant = "fade-up",
  delay = 0,
  duration = 700,
  threshold = 0.1,
  className = "",
  as: Tag = "div",
  desktopDisabled = false,
}: ScrollRevealProps) {
  const isMobile = useIsMobile();
  const lightDesktop = desktopDisabled && !isMobile;
  const { ref, isVisible } = useScrollReveal<HTMLDivElement>({
    threshold,
    rootMargin: "0px 0px -40px 0px",
    disabled: false,
  });

  const styles = lightDesktop
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : variantStyles[variant];

  const Component = Tag as React.ElementType;

  // On mobile: use simpler fade-only animation with shorter duration, no transform
  const mobileDuration = Math.min(duration, 300);
  const desktopLightDuration = Math.min(duration, 450);

  return (
    <Component
      ref={ref}
      className={className}
      style={{
        ...(isVisible
          ? styles.visible
          : isMobile
            ? { opacity: 0 }
            : styles.hidden),
        transition: isMobile
          ? `opacity ${mobileDuration}ms ease-out`
          : lightDesktop
            ? `opacity ${desktopLightDuration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`
            : `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        willChange: isVisible ? "auto" : "opacity",
      }}
    >
      {children}
    </Component>
  );
}
