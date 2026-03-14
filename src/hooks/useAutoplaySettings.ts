"use client";

import { useState, useEffect, useCallback } from "react";

const AUTOPLAY_STORAGE_KEY = "movie-hub-autoplay-enabled";

export function useAutoplaySettings() {
  const [isAutoplayEnabled, setIsAutoplayEnabled] = useState<boolean | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(AUTOPLAY_STORAGE_KEY);
      if (stored !== null) {
        setIsAutoplayEnabled(JSON.parse(stored));
      } else {
        // Default to false (autoplay off by default)
        setIsAutoplayEnabled(false);
        localStorage.setItem(AUTOPLAY_STORAGE_KEY, JSON.stringify(false));
      }
    } catch (error) {
      console.warn("Failed to load autoplay settings:", error);
      setIsAutoplayEnabled(false);
    }
    setIsLoaded(true);
  }, []);

  const toggleAutoplay = useCallback(() => {
    setIsAutoplayEnabled((prev) => {
      const newValue = !prev;
      try {
        localStorage.setItem(AUTOPLAY_STORAGE_KEY, JSON.stringify(newValue));
      } catch (error) {
        console.warn("Failed to save autoplay settings:", error);
      }
      return newValue;
    });
  }, []);

  return {
    isAutoplayEnabled: isAutoplayEnabled ?? false,
    toggleAutoplay,
    isLoaded,
  };
}
