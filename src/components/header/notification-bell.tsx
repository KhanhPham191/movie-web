"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getImageUrl, getNewlyUpdatedFilms, type FilmItem } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { getCurrentlyWatching, type CurrentlyWatching } from "@/lib/supabase/movies";

function formatTimeAgo(dateStr?: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";

  const now = Date.now();
  const diffMs = Math.max(0, now - date.getTime());
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays} ngày trước`;

  return date.toLocaleDateString("vi-VN");
}

function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return "0m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function formatTimeDisplay(watchTime: number, totalDuration: number): string {
  return `${formatTime(watchTime)} / ${formatTime(totalDuration)}`;
}

function buildWatchHref(item: CurrentlyWatching): string {
  if (item.episode_slug) {
    const t = Number.isFinite(item.watch_time) ? Math.floor(item.watch_time) : 0;
    return `/xem-phim/${item.movie_slug}/${item.episode_slug}?t=${t}`;
  }
  return `/phim/${item.movie_slug}`;
}

export function NotificationBell() {
  const { isAuthenticated } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"watching" | "films">("films");
  const [watching, setWatching] = useState<CurrentlyWatching[]>([]);
  const [films, setFilms] = useState<FilmItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasNew, setHasNew] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isOpen) return;
      try {
        setIsLoading(true);
        if (isAuthenticated) {
          const { data } = await getCurrentlyWatching();
          const items = Array.isArray(data) ? data.slice(0, 10) : [];

          if (items.length > 0) {
            setMode("watching");
            setWatching(items);
            setFilms([]);
            setHasNew(true);
            return;
          }
        }

        const res = await getNewlyUpdatedFilms(1);
        const items: FilmItem[] = Array.isArray(res?.items) ? res.items : [];
        setMode("films");
        setFilms(items.slice(0, 10));
        setWatching([]);
        setHasNew(items.length > 0);
      } catch {
        setMode("films");
        setFilms([]);
        setWatching([]);
        setHasNew(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [isOpen, isAuthenticated]);

  if (!isMounted) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className="p-2 hover:text-gray-300 transition-colors relative outline-none outline-offset-0 ring-0 focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0 data-[state=open]:outline-none data-[state=open]:ring-0 data-[state=open]:ring-offset-0 data-[state=open]:border-transparent"
          style={{ outline: "none", boxShadow: "none" }}
          aria-label="Thông báo"
        >
          <Bell className="w-5 h-5" />
          {hasNew && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 bg-[#0f0f0f]/95 backdrop-blur border-gray-800">
        <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-white">
            {mode === "watching" ? "Tiếp tục xem" : "Phim mới cập nhật"}
          </h3>
          <button
            type="button"
            className="text-xs text-[#F6C453] hover:text-white transition-colors"
            onClick={() => {
              setHasNew(false);
              setIsOpen(false);

              if (mode === "watching") {
                // On Home page, scroll to the "Bạn đang xem" section.
                const el = document.getElementById("currently-watching");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "start" });
                  return;
                }
              }

              router.push("/danh-sach/phim-moi-cap-nhat");
            }}
          >
            Xem tất cả
          </button>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-8 text-center text-sm text-gray-400">
              Đang tải thông báo...
            </div>
          ) : mode === "watching" ? (
            watching.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <Bell className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">Chưa có gì để tiếp tục</p>
              </div>
            ) : (
              <div className="py-2">
                {watching.map((n) => {
                  const posterRaw = n.movie_thumb || n.movie_poster || "";
                  const imageUrl = posterRaw ? getImageUrl(posterRaw) : "";

                  return (
                    <button
                      key={n.id}
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3"
                      onClick={() => {
                        router.push(buildWatchHref(n));
                        setIsOpen(false);
                      }}
                    >
                      <div className="relative w-12 h-16 sm:w-14 sm:h-20 rounded-md overflow-hidden bg-white/5 shrink-0">
                        {imageUrl && (
                          <Image
                            src={imageUrl}
                            alt={n.movie_name || "Poster"}
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="truncate font-semibold text-sm text-white">
                            {n.movie_name || "Phim"}
                          </span>
                        </div>
                        <div className="text-xs text-white/70 flex items-center gap-2 flex-wrap">
                          {n.episode_name && <span>{n.episode_name}</span>}
                          <span>{formatTimeDisplay(n.watch_time, n.total_duration)}</span>
                          {n.updated_at && <span className="text-white/50">{formatTimeAgo(n.updated_at)}</span>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )
          ) : films.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Bell className="w-8 h-8 text-gray-500 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Chưa có thông báo mới</p>
            </div>
          ) : (
            <div className="py-2">
              {films.map((n) => (
                <button
                  key={n.slug}
                  type="button"
                  className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3"
                  onClick={() => {
                    if (n.slug) {
                      router.push(`/phim/${n.slug}`);
                      setIsOpen(false);
                    }
                  }}
                >
                  <div className="relative w-12 h-16 sm:w-14 sm:h-20 rounded-md overflow-hidden bg-white/5 shrink-0">
                    {getImageUrl(n.thumb_url || n.poster_url) && (
                        <Image
                            src={getImageUrl(n.thumb_url || n.poster_url)}
                        alt={n.name || "Poster"}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="truncate font-semibold text-sm text-white">
                        {n.name || "Phim mới"}
                      </span>
                      {n.quality && (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-white/10 text-white/80 uppercase">
                          {n.quality}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/70 flex items-center gap-2 flex-wrap">
                      {n.current_episode && <span>{n.current_episode}</span>}
                      {n.time && <span>{n.time}</span>}
                      {n.modified && (
                        <span className="text-white/50">
                          {formatTimeAgo(n.modified)}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
