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

const SAVE_INTERVAL_MS = 12_000; // lưu mỗi 12 giây để giảm network wake-up trên mobile
const MIN_WATCH_TIME = 3;       // bỏ qua nếu xem dưới 3 giây
const MIN_SAVE_DELTA_SECONDS = 10; // chỉ lưu khi tiến thêm ít nhất 10s

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
  const currentStateRef = useRef({ currentTime: 0, duration: 0 });

  const buildPayload = useCallback(
    (watchTime: number, totalDuration: number) => ({
      movie_slug: movie.slug,
      movie_name: movie.name,
      movie_thumb: movie.thumb_url || movie.poster_url,
      movie_poster: movie.poster_url || movie.thumb_url,
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
      // Bỏ qua nếu vị trí thay đổi quá ít (tránh spam request)
      if (
        lastSavedTimeRef.current >= 0 &&
        Math.abs(watchTime - lastSavedTimeRef.current) < MIN_SAVE_DELTA_SECONDS
      ) {
        return;
      }
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
      // Cập nhật ref để dùng trong cleanup
      currentStateRef.current = { currentTime, duration };
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

    const handleUnload = () => {
      // Lưu lần cuối khi component unmount (e.g. navigation)
      const { currentTime, duration } = currentStateRef.current;
      if (currentTime >= MIN_WATCH_TIME) {
        navigator.sendBeacon(
          "/movpey/watch-history",
          new Blob(
            [JSON.stringify(buildPayload(currentTime, duration))],
            { type: "application/json" }
          )
        );
      }
    };

    const handleVisibilityChange = () => {
      // Mobile thường đưa tab/app về background mà không chạy beforeunload
      if (document.visibilityState !== "hidden") return;
      const { currentTime, duration } = currentStateRef.current;
      if (currentTime < MIN_WATCH_TIME) return;
      navigator.sendBeacon(
        "/movpey/watch-history",
        new Blob(
          [JSON.stringify(buildPayload(currentTime, duration))],
          { type: "application/json" }
        )
      );
    };

    const handlePageHide = () => {
      // iOS Safari ưu tiên pagehide hơn beforeunload
      const { currentTime, duration } = currentStateRef.current;
      if (currentTime < MIN_WATCH_TIME) return;
      navigator.sendBeacon(
        "/movpey/watch-history",
        new Blob(
          [JSON.stringify(buildPayload(currentTime, duration))],
          { type: "application/json" }
        )
      );
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // Lưu cuối cùng khi unmount
      handleUnload();
    };
  }, [isAuthenticated, videoProgress, buildPayload]);

  return null;
}
