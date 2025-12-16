"use client";

import { useEffect, useState } from "react";

/**
 * Christmas Theme Component
 * 
 * Để tắt theme Noel, chỉ cần:
 * 1. Xóa hoặc comment dòng import và <ChristmasTheme /> trong page.tsx
 * 2. Hoặc set ENABLE_CHRISTMAS_THEME = false ở dưới
 */
const ENABLE_CHRISTMAS_THEME = true;

export function ChristmasTheme() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!ENABLE_CHRISTMAS_THEME || !mounted) return null;

  return (
    <>
      {/* Snowflakes Animation */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="snowflake"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 10}s`,
              opacity: Math.random() * 0.5 + 0.3,
            }}
          >
            ❄
          </div>
        ))}
      </div>

      {/* Floating Christmas Ornaments */}
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={`ornament-${i}`}
            className="christmas-ornament"
            style={{
              left: `${10 + i * 12}%`,
              animationDelay: `${i * 0.5}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          >
            {i % 3 === 0 ? "🎄" : i % 3 === 1 ? "🎁" : "⭐"}
          </div>
        ))}
      </div>

      {/* Christmas Gradient Overlay */}
      <div className="fixed inset-0 pointer-events-none z-30 christmas-gradient-overlay" />

      {/* Twinkling Stars Background */}
      <div className="fixed inset-0 pointer-events-none z-20">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={`star-${i}`}
            className="christmas-star"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          >
            ✨
          </div>
        ))}
      </div>
    </>
  );
}








