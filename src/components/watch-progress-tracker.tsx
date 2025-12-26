"use client";

import { useEffect, useRef } from "react";
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
  const startTimeRef = useRef<number>(Date.now());
  const watchTimeRef = useRef<number>(0);
  const totalDurationRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef(false);

  // Lấy timestamp từ URL nếu có (ví dụ: ?t=120) - chỉ lấy một lần khi mount
  useEffect(() => {
    const tParam = searchParams.get("t");
    if (tParam) {
      const timestamp = parseInt(tParam, 10);
      if (!isNaN(timestamp) && timestamp > 0) {
        watchTimeRef.current = timestamp;
        // Nếu có timestamp từ URL, user đã xem đến đó rồi
        // Bắt đầu tính từ timestamp đó
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Chỉ chạy một lần khi mount để lấy timestamp từ URL

  // Cập nhật duration từ context
  useEffect(() => {
    if (!isAuthenticated) return;

    if (duration > 0 && duration !== totalDurationRef.current && !isNaN(duration)) {
      const durationFloor = Math.floor(duration);
      if (durationFloor !== totalDurationRef.current && durationFloor > 0) {
        totalDurationRef.current = durationFloor;
        // Cập nhật ngay lập tức nếu đã initialized
        if (hasInitializedRef.current) {
          updateCurrentlyWatching(
            movie.slug,
            watchTimeRef.current,
            durationFloor,
            episodeSlug
          ).catch(() => {});
        }
      }
    }
  }, [isAuthenticated, movie.slug, episodeSlug, duration]);

  // Khởi tạo và lưu vào currently_watching khi vào trang
  useEffect(() => {
    if (!isAuthenticated || hasInitializedRef.current) return;

    const initializeWatch = async () => {
      try {
        // Lưu vào currently_watching với watch_time hiện tại từ URL hoặc 0
        const { error } = await addToCurrentlyWatching(
          movie,
          episodeSlug,
          episodeName,
          watchTimeRef.current,
          totalDurationRef.current || 0
        );

        if (!error) {
          hasInitializedRef.current = true;
          startTimeRef.current = Date.now();
        }
      } catch (error) {
        // Error initializing watch
      }
    };

    initializeWatch();
  }, [isAuthenticated, movie, episodeSlug, episodeName]);

  // Cập nhật tiến độ mỗi 5 giây - lấy từ context
  useEffect(() => {
    if (!isAuthenticated || !hasInitializedRef.current) return;

    intervalRef.current = setInterval(async () => {
      try {
        const currentTimeFloor = Math.floor(currentTime);
        const totalDurationFloor = Math.floor(duration || totalDurationRef.current || 0);

        // Cập nhật totalDurationRef nếu có
        if (totalDurationFloor > 0 && totalDurationFloor !== totalDurationRef.current && !isNaN(totalDurationFloor)) {
          totalDurationRef.current = totalDurationFloor;
        }

        // Nếu đã xem xong (progress >= 100%), xóa khỏi currently_watching
        if (totalDurationFloor > 0 && currentTimeFloor >= totalDurationFloor) {
          const { removeFromCurrentlyWatching } = await import("@/lib/supabase/movies");
          await removeFromCurrentlyWatching(movie.slug);
          
          // Dừng interval vì đã xem xong
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }

        // Chỉ lưu nếu currentTime > 0 và có thay đổi (ít nhất 1 giây)
        if (currentTimeFloor > 0 && Math.abs(currentTimeFloor - watchTimeRef.current) >= 1) {
          // Cập nhật vào database
          const { error } = await updateCurrentlyWatching(
            movie.slug,
            currentTimeFloor,
            totalDurationFloor,
            episodeSlug
          );

          if (!error) {
            watchTimeRef.current = currentTimeFloor;
            startTimeRef.current = Date.now(); // Reset để tính lại từ điểm hiện tại
          }
        }
      } catch (error) {
        // Error in watch progress interval
      }
    }, 5000); // Cập nhật mỗi 5 giây

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAuthenticated, movie.slug, episodeSlug, hasInitializedRef.current, currentTime, duration]);

  // Lưu tiến độ khi rời trang (beforeunload, visibilitychange)
  useEffect(() => {
    if (!isAuthenticated || !hasInitializedRef.current) return;

    const saveProgress = async () => {
      try {
        // Lấy currentTime từ context
        const currentTimeFloor = Math.floor(currentTime) || watchTimeRef.current;
        const totalDurationFloor = Math.floor(duration || totalDurationRef.current || 0);

        // Nếu đã xem xong, xóa khỏi currently_watching
        if (totalDurationFloor > 0 && currentTimeFloor >= totalDurationFloor) {
          const { removeFromCurrentlyWatching } = await import("@/lib/supabase/movies");
          await removeFromCurrentlyWatching(movie.slug);
          return;
        }

        if (currentTimeFloor > 0) {
          await updateCurrentlyWatching(
            movie.slug,
            currentTimeFloor,
            totalDurationFloor,
            episodeSlug
          );
        }
      } catch (error) {
        // Error saving progress on unload
      }
    };

    // Lưu khi tab/window bị đóng hoặc ẩn
    const handleBeforeUnload = () => {
      saveProgress();
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        saveProgress();
      } else {
        // Khi quay lại, reset startTime để tính lại từ điểm hiện tại
        startTimeRef.current = Date.now();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      // Lưu lần cuối khi component unmount
      saveProgress();
    };
  }, [isAuthenticated, movie.slug, episodeSlug, hasInitializedRef.current, currentTime, duration]);

  // Lưu khi component unmount (chuyển trang)
  useEffect(() => {
    if (!isAuthenticated || !hasInitializedRef.current) return;

    return () => {
      // Lấy currentTime từ context
      const currentTimeFloor = Math.floor(currentTime) || watchTimeRef.current;
      const totalDurationFloor = Math.floor(duration || totalDurationRef.current || 0);

      // Nếu đã xem xong, xóa khỏi currently_watching
      if (totalDurationFloor > 0 && currentTimeFloor >= totalDurationFloor) {
        import("@/lib/supabase/movies").then(({ removeFromCurrentlyWatching }) => {
          removeFromCurrentlyWatching(movie.slug).catch(() => {});
        });
        return;
      }

      if (currentTimeFloor > 0) {
        updateCurrentlyWatching(
          movie.slug,
          currentTimeFloor,
          totalDurationFloor,
          episodeSlug
        ).catch(() => {});
      }
    };
  }, [isAuthenticated, movie.slug, episodeSlug, hasInitializedRef.current, currentTime, duration]);

  // Lưu tiến độ khi video pause hoặc timeupdate (mỗi 10 giây từ timeupdate)
  useEffect(() => {
    if (!isAuthenticated || !hasInitializedRef.current) return;

    let lastSaveTime = 0;
    const SAVE_INTERVAL = 10000; // Lưu mỗi 10 giây từ timeupdate

    const saveCurrentTime = async (currentTimeValue: number, totalDurationValue: number) => {
      if (currentTimeValue > 0 && currentTimeValue !== watchTimeRef.current) {
        watchTimeRef.current = currentTimeValue;
        startTimeRef.current = Date.now();

        await updateCurrentlyWatching(
          movie.slug,
          currentTimeValue,
          totalDurationValue,
          episodeSlug
        );
      }
    };

    // Lưu mỗi 10 giây từ timeupdate (sử dụng currentTime từ context)
    const checkAndSave = () => {
      try {
        const currentTimeFloor = Math.floor(currentTime);
        const totalDurationFloor = Math.floor(duration || totalDurationRef.current || 0);

        // Cập nhật totalDurationRef nếu có
        if (totalDurationFloor > 0 && totalDurationFloor !== totalDurationRef.current && !isNaN(totalDurationFloor)) {
          totalDurationRef.current = totalDurationFloor;
        }

        // Lưu mỗi 10 giây từ timeupdate
        const now = Date.now();
        if (now - lastSaveTime >= SAVE_INTERVAL && currentTimeFloor > 0) {
          lastSaveTime = now;
          saveCurrentTime(currentTimeFloor, totalDurationFloor).catch(() => {});
        }
      } catch (error) {
        // Error in timeupdate handler
      }
    };

    // Check và lưu mỗi giây để đảm bảo bắt được thay đổi từ context
    const intervalId = setInterval(checkAndSave, 1000);

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isAuthenticated, movie.slug, episodeSlug, hasInitializedRef.current, currentTime, duration]);

  return null; // Component này không render gì
}

