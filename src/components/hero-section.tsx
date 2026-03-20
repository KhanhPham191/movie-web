"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Info, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FilmItem } from "@/lib/api";
import { getImageUrl } from "@/lib/api";
import { isValidTime } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useIsMobile";

interface HeroSectionProps {
  movies: FilmItem[];
}

const SLIDE_DURATION = 8000;
// Throttle progress re-renders: desktop 150ms, mobile 400ms (thay vì 60fps)
const DESKTOP_PROGRESS_INTERVAL = 150;
const MOBILE_PROGRESS_INTERVAL = 400;

function formatEpisodeLabel(episode?: string) {
  if (!episode) return "";
  const match = episode.match(/Hoàn tất\s*\(([^)]+)\)/i);
  if (match) return match[1];
  return episode;
}

export function HeroSection({ movies }: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [contentVisible, setContentVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragDeltaX, setDragDeltaX] = useState(0);
  const progressRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const lastProgressUpdateRef = useRef<number>(0);
  const isMobile = useIsMobile();

  // Cả mobile lẫn desktop đều render 5 slide
  const featuredMovies = movies.slice(0, 5);
  const movie = featuredMovies[currentIndex];

  const goToSlide = useCallback(
    (index: number) => {
      if (index === currentIndex || isTransitioning) return;
      setContentVisible(false);
      setIsTransitioning(true);

      const fadeOutDelay = isMobile ? 120 : 180;
      const fadeInDelay = isMobile ? 350 : 450;

      setTimeout(() => {
        setPrevIndex(currentIndex);
        setCurrentIndex(index);
        setProgress(0);
        progressRef.current = 0;
        lastTimeRef.current = 0;
        lastProgressUpdateRef.current = 0;

        setTimeout(() => {
          setContentVisible(true);
          setIsTransitioning(false);
          setPrevIndex(null);
        }, fadeInDelay);
      }, fadeOutDelay);
    },
    [currentIndex, isTransitioning]
  );

  const goNext = useCallback(() => {
    goToSlide((currentIndex + 1) % featuredMovies.length);
  }, [currentIndex, featuredMovies.length, goToSlide]);

  const goPrev = useCallback(() => {
    goToSlide(
      (currentIndex - 1 + featuredMovies.length) % featuredMovies.length
    );
  }, [currentIndex, featuredMovies.length, goToSlide]);

  // Auto-rotate with progress
  useEffect(() => {
    if (featuredMovies.length <= 1 || isPaused || isTransitioning) return;

    const tick = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const delta = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      progressRef.current += delta;

      if (progressRef.current >= SLIDE_DURATION) {
        goNext();
        return;
      }

      // Throttle re-render cả desktop lẫn mobile
      const interval = isMobile ? MOBILE_PROGRESS_INTERVAL : DESKTOP_PROGRESS_INTERVAL;
      const timeSinceUpdate = timestamp - lastProgressUpdateRef.current;
      if (timeSinceUpdate >= interval) {
        const pct = Math.min((progressRef.current / SLIDE_DURATION) * 100, 100);
        setProgress(pct);
        lastProgressUpdateRef.current = timestamp;
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [featuredMovies.length, isPaused, isTransitioning, goNext]);

  // Swipe handling
  const startDrag = (clientX: number) => {
    setDragStartX(clientX);
    setDragDeltaX(0);
    setIsPaused(true);
  };

  const moveDrag = (clientX: number) => {
    if (dragStartX === null) return;
    setDragDeltaX(clientX - dragStartX);
  };

  const endDrag = () => {
    if (dragStartX === null) return;
    if (Math.abs(dragDeltaX) > 50 && featuredMovies.length > 1) {
      if (dragDeltaX < 0) goNext();
      else goPrev();
    }
    setDragStartX(null);
    setDragDeltaX(0);
    setIsPaused(false);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLElement>) =>
    startDrag(e.clientX);
  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (dragStartX === null) return;
    moveDrag(e.clientX);
  };
  const handleMouseUp = () => endDrag();
  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    if (e.touches.length > 0) startDrag(e.touches[0].clientX);
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLElement>) => {
    if (dragStartX === null || e.touches.length === 0) return;
    moveDrag(e.touches[0].clientX);
  };
  const handleTouchEnd = () => endDrag();

  if (!movie) return null;

  // Get IMDb/TMDB rating
  const rating = movie.imdb || movie.tmdb || movie.vote_average;
  const ratingDisplay = rating
    ? typeof rating === "number"
      ? rating.toFixed(1)
      : parseFloat(String(rating)) > 0
        ? parseFloat(String(rating)).toFixed(1)
        : null
    : null;

  return (
    <section
      className="hero-section-root relative w-full max-w-full overflow-hidden rounded-none lg:rounded-xl select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => {
        endDrag();
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ width: "100%", maxWidth: "100%" }}
    >
      {/* ===== Background Images ===== */}
      <div className="absolute inset-0">
        {featuredMovies.map((m, index) => {
          // Chỉ render slide hiện tại + slide đang fade out
          const shouldRender = index === currentIndex || index === prevIndex;
          if (!shouldRender) return null;

          const isActive = index === currentIndex;
          const isLeaving = index === prevIndex;

          return (
            <div
              key={`bg-${m.slug}-${m.id || index}`}
              className="absolute inset-0"
              style={{
                opacity: isActive ? 1 : 0,
                transition: isMobile
                  ? "opacity 0.4s ease"
                  : "opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
                zIndex: isActive ? 2 : isLeaving ? 1 : 0,
              }}
            >
              <Image
                src={getImageUrl(m.poster_url || m.thumb_url)}
                alt={m.name}
                fill
                className={`object-cover object-[center_20%] ${
                  isActive && !isMobile ? "hero-ken-burns" : ""
                }`}
                priority={index === 0}
                loading={index === 0 ? undefined : "lazy"}
                sizes="100vw"
                quality={isMobile ? 65 : 80}
              />
            </div>
          );
        })}

        {/* Gradient overlays */}
        <div
          className="absolute inset-0 z-[3]"
          style={{
            background: `linear-gradient(180deg, rgba(13,13,13,0.1) 0%, transparent 18%, transparent 42%, rgba(13,13,13,0.55) 68%, rgba(13,13,13,0.93) 89%, rgba(13,13,13,1) 100%)`,
          }}
        />
        <div
          className="absolute inset-0 z-[3] hidden sm:block"
          style={{
            background: `linear-gradient(90deg, rgba(13,13,13,0.55) 0%, rgba(13,13,13,0.15) 30%, transparent 55%)`,
          }}
        />
      </div>

      {/* ===== Movie Info Content ===== */}
      <div
        className="absolute z-10 bottom-0 left-0 right-0 sm:bottom-[6%] md:bottom-[8%] lg:bottom-[10%] sm:left-6 md:left-12 lg:left-14 sm:right-[38%] md:right-[42%] px-4 sm:px-0 pb-5 sm:pb-0"
        style={{
          opacity: contentVisible ? 1 : 0,
          transform: contentVisible ? "translateY(0)" : "translateY(10px)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}
      >
        {/* Original Title */}
        {movie.original_name && movie.original_name !== movie.name && (
          <p className="hidden sm:block text-sm text-gray-400 mb-1.5 line-clamp-1 font-medium tracking-wide">
            {movie.original_name}
          </p>
        )}

        {/* Main Title */}
        <h1 className="text-xl sm:text-3xl md:text-4xl lg:text-[2.75rem] xl:text-5xl font-extrabold text-white mb-2 sm:mb-3.5 drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)] line-clamp-2 leading-[1.15] tracking-tight">
          {movie.name}
        </h1>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5 mb-2 sm:mb-4">
          {/* IMDb Rating — nổi bật */}
          {ratingDisplay && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded bg-[#F6C453]/15 text-[10px] sm:text-[13px] font-bold text-[#F6C453]">
              <Star className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 fill-[#F6C453] text-[#F6C453]" />
              {ratingDisplay}
            </span>
          )}

          {/* Quality badge — solid like Rophim */}
          {movie.quality && (
            <span className="px-1.5 py-0.5 sm:px-2 sm:py-0.5 rounded text-[9px] sm:text-[11px] font-bold bg-[#F6C453] text-black tracking-wide uppercase">
              {movie.quality}
            </span>
          )}

          {/* Các meta khác */}
          {movie.current_episode && (
            <>
              <span className="text-gray-600 text-[8px] sm:text-[10px]">•</span>
              <span className="text-gray-300 text-[10px] sm:text-[13px] font-medium">
                {formatEpisodeLabel(movie.current_episode)}
              </span>
            </>
          )}

          {movie.year && (
            <>
              <span className="text-gray-600 text-[8px] sm:text-[10px]">•</span>
              <span className="text-gray-300 text-[10px] sm:text-[13px] font-medium">
                {movie.year}
              </span>
            </>
          )}

          {isValidTime(movie.time) && (
            <>
              <span className="text-gray-600 text-[8px] sm:text-[10px]">•</span>
              <span className="text-gray-400 text-[10px] sm:text-[13px]">
                {movie.time}
              </span>
            </>
          )}

          {movie.language && (
            <>
              <span className="text-gray-600 text-[8px] sm:text-[10px] hidden sm:inline">•</span>
              <span className="hidden sm:inline text-gray-400 text-[13px]">
                {movie.language}
              </span>
            </>
          )}
        </div>

        {/* Description — 2 dòng trên desktop */}
        {movie.description && (
          <p
            className="hidden sm:block text-[13px] md:text-sm text-gray-300/80 line-clamp-2 mb-4 sm:mb-5 max-w-lg leading-relaxed"
            style={{
              opacity: contentVisible ? 1 : 0,
              transition: "opacity 0.35s ease 0.2s",
            }}
            dangerouslySetInnerHTML={{
              __html:
                movie.description.replace(/<[^>]*>/g, "").slice(0, 160) + "...",
            }}
          />
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link href={`/phim/${movie.slug}`}>
            <Button
              size="lg"
              className="bg-[#F6C453] hover:bg-[#FFD76E] text-black font-bold text-[11px] sm:text-sm px-5 sm:px-7 h-9 sm:h-11 rounded-lg shadow-[0_4px_20px_rgba(246,196,83,0.3)] hover:shadow-[0_6px_28px_rgba(246,196,83,0.45)] sm:hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 mr-1.5 fill-black" />
              Xem ngay
            </Button>
          </Link>
          <Link href={`/phim/${movie.slug}`}>
            <Button
              size="lg"
              variant="secondary"
              className="bg-white/10 hover:bg-white/[0.18] border border-white/15 hover:border-white/30 text-white font-semibold text-[11px] sm:text-sm px-5 sm:px-7 h-9 sm:h-11 rounded-lg sm:hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer sm:backdrop-blur-md"
            >
              <Info className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5 mr-1.5" />
              Chi tiết
            </Button>
          </Link>
        </div>
      </div>

      {/* ===== Thumbnail Navigation — Rophim style ===== */}
      {featuredMovies.length > 1 && (
        <div
          className="absolute z-20 bottom-5 md:bottom-8 lg:bottom-6 right-4 sm:right-6 md:right-10 lg:right-14 hidden sm:flex items-end gap-2 md:gap-2.5"
        >
          {featuredMovies.map((m, i) => {
            const isActive = i === currentIndex;
            return (
              <button
                key={`thumb-${m.slug}-${i}`}
                onClick={(e) => {
                  e.stopPropagation();
                  goToSlide(i);
                }}
                className={`
                  relative overflow-hidden rounded-md sm:rounded-lg transition-all duration-300 cursor-pointer group/thumb flex-shrink-0
                  ${isActive
                    ? "w-[40px] h-[56px] sm:w-[56px] sm:h-[78px] md:w-[72px] md:h-[100px] lg:w-[64px] lg:h-[90px] ring-2 ring-[#F6C453] shadow-[0_0_10px_rgba(246,196,83,0.2)]"
                    : "w-[32px] h-[44px] sm:w-[44px] sm:h-[62px] md:w-[58px] md:h-[80px] lg:w-[52px] lg:h-[72px] ring-1 ring-white/10 opacity-50 hover:opacity-85 hover:ring-white/30"
                  }
                `}
                aria-label={m.name}
              >
                <Image
                  src={getImageUrl(m.thumb_url || m.poster_url)}
                  alt={m.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                  loading="lazy"
                />

                {isActive && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] sm:h-[2.5px] bg-black/40 z-10">
                    <div
                      className="h-full bg-[#F6C453]"
                      style={{
                        width: `${progress}%`,
                        transition: "width 0.15s linear",
                      }}
                    />
                  </div>
                )}

                {!isActive && (
                  <div className="absolute inset-0 bg-black/20 group-hover/thumb:bg-black/5 transition-colors duration-200" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* ===== Slide Counter (mobile, top-right) ===== */}
      {featuredMovies.length > 1 && (
        <div className="absolute z-20 top-3 right-3 sm:hidden">
          <span className="px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm text-[10px] text-white/60 font-medium tabular-nums">
            {currentIndex + 1}/{featuredMovies.length}
          </span>
        </div>
      )}
    </section>
  );
}
