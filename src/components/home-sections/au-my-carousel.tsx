"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play } from "lucide-react";
import type { FilmItem } from "@/lib/api";
import { getImageUrl } from "@/lib/api";

interface AuMyCarouselProps {
  movies: FilmItem[];
}

// Format episode label: "Hoàn tất (20/20)" -> "Trọn Bộ (20/20)" or "Cập Nhật Tập 10"
function formatEpisodeLabel(episode?: string) {
  if (!episode) return "";
  const match = episode.match(/Hoàn tất\s*\(([^)]+)\)/i);
  if (match) return `Trọn Bộ (${match[1]})`;
  // Check for "Cập nhật" pattern
  const updateMatch = episode.match(/Cập nhật\s*(?:tập|Tập)?\s*(\d+)/i);
  if (updateMatch) return `Cập Nhật Tập ${updateMatch[1]}`;
  return episode;
}

// Get language badge without "VS" prefix
function getLanguageBadge(language?: string) {
  if (!language) return "Vietsub";
  const lang = language.toLowerCase();
  const hasLT = lang.includes("lồng") || lang.includes("lt");
  const hasTM = lang.includes("thuyết minh") || lang.includes("tm");

  const parts: string[] = [];
  if (hasTM) parts.push("TM");
  if (hasLT) parts.push("LT");

  if (parts.length > 0) {
    return parts.join("-");
  }

  // Fallback to common labels
  if (lang.includes("vietsub") || lang.includes("viet") || lang.includes("vs")) return "Vietsub";
  if (lang.includes("thuyết minh")) return "Thuyết minh";
  return "Vietsub";
}

// Format duration: "25 phút/tập" or "100 phút"
function formatDuration(time?: string, totalEpisodes?: number) {
  if (!time) return "";
  const normalized = time.toLowerCase();

  // Nếu API đã trả sẵn "phút" hoặc "phút/tập" thì dùng luôn, không thêm gì nữa
  if (normalized.includes("phút") || normalized.includes("phut")) {
    return time;
  }

  // If it's a series with episodes, show per episode
  if (totalEpisodes && totalEpisodes > 1) {
    return `${time} phút/tập`;
  }
  // If it's a movie, just show total time
  return `${time} phút`;
}

export function AuMyCarousel({ movies }: AuMyCarouselProps) {
  const displayMovies = useMemo(() => movies.slice(0, 20), [movies]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasDragged = useRef(false);
  const dragDistance = useRef<number>(0);
  const dragState = useRef<{
    startX: number;
    scrollLeft: number;
    lastX: number;
    lastTime: number;
    velocities: number[];
  }>({
    startX: 0,
    scrollLeft: 0,
    lastX: 0,
    lastTime: 0,
    velocities: [],
  });
  const animationFrameRef = useRef<number | null>(null);
  const momentumRef = useRef<number | null>(null);

  // Smooth scroll với momentum
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !scrollRef.current) return;

      const now = performance.now();
      const dx = e.clientX - dragState.current.startX;

      // Tính khoảng cách di chuyển
      dragDistance.current = Math.abs(dx);

      // Nếu di chuyển > 5px thì coi là drag
      if (dragDistance.current > 5) {
        hasDragged.current = true;
      }

      const currentScrollLeft = dragState.current.scrollLeft - dx;

      // Tính velocity cho momentum
      if (dragState.current.lastTime > 0) {
        const timeDelta = now - dragState.current.lastTime;
        const xDelta = e.clientX - dragState.current.lastX;
        if (timeDelta > 0) {
          const velocity = xDelta / timeDelta;
          dragState.current.velocities.push(velocity);
          // Chỉ giữ lại 5 giá trị gần nhất
          if (dragState.current.velocities.length > 5) {
            dragState.current.velocities.shift();
          }
        }
      }

      dragState.current.lastX = e.clientX;
      dragState.current.lastTime = now;

      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollLeft = currentScrollLeft;
        }
      });
    },
    [isDragging]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;

    const wasDragging = hasDragged.current;
    const dragDist = dragDistance.current;

    setIsDragging(false);

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Momentum scrolling
    if (scrollRef.current && dragState.current.velocities.length > 0) {
      const recentVelocities = dragState.current.velocities.slice(-3);
      const avgVelocity =
        recentVelocities.reduce((a, b) => a + b, 0) / recentVelocities.length;

      if (Math.abs(avgVelocity) > 0.15) {
        let momentum = avgVelocity * 20;
        const friction = 0.94;
        const minMomentum = 0.5;

        const animateMomentum = () => {
          if (!scrollRef.current || Math.abs(momentum) < minMomentum) {
            momentumRef.current = null;
            return;
          }

          const currentScroll = scrollRef.current.scrollLeft;
          scrollRef.current.scrollLeft = currentScroll - momentum;
          momentum *= friction;
          momentumRef.current = requestAnimationFrame(animateMomentum);
        };

        momentumRef.current = requestAnimationFrame(animateMomentum);
      }
    }

    // Nếu đã drag, prevent click trong 300ms
    if (wasDragging || dragDist > 5) {
      hasDragged.current = true;
      setTimeout(() => {
        hasDragged.current = false;
        dragDistance.current = 0;
      }, 300);
    } else {
      hasDragged.current = false;
      dragDistance.current = 0;
    }

    dragState.current.velocities = [];
    dragState.current.lastX = 0;
    dragState.current.lastTime = 0;
  }, [isDragging]);

  if (displayMovies.length === 0) return null;

  return (
    <div className="w-full">
      {/* Horizontal Scrollable Carousel */}
      <div
        ref={scrollRef}
        onMouseDown={(e) => {
          // Chỉ hoạt động với chuột trái (button 0)
          if (e.button !== 0 || !scrollRef.current) return;

          // Dừng momentum nếu đang chạy
          if (momentumRef.current) {
            cancelAnimationFrame(momentumRef.current);
            momentumRef.current = null;
          }

          // Reset drag flag và tracking
          hasDragged.current = false;
          dragDistance.current = 0;

          e.preventDefault();
          setIsDragging(true);
          dragState.current = {
            startX: e.clientX,
            scrollLeft: scrollRef.current.scrollLeft,
            lastX: e.clientX,
            lastTime: performance.now(),
            velocities: [],
          };
        }}
        onMouseMove={(e) => {
          if (!isDragging) return;
          e.preventDefault();
          handleMouseMove(e.nativeEvent);
        }}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={(e) => {
          // Nếu đã drag thì prevent click vào movie card
          if (hasDragged.current || dragDistance.current > 5) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        }}
        onClickCapture={(e) => {
          // Capture phase để chặn sớm hơn
          if (hasDragged.current || dragDistance.current > 5) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        }}
        style={{
          scrollBehavior: "auto",
          overscrollBehaviorX: "contain",
          WebkitOverflowScrolling: "touch",
          touchAction: "pan-x pan-y",
          scrollSnapType: "none",
          WebkitTransform: "translate3d(0, 0, 0)",
          transform: "translate3d(0, 0, 0)",
        }}
        className={`flex gap-4 sm:gap-5 overflow-x-auto pb-4 scrollbar-hide [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {displayMovies.map((movie) => {
          const thumbUrl = getImageUrl(movie.thumb_url);
          const posterUrl = getImageUrl(movie.poster_url);
          const year = movie.created
            ? new Date(movie.created).getFullYear()
            : undefined;
          const episodeLabel = formatEpisodeLabel(movie.current_episode);
          const languageBadge = getLanguageBadge(movie.language);
          const duration = formatDuration(movie.time, movie.total_episodes);

          return (
            <Link
              key={movie.slug}
              href={`/phim/${movie.slug}`}
              className="group shrink-0 w-[clamp(280px,22vw,400px)] sm:w-[clamp(300px,23vw,420px)] md:w-[clamp(320px,24vw,450px)] lg:w-[clamp(340px,calc((100vw-192px-60px)/4),480px)] cursor-pointer"
              onClick={(e) => {
                // Prevent click nếu đã drag
                if (hasDragged.current || dragDistance.current > 5) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              onClickCapture={(e) => {
                // Capture phase để chặn sớm hơn
                if (hasDragged.current || dragDistance.current > 5) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            >
              <div className="flex flex-col h-full rounded-xl overflow-hidden bg-[#1a1a1a] hover:bg-[#1f1f1f] border border-white/10 hover:border-[#F6C453]/60 shadow-[0_4px_18px_rgba(0,0,0,0.6)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.8)] transition-all duration-500 ease-in-out hover:scale-[1.01]">
                {/* Thumbnail Section - Top (using poster_url) */}
                <div className="relative aspect-video w-full overflow-hidden rounded-t-xl">
                  <Image
                    src={posterUrl}
                    alt={movie.name}
                    fill
                    className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-[1.03]"
                    sizes="(max-width: 640px) 280px, (max-width: 768px) 320px, 360px"
                    unoptimized
                  />

                  {/* Badge Overlay - Bottom Left */}
                  <div className="absolute bottom-2 left-2 z-10">
                    <span className="inline-block rounded-md bg-[#F6C453] text-black text-xs font-semibold px-2 py-1 shadow-lg">
                      {languageBadge}
                    </span>
                  </div>

                  {/* Hover Overlay - Subtle */}
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out" />

                  {/* Play Button - Center on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out">
                    <div className="relative transform scale-0 group-hover:scale-100 transition-transform duration-500 ease-in-out">
                      <div className="absolute inset-0 bg-[#F6C453] rounded-full blur-lg opacity-50 group-hover:opacity-70 transition-opacity duration-500 ease-in-out" />
                      <button
                        type="button"
                        className="relative w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-[#F6C453] flex items-center justify-center shadow-xl cursor-pointer"
                        aria-label="Phát phim"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.location.href = `/phim/${movie.slug}`;
                        }}
                      >
                        <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white fill-white ml-0.5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Metadata Section - Bottom with Poster on Left */}
                <div className="flex-1 flex gap-3 p-3 sm:p-4 bg-[#1a1a1a] rounded-b-xl">
                  {/* Poster - Left Side (using thumb_url) */}
                  {thumbUrl && (
                    <div className="relative shrink-0 w-16 h-20 sm:w-20 sm:h-28 md:w-24 md:h-32 rounded-md overflow-hidden">
                      <Image
                        src={thumbUrl}
                        alt={movie.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 64px, (max-width: 768px) 80px, 96px"
                        unoptimized
                      />
                    </div>
                  )}

                  {/* Text Content - Right Side */}
                  <div className="flex-1 min-w-0">
                    {/* Vietnamese Title */}
                    <h3 className="text-white font-bold text-sm sm:text-base mb-1.5 line-clamp-2 group-hover:text-[#F6C453] transition-colors duration-500 ease-in-out">
                      {movie.name}
                    </h3>

                    {/* English Title */}
                    {movie.original_name && movie.original_name !== movie.name && (
                      <p className="text-gray-400 text-xs sm:text-sm mb-2 line-clamp-1">
                        {movie.original_name}
                      </p>
                    )}

                    {/* Details: Year • Duration • Status */}
                    <div className="flex flex-wrap items-center gap-1.5 text-gray-400 text-[13px] sm:text-sm">
                      {year && (
                        <>
                          <span>{year}</span>
                          {duration && <span>•</span>}
                        </>
                      )}
                      {duration && (
                        <>
                          <span className="font-semibold text-white">{duration}</span>
                          {episodeLabel && <span>•</span>}
                        </>
                      )}
                      {episodeLabel && (
                        <span className="text-gray-400">{episodeLabel}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
