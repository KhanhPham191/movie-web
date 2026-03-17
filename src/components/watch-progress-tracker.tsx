"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useVideoProgressOptional } from "@/contexts/video-progress-context";
import type { FilmItem } from "@/lib/api";

interface WatchProgressTrackerProps {
  movie: FilmItem;
  episodeSlug?: string;
  episodeName?: string;
  serverName?: string;
}

const SAVE_INTERVAL_MS = 5_000; // lưu mỗi 5 giây
const MIN_WATCH_TIME = 3;       // bỏ qua nếu xem dưới 3 giây

export function WatchProgressTracker({
  movie,
  episodeSlug,
  episodeName,
  serverName,
}: WatchProgressTrackerProps) {
  const { isAuthenticated } = useAuth();
  const videoProgress = useVideoProgressOptional();
  const lastSavedTimeRef = useRef<number>(-1);
  const isSavingRef = useRef(false);

  const buildPayload = useCallback(
    (watchTime: number, totalDuration: number) => ({
      movie_slug: movie.slug,
      movie_name: movie.name,
      movie_thumb: movie.thumb_url || movie.poster_url,
      movie_year: movie.year ? Number(movie.year) : undefined,
      episode_slug: episodeSlug || "full",
      episode_name: episodeName || "Full",
      server_name: serverName || "Default",
      watch_time: Math.floor(watchTime),
      total_duration: Math.floor(totalDuration),
    }),
    [movie, episodeSlug, episodeName, serverName]
  );

  const saveProgress = useCallback(
    async (watchTime: number, totalDuration: number) => {
      if (!isAuthenticated) return;
      if (watchTime < MIN_WATCH_TIME) return;
      // Bỏ qua nếu đúng vị trí đã lưu rồi (tránh lưu lặp cùng 1 giá trị)
      if (watchTime === lastSavedTimeRef.current) return;
      if (isSavingRef.current) return;

      isSavingRef.current = true;
      lastSavedTimeRef.current = watchTime;

      try {
        await fetch("/movpey/watch-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(buildPayload(watchTime, totalDuration)),
        });
      } catch {
        // Silent fail — không làm gián đoạn trải nghiệm xem phim
      } finally {
        isSavingRef.current = false;
      }
    },
    [isAuthenticated, buildPayload]
  );

  // Lưu định kỳ mỗi 5 giây
  useEffect(() => {
    if (!isAuthenticated || !videoProgress) return;

    const interval = setInterval(() => {
      const { currentTime, duration } = videoProgress;
      saveProgress(currentTime, duration);
    }, SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isAuthenticated, videoProgress, saveProgress]);

  // Lưu khi user thoát trang / đóng tab
  useEffect(() => {
    if (!isAuthenticated || !videoProgress) return;

    const handleBeforeUnload = () => {
      const { currentTime, duration } = videoProgress;
      if (currentTime < MIN_WATCH_TIME) return;

      // Dùng sendBeacon để đảm bảo request gửi được khi thoát trang
      navigator.sendBeacon(
        "/movpey/watch-history",
        new Blob(
          [JSON.stringify(buildPayload(currentTime, duration))],
          { type: "application/json" }
        )
      );
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isAuthenticated, videoProgress, buildPayload]);

  return null;
}
