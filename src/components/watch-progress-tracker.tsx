"use client";

import { useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { addToCurrentlyWatching, updateCurrentlyWatching } from "@/lib/supabase/movies";
import { useAuth } from "@/contexts/auth-context";
import { useVideoProgress } from "@/contexts/video-progress-context";
import type { FilmItem } from "@/lib/api";

interface WatchProgressTrackerProps {
  movie: FilmItem;
  episodeSlug?: string;
  episodeName?: string;
}

export function WatchProgressTracker({
  movie,
  episodeSlug,
  episodeName,
}: WatchProgressTrackerProps) {
  const { isAuthenticated } = useAuth();
  const { currentTime, duration } = useVideoProgress();
  const searchParams = useSearchParams();

  // Dùng refs để lưu giá trị mới nhất, tránh dependency array chạy lại liên tục
  const currentTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);
  const watchTimeRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());
  const hasInitializedRef = useRef(false);
  const isSavingRef = useRef(false);

  // Luôn cập nhật refs khi context thay đổi (KHÔNG tạo effect mới)
  currentTimeRef.current = currentTime;
  durationRef.current = duration;

  // Lấy timestamp từ URL nếu có (ví dụ: ?t=120) - chỉ lấy một lần khi mount
  useEffect(() => {
    const tParam = searchParams.get("t");
    if (tParam) {
      const timestamp = parseInt(tParam, 10);
      if (!isNaN(timestamp) && timestamp > 0) {
        watchTimeRef.current = timestamp;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy một lần khi mount

  // Hàm lưu tiến độ - dùng ref values thay vì state
  const saveProgress = useCallback(async () => {
    if (isSavingRef.current) return;

    try {
      isSavingRef.current = true;
      const ct = Math.floor(currentTimeRef.current);
      const dur = Math.floor(durationRef.current || 0);

      // Nếu đã xem xong, xóa khỏi currently_watching
      if (dur > 0 && ct >= dur) {
        const { removeFromCurrentlyWatching } = await import("@/lib/supabase/movies");
        await removeFromCurrentlyWatching(movie.slug);
        return;
      }

      // Chỉ lưu nếu currentTime > 0 và có thay đổi (ít nhất 1 giây)
      if (ct > 0 && Math.abs(ct - watchTimeRef.current) >= 1) {
        const { error } = await updateCurrentlyWatching(
          movie.slug,
          ct,
          dur,
          episodeSlug
        );

        if (!error) {
          watchTimeRef.current = ct;
          startTimeRef.current = Date.now();
        }
      }
    } catch {
      // Error saving progress
    } finally {
      isSavingRef.current = false;
    }
  }, [movie.slug, episodeSlug]);

  // Khởi tạo và lưu vào currently_watching khi vào trang
  useEffect(() => {
    if (!isAuthenticated || hasInitializedRef.current) return;

    const initializeWatch = async () => {
      try {
        const { error } = await addToCurrentlyWatching(
          movie,
          episodeSlug,
          episodeName,
          watchTimeRef.current,
          durationRef.current || 0
        );

        if (!error) {
          hasInitializedRef.current = true;
          startTimeRef.current = Date.now();
        }
      } catch {
        // Error initializing watch
      }
    };

    initializeWatch();
  }, [isAuthenticated, movie, episodeSlug, episodeName]);

  // Cập nhật tiến độ mỗi 5 giây - dùng một interval duy nhất, đọc từ refs
  useEffect(() => {
    if (!isAuthenticated) return;

    const intervalId = setInterval(() => {
      if (!hasInitializedRef.current) return;
      saveProgress();
    }, 5000);

    return () => {
      clearInterval(intervalId);
    };
  }, [isAuthenticated, saveProgress]);

  // Lưu tiến độ khi rời trang (beforeunload, visibilitychange)
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleBeforeUnload = () => {
      if (!hasInitializedRef.current) return;
      const ct = Math.floor(currentTimeRef.current) || watchTimeRef.current;
      const dur = Math.floor(durationRef.current || 0);
      if (ct > 0) {
        updateCurrentlyWatching(movie.slug, ct, dur, episodeSlug).catch(() => {});
      }
    };

    const handleVisibilityChange = () => {
      if (!hasInitializedRef.current) return;
      if (document.hidden) {
        saveProgress();
      } else {
        startTimeRef.current = Date.now();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // Lưu lần cuối khi component unmount
      if (hasInitializedRef.current) {
        const ct = Math.floor(currentTimeRef.current) || watchTimeRef.current;
        const dur = Math.floor(durationRef.current || 0);
        if (ct > 0) {
          updateCurrentlyWatching(movie.slug, ct, dur, episodeSlug).catch(() => {});
        }
      }
    };
  }, [isAuthenticated, movie.slug, episodeSlug, saveProgress]);

  // Cập nhật duration vào database khi nó thay đổi lần đầu (chỉ khi khác biệt lớn)
  const lastSavedDurationRef = useRef<number>(0);
  useEffect(() => {
    if (!isAuthenticated || !hasInitializedRef.current) return;
    if (duration <= 0 || isNaN(duration)) return;

    const durationFloor = Math.floor(duration);
    // Chỉ cập nhật nếu duration thay đổi đáng kể (> 2 giây)
    if (Math.abs(durationFloor - lastSavedDurationRef.current) < 2) return;
    lastSavedDurationRef.current = durationFloor;

    updateCurrentlyWatching(
      movie.slug,
      watchTimeRef.current,
      durationFloor,
      episodeSlug
    ).catch(() => {});
  }, [isAuthenticated, movie.slug, episodeSlug, duration]);

  return null; // Component này không render gì
}
