"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

interface VideoProgressContextType {
  currentTime: number;
  duration: number;
  updateProgress: (currentTime: number, duration: number) => void;
}

const VideoProgressContext = createContext<VideoProgressContextType | undefined>(undefined);

export function VideoProgressProvider({ children }: { children: ReactNode }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const updateProgress = useCallback((newCurrentTime: number, newDuration: number) => {
    setCurrentTime(newCurrentTime);
    if (newDuration > 0) {
      setDuration(newDuration);
    }
  }, []);

  return (
    <VideoProgressContext.Provider
      value={{
        currentTime,
        duration,
        updateProgress,
      }}
    >
      {children}
    </VideoProgressContext.Provider>
  );
}

export function useVideoProgress() {
  const context = useContext(VideoProgressContext);
  if (context === undefined) {
    throw new Error("useVideoProgress must be used within a VideoProgressProvider");
  }
  return context;
}

// Optional hook that returns null if context is not available
export function useVideoProgressOptional() {
  const context = useContext(VideoProgressContext);
  return context;
}

