"use client";

import { useMemo, useRef, useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Play, Heart, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { FilmItem, FilmDetail } from "@/lib/api";
import { getImageUrl, getFilmDetail } from "@/lib/api";
import { isValidTime } from "@/lib/utils";

interface AnimeCarouselProps {
  movies: FilmItem[];
}

function formatEpisodeLabel(episode?: string) {
  if (!episode) return "";
  const match = episode.match(/Hoàn tất\s*\(([^)]+)\)/i);
  if (match) return `Trọn Bộ (${match[1]})`;
  const updateMatch = episode.match(/Cập nhật\s*(?:tập|Tập)?\s*(\d+)/i);
  if (updateMatch) return `Cập Nhật Tập ${updateMatch[1]}`;
  return episode;
}

function parseEpisodeInfo(episode?: string): { part?: string; episode?: string } {
  if (!episode) return {};
  const partMatch = episode.match(/Phần\s*(\d+)/i);
  const epMatch = episode.match(/Tập\s*(\d+)/i) || episode.match(/(\d+)\s*\/\s*\d+/);
  return {
    part: partMatch ? `Phần ${partMatch[1]}` : undefined,
    episode: epMatch ? `Tập ${epMatch[1]}` : undefined,
  };
}

// Kiểm tra có Vietsub không
function hasVietsub(language?: string): boolean {
  if (!language) return false;
  const lang = language.toLowerCase();
  return lang.includes("viet") || lang.includes("vs") || lang.includes("vietsub");
}

// Kiểm tra có Thuyết minh không
function hasThuyetMinh(language?: string): boolean {
  if (!language) return false;
  const lang = language.toLowerCase();
  return lang.includes("thuyết minh") || lang.includes("tm") || lang.includes("thuyet minh");
}

// Kiểm tra có Lồng tiếng không
function hasLongTieng(language?: string): boolean {
  if (!language) return false;
  const lang = language.toLowerCase();
  return lang.includes("lồng") || lang.includes("lt") || lang.includes("long") || lang.includes("lồng tiếng") || lang.includes("long tieng");
}

// Helper component để render language badges nhất quán
function LanguageBadges({ language }: { language?: string }) {
  const hasVS = hasVietsub(language);
  const hasTM = hasThuyetMinh(language);
  const hasLT = hasLongTieng(language);
  
  if (!hasVS && !hasTM && !hasLT) return null;
  
  // Tạo label kết hợp
  const labels: string[] = [];
  if (hasVS) labels.push("Vietsub");
  if (hasTM) labels.push("TM");
  if (hasLT) labels.push("LT");
  
  const badgeText = labels.join(" + ");
  
  return (
    <div className="absolute bottom-2 left-2 z-30">
      <Badge className="bg-gradient-to-r from-[#F6C453] via-[#F6C453] to-[#FAF9F6] text-black border-0 text-[10px] sm:text-[11px] font-bold px-2.5 py-1 shadow-lg">
        {badgeText}
      </Badge>
    </div>
  );
}

function formatDuration(time?: string, totalEpisodes?: number) {
  if (!isValidTime(time)) return "";
  return String(time).trim();
}

export function AnimeCarousel({ movies }: AnimeCarouselProps) {
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

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !scrollRef.current) return;
      const now = performance.now();
      const dx = e.clientX - dragState.current.startX;
      dragDistance.current = Math.abs(dx);
      if (dragDistance.current > 5) {
        hasDragged.current = true;
      }
      const currentScrollLeft = dragState.current.scrollLeft - dx;
      if (dragState.current.lastTime > 0) {
        const timeDelta = now - dragState.current.lastTime;
        const xDelta = e.clientX - dragState.current.lastX;
        if (timeDelta > 0) {
          const velocity = xDelta / timeDelta;
          dragState.current.velocities.push(velocity);
          if (dragState.current.velocities.length > 5) {
            dragState.current.velocities.shift();
          }
        }
      }
      dragState.current.lastX = e.clientX;
      dragState.current.lastTime = now;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
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
      <div
        ref={scrollRef}
        onMouseDown={(e) => {
          if (e.button !== 0 || !scrollRef.current) return;
          if (momentumRef.current) {
            cancelAnimationFrame(momentumRef.current);
            momentumRef.current = null;
          }
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
          if (hasDragged.current || dragDistance.current > 5) {
            e.preventDefault();
            e.stopPropagation();
            return false;
          }
        }}
        onClickCapture={(e) => {
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
          overflowX: "auto",
        }}
        className={`flex items-start justify-start gap-3 sm:gap-4 overflow-x-auto scrollbar-hide px-3 sm:px-4 md:px-12 pb-12 sm:pb-16 pt-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        {displayMovies.map((movie) => {
          const thumbUrl = getImageUrl(movie.thumb_url);
          const posterUrl = getImageUrl(movie.poster_url);
          const year = movie.created
            ? (() => {
                const date = new Date(movie.created);
                const yearValue = date.getFullYear();
                return !isNaN(yearValue) && isFinite(yearValue) ? yearValue : undefined;
              })()
            : undefined;
          const episodeLabel = formatEpisodeLabel(movie.current_episode);
          const duration = formatDuration(movie.time, movie.total_episodes);
          const cleanDescription =
            movie.description?.replace(/<[^>]*>/g, "") || "";

          return (
            <MovieCardWithPopup
              key={movie.slug}
              movie={movie}
              thumbUrl={thumbUrl}
              posterUrl={posterUrl}
              year={year}
              episodeLabel={episodeLabel}
              duration={duration}
              cleanDescription={cleanDescription}
              hasDragged={hasDragged}
              dragDistance={dragDistance}
              scrollRef={scrollRef}
            />
          );
        })}
      </div>
    </div>
  );
}

function MovieCardWithPopup({
  movie,
  thumbUrl,
  posterUrl,
  year,
  episodeLabel,
  duration,
  cleanDescription,
  hasDragged,
  dragDistance,
  scrollRef,
}: {
  movie: FilmItem;
  thumbUrl: string;
  posterUrl: string;
  year?: number;
  episodeLabel: string;
  duration: string;
  cleanDescription: string;
  hasDragged: React.MutableRefObject<boolean>;
  dragDistance: React.MutableRefObject<number>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
}) {
  const router = useRouter();
  const cardRef = useRef<HTMLAnchorElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [popupPosition, setPopupPosition] = useState<{ left: number; top: number } | null>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [canShowHoverPopup, setCanShowHoverPopup] = useState(false);
  const positionFrameRef = useRef<number | null>(null);
  const hoverDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNavigatingRef = useRef(false);
  const lastPopupPositionRef = useRef<{ left: number; top: number } | null>(null);

  useEffect(() => {
    const hoverCapable = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    setCanShowHoverPopup(hoverCapable && window.innerWidth >= 1024);
  }, []);

  const updatePopupPosition = useCallback(() => {
    if (!isHovered || !cardRef.current) return;
    if (positionFrameRef.current) {
      cancelAnimationFrame(positionFrameRef.current);
    }
    positionFrameRef.current = requestAnimationFrame(() => {
      if (!cardRef.current) return;
      const rect = cardRef.current.getBoundingClientRect();
      const nextPosition = {
        left: rect.left + rect.width / 2,
        top: rect.top + rect.height / 2,
      };
      const prevPosition = lastPopupPositionRef.current;
      const hasMeaningfulChange =
        !prevPosition ||
        Math.abs(prevPosition.left - nextPosition.left) > 1 ||
        Math.abs(prevPosition.top - nextPosition.top) > 1;

      if (hasMeaningfulChange) {
        setPopupPosition(nextPosition);
        lastPopupPositionRef.current = nextPosition;
      }
    });
  }, [isHovered]);

  useEffect(() => {
    if (!isHovered || !canShowHoverPopup) {
      setPopupPosition(null);
      lastPopupPositionRef.current = null;
      if (positionFrameRef.current) {
        cancelAnimationFrame(positionFrameRef.current);
        positionFrameRef.current = null;
      }
      return;
    }

    updatePopupPosition();

    const handleScrollOrResize = () => updatePopupPosition();
    const container = scrollRef.current;

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    container?.addEventListener("scroll", handleScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      container?.removeEventListener("scroll", handleScrollOrResize);
      if (positionFrameRef.current) {
        cancelAnimationFrame(positionFrameRef.current);
        positionFrameRef.current = null;
      }
    };
  }, [isHovered, canShowHoverPopup, scrollRef, updatePopupPosition]);

  useEffect(() => {
    return () => {
      if (hoverDelayRef.current) {
        clearTimeout(hoverDelayRef.current);
        hoverDelayRef.current = null;
      }
    };
  }, []);

  const selectFirstEpisodeSlug = (detail?: FilmDetail | null) => {
    const eps = detail?.episodes || [];
    if (!eps.length) return null;
    const serverPriority = ["vietsub", "lồng", "long", "thuyết", "thuyet", "tm"];
    const normalize = (s: string) => s.toLowerCase();
    const pickServer =
      eps.find((s) => serverPriority.some((p) => normalize(s.server_name || "").includes(p))) ||
      eps[0];
    const firstEpisode = pickServer?.items?.[0];
    return firstEpisode?.slug || null;
  };

  const handleWatchNow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    try {
      const detailRes = await getFilmDetail(movie.slug);
      const epSlug = selectFirstEpisodeSlug(detailRes.movie);
      if (epSlug) {
        router.push(`/xem-phim/${movie.slug}/${epSlug}`);
      } else {
        // Fallback: chuyển đến trang chi tiết phim nếu không tìm được episode
        router.push(`/phim/${movie.slug}`);
      }
    } catch (err) {
      // Fallback khi API lỗi: chuyển đến trang chi tiết phim
      router.push(`/phim/${movie.slug}`);
    } finally {
      isNavigatingRef.current = false;
    }
  };

  const handleMouseEnterWithDelay = () => {
    if (!canShowHoverPopup || hasDragged.current || dragDistance.current > 5) return;
    if (hoverDelayRef.current) clearTimeout(hoverDelayRef.current);
    hoverDelayRef.current = setTimeout(() => {
      setIsHovered(true);
    }, 700);
  };

  const handleMouseLeaveWithCancel = (e?: React.MouseEvent) => {
    if (hoverDelayRef.current) {
      clearTimeout(hoverDelayRef.current);
      hoverDelayRef.current = null;
    }
    const nextTarget = e?.relatedTarget as Node | null;
    if (nextTarget && popupRef.current && popupRef.current.contains(nextTarget)) {
      return;
    }
    setIsHovered(false);
  };

  const popupContent =
    canShowHoverPopup && isHovered && popupPosition ? (
      <div
        ref={popupRef}
        className="pointer-events-auto fixed z-[9999] w-[min(480px,82vw)] hidden lg:block transition-all duration-320 ease-[cubic-bezier(0.22,0.61,0.36,1)]"
        style={{
          left: `${popupPosition.left}px`,
          top: `${popupPosition.top}px`,
          transform: `translate(-50%, -50%) translateY(${isHovered ? "0px" : "10px"}) scale(${isHovered ? 1 : 0.95})`,
          opacity: isHovered ? 1 : 0,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={(e) => {
          const nextTarget = e?.relatedTarget as Node | null;
          if (nextTarget && cardRef.current && cardRef.current.contains(nextTarget)) {
            return;
          }
          setIsHovered(false);
        }}
      >
        <div className="rounded-xl border border-white/15 bg-[#050509]/95 overflow-hidden shadow-[0_18px_40px_rgba(0,0,0,0.85)] backdrop-blur-md">
          {thumbUrl && (
            <div className="relative aspect-video w-full overflow-hidden bg-[#0a0a0a]">
              <Image
                src={posterUrl}
                alt={movie.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 0px, 480px"
              />
            </div>
          )}
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1">
              <h3 className="text-[18px] font-bold text-white line-clamp-2">
                {movie.name}
              </h3>
              {movie.original_name && movie.original_name !== movie.name && (
                <p className="text-[14px] text-[#F6C453] line-clamp-1">
                  {movie.original_name}
                </p>
              )}
            </div>
            {(() => {
              const episodeInfo = parseEpisodeInfo(movie.current_episode);
              return (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-sm bg-black/80 px-2.5 py-1.5 text-[12px] font-semibold text-white border border-white/20">
                    T16
                  </span>
                  {year && (
                    <span className="inline-flex items-center rounded-sm bg-white px-2.5 py-1.5 text-[12px] font-semibold text-black">
                      {year}
                    </span>
                  )}
                  {episodeInfo.part && (
                    <span className="inline-flex items-center rounded-sm bg-white px-2.5 py-1.5 text-[12px] font-semibold text-black">
                      {episodeInfo.part}
                    </span>
                  )}
                  {episodeInfo.episode && (
                    <span className="inline-flex items-center rounded-sm bg-white px-2.5 py-1.5 text-[12px] font-semibold text-black">
                      {episodeInfo.episode}
                    </span>
                  )}
                </div>
              );
            })()}
            {movie.category && movie.category.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 text-[13px] text-white">
                {movie.category.slice(0, 4).map((cat, i) => (
                  <span key={cat.id}>
                    {cat.name}
                    {i < Math.min(movie.category.length, 4) - 1 && (
                      <span className="mx-2 text-gray-500">•</span>
                    )}
                  </span>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3 pt-2">
               <Link
                 href={`/phim/${movie.slug}`}
                 className="pointer-events-auto cursor-pointer bg-[#F6C453] hover:bg-[#F6C453]/90 text-black font-bold text-base rounded-md flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                 style={{ width: "139.52px", height: "46px" }}
                 onClick={(e) => {
                   e.preventDefault();
                   e.stopPropagation();
                   handleWatchNow(e);
                 }}
               >
                <Play className="w-5 h-5 fill-black shrink-0" />
                <span>Xem ngay</span>
              </Link>
              <button
                type="button"
                className="pointer-events-auto bg-[#1a1a1a] hover:bg-[#252525] text-white border border-white/20 font-semibold text-base px-5 py-3.5 rounded-md flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <Heart className="w-5 h-5 shrink-0" />
                <span>Thích</span>
              </button>
              <Link
                href={`/phim/${movie.slug}`}
                className="pointer-events-auto bg-[#1a1a1a] hover:bg-[#252525] text-white border border-white/20 font-semibold text-base px-5 py-3.5 rounded-md flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Info className="w-5 h-5 shrink-0" />
                <span>Chi tiết</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <>
      {popupContent &&
        (typeof window !== "undefined"
          ? createPortal(popupContent, document.body)
          : popupContent)}
      <Link
        ref={cardRef}
        href={`/phim/${movie.slug}`}
        className="group relative shrink-0 w-[min(92vw,32rem)] max-w-[520px] sm:max-w-none sm:w-[clamp(300px,48vw,520px)] md:w-[clamp(340px,44vw,560px)] lg:w-[clamp(380px,38vw,620px)] xl:w-[clamp(400px,34vw,680px)] cursor-pointer"
        onMouseEnter={canShowHoverPopup ? handleMouseEnterWithDelay : undefined}
        onMouseLeave={canShowHoverPopup ? handleMouseLeaveWithCancel : undefined}
        onClick={(e) => {
          if (hasDragged.current || dragDistance.current > 5) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onClickCapture={(e) => {
          if (hasDragged.current || dragDistance.current > 5) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
          <div className="group relative w-full max-w-full h-full">
            {/* Outer glow frame */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#F6C453]/20 via-transparent to-[#DB2777]/15 blur-xl opacity-0 group-hover:opacity-100 transition duration-500" />

            {/* Cinema-style wide poster */}
            <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden bg-[#0a0a0a] transition-all duration-200 sm:duration-300 sm:group-hover:scale-[1.02] sm:group-hover:shadow-2xl flex-shrink-0 border border-white/5 sm:group-hover:border-[rgba(246,196,83,0.35)]">
              {/* Hover glow tint */}
              <div className="absolute inset-0 bg-[rgba(246,196,83,0.12)] opacity-0 group-hover:opacity-100 transition-opacity duration-200 sm:duration-300 pointer-events-none z-10" />

              <Image
                src={posterUrl}
                alt={movie.name}
                fill
                className="object-cover object-center transition-transform duration-200 sm:duration-300 ease-in-out sm:group-hover:scale-[1.03]"
                sizes="(max-width: 640px) min(92vw,520px), (max-width: 1024px) 48vw, (max-width: 1280px) 38vw, 680px"
                loading="lazy"
              />

              {/* Anime cards: hide language + episode badges */}

              {/* Dark gradient bar at bottom */}
              <div className="absolute inset-x-0 bottom-0 h-[96px] sm:h-[108px] bg-gradient-to-t from-[#050505] via-[#050505e6] to-transparent" />

              {/* Thumb + text overlay on bottom bar */}
              <div className="absolute left-3 right-3 bottom-3 flex items-end gap-2 sm:gap-3 z-20">
                <div className="relative aspect-[2/3] w-12 xs:w-14 sm:w-20 rounded-md overflow-hidden shadow-2xl shadow-black/80 border border-white/10 bg-black/60 flex-shrink-0">
                  <Image
                    src={thumbUrl}
                    alt={movie.name}
                    fill
                    className="object-cover object-center"
                    sizes="56px"
                    loading="lazy"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-xs xs:text-sm sm:text-base font-semibold text-white line-clamp-1">
                    {movie.name}
                  </h3>
                  {movie.original_name && movie.original_name !== movie.name && (
                    <p className="text-xs xs:text-sm text-gray-100 font-medium leading-snug line-clamp-1">
                      {movie.original_name}
                    </p>
                  )}

                  {cleanDescription && (
                    <p className="mt-0.5 text-[10px] xs:text-xs text-gray-300 line-clamp-2">
                      {cleanDescription}
                    </p>
                  )}

                  {(year || duration || episodeLabel) && (
                    <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gray-200 flex flex-wrap items-center gap-x-1.5 sm:gap-x-2 gap-y-0.5">
                      {year && <span>{year}</span>}
                      {duration && <span className="font-semibold text-white">{duration}</span>}
                      {episodeLabel && (
                        <span className="px-1 py-0.5 rounded bg-white/10 border border-white/10 text-[9px] xs:text-[10px]">
                          {episodeLabel}
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>

              {/* Play button - center on hover */}
              <div className="absolute inset-0 flex items-center justify-center z-30 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out">
                <div className="relative transform scale-0 group-hover:scale-100 transition-transform duration-500 ease-in-out">
                  <div className="absolute inset-0 bg-[#F6C453] rounded-full blur-lg opacity-50 group-hover:opacity-70 transition-opacity duration-500 ease-in-out" />
                  <button
                    type="button"
                    className="relative w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-[#F6C453] flex items-center justify-center shadow-xl cursor-pointer"
                    aria-label="Phát phim"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/phim/${movie.slug}`);
                    }}
                  >
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white fill-white ml-0.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
      </Link>
    </>
  );
}

export default AnimeCarousel;
