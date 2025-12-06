"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { addToCurrentlyWatching, updateCurrentlyWatching } from "@/lib/supabase/movies";
import { useAuth } from "@/contexts/auth-context";
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

        if (error) {
          console.error("Error adding to currently watching:", error);
        } else {
          hasInitializedRef.current = true;
          startTimeRef.current = Date.now();
        }
      } catch (error) {
        console.error("Error initializing watch:", error);
      }
    };

    initializeWatch();
  }, [isAuthenticated, movie, episodeSlug, episodeName]);

  // Cập nhật tiến độ mỗi 10 giây
  useEffect(() => {
    if (!isAuthenticated || !hasInitializedRef.current) return;

    intervalRef.current = setInterval(async () => {
      try {
        // Tính thời gian đã xem = thời gian ban đầu + thời gian đã ở lại trang
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const currentWatchTime = watchTimeRef.current + elapsed;
        const totalDuration = totalDurationRef.current || 0;

        // Nếu đã xem xong (progress >= 100%), xóa khỏi currently_watching
        if (totalDuration > 0 && currentWatchTime >= totalDuration) {
          const { removeFromCurrentlyWatching } = await import("@/lib/supabase/movies");
          const { error } = await removeFromCurrentlyWatching(movie.slug);
          if (error) {
            console.error("Error removing completed movie:", error);
          }
          // Dừng interval vì đã xem xong
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return;
        }

        // Cập nhật vào database
        const { error } = await updateCurrentlyWatching(
          movie.slug,
          currentWatchTime,
          totalDuration,
          episodeSlug
        );

        if (error) {
          console.error("Error updating watch progress:", error);
        } else {
          watchTimeRef.current = currentWatchTime;
          startTimeRef.current = Date.now(); // Reset để tính lại từ điểm hiện tại
        }
      } catch (error) {
        console.error("Error in watch progress interval:", error);
      }
    }, 10000); // Cập nhật mỗi 10 giây

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAuthenticated, movie.slug, episodeSlug, hasInitializedRef.current]);

  // Lưu tiến độ khi rời trang (beforeunload, visibilitychange)
  useEffect(() => {
    if (!isAuthenticated || !hasInitializedRef.current) return;

    const saveProgress = async () => {
      try {
        const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
        const currentWatchTime = watchTimeRef.current + elapsed;
        const totalDuration = totalDurationRef.current || 0;

        // Nếu đã xem xong, xóa khỏi currently_watching
        if (totalDuration > 0 && currentWatchTime >= totalDuration) {
          const { removeFromCurrentlyWatching } = await import("@/lib/supabase/movies");
          await removeFromCurrentlyWatching(movie.slug);
          return;
        }

        await updateCurrentlyWatching(
          movie.slug,
          currentWatchTime,
          totalDuration,
          episodeSlug
        );
      } catch (error) {
        console.error("Error saving progress on unload:", error);
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
  }, [isAuthenticated, movie.slug, episodeSlug, hasInitializedRef.current]);

  // Lưu khi component unmount (chuyển trang)
  useEffect(() => {
    if (!isAuthenticated || !hasInitializedRef.current) return;

    return () => {
      const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const currentWatchTime = watchTimeRef.current + elapsed;
      const totalDuration = totalDurationRef.current || 0;

      // Nếu đã xem xong, xóa khỏi currently_watching
      if (totalDuration > 0 && currentWatchTime >= totalDuration) {
        import("@/lib/supabase/movies").then(({ removeFromCurrentlyWatching }) => {
          removeFromCurrentlyWatching(movie.slug).catch((error) => {
            console.error("Error removing completed movie on unmount:", error);
          });
        });
        return;
      }

      updateCurrentlyWatching(
        movie.slug,
        currentWatchTime,
        totalDuration,
        episodeSlug
      ).catch((error) => {
        console.error("Error saving progress on unmount:", error);
      });
    };
  }, [isAuthenticated, movie.slug, episodeSlug, hasInitializedRef.current]);

  return null; // Component này không render gì
}

