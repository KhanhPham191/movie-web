"use client";

import { useState, useEffect } from "react";
import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Info, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FilmItem } from "@/lib/api";
import { getImageUrl } from "@/lib/api";
import { isValidTime } from "@/lib/utils";

interface HeroSectionProps {
  movies: FilmItem[];
}

// Chuẩn hoá text số tập: "Hoàn tất (20/20)" -> "20/20"
function formatEpisodeLabel(episode?: string) {
  if (!episode) return "";
  const match = episode.match(/Hoàn tất\s*\(([^)]+)\)/i);
  if (match) return match[1];
  return episode;
}

export function HeroSection({ movies }: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [dragDeltaX, setDragDeltaX] = useState(0);

  // Movies đã được filter chieurap từ API, chỉ cần slice
  const featuredMovies = movies.slice(0, 5);
  const movie = featuredMovies[currentIndex];

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Auto-rotate every 10 seconds
  useEffect(() => {
    if (featuredMovies.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [featuredMovies.length]);

  if (!movie) return null;

  const startDrag = (clientX: number) => {
    setDragStartX(clientX);
    setDragDeltaX(0);
  };

  const moveDrag = (clientX: number) => {
    if (dragStartX === null) return;
    setDragDeltaX(clientX - dragStartX);
  };

  const endDrag = () => {
    if (dragStartX === null) return;
    if (Math.abs(dragDeltaX) > 60 && featuredMovies.length > 1) {
      setCurrentIndex((prev) => {
        if (dragDeltaX < 0) {
          return (prev + 1) % featuredMovies.length;
        }
        return (prev - 1 + featuredMovies.length) % featuredMovies.length;
      });
    }
    setDragStartX(null);
    setDragDeltaX(0);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    startDrag(e.clientX);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (dragStartX === null) return;
    moveDrag(e.clientX);
  };

  const handleMouseUp = () => {
    endDrag();
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    if (e.touches.length > 0) {
      startDrag(e.touches[0].clientX);
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLElement>) => {
    if (dragStartX === null || e.touches.length === 0) return;
    moveDrag(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    endDrag();
  };

  return (
    <section
      className="hero-section-root relative aspect-[16/9] w-full max-w-full overflow-hidden rounded-none lg:rounded-lg 2xl:aspect-[16/7] h-[260px] xs:h-[300px] sm:h-[56.25vw] max-h-[70vh] sm:max-h-[80vh] min-h-[240px] xs:min-h-[260px] sm:min-h-[400px] lg:h-[70vh] lg:min-h-[460px] xl:h-[75vh] select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ width: '100%', maxWidth: '100%' }}
    >
      {/* Global animation keyframes cho hero content */}
      <style jsx global>{`
        @keyframes heroFadeInUp {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes heroFadeInUpSoft {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
      {/* Background Images */}
      <div className="absolute inset-0">
        {featuredMovies.map((m, index) => (
          <div
            key={`${m.slug}-${m.id || index}`}
            className={`absolute inset-0 transition-opacity duration-300 sm:duration-700 ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={getImageUrl(m.thumb_url)}
              alt={m.name}
              fill
              className="object-cover object-center"
              priority={index === 0}
              loading={index === 0 ? undefined : "lazy"}
              sizes="100vw"
              quality={index === 0 ? 85 : 70}
              unoptimized
              style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
            />
          </div>
        ))}
        
        {/* Premium Vignette & Gradients */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(13,13,13,0.1)_0%,rgba(13,13,13,0)_25%,rgba(13,13,13,0)_50%,rgba(13,13,13,0.7)_80%,rgba(13,13,13,0.98)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(13,13,13,0.5)_0%,rgba(13,13,13,0.15)_30%,rgba(13,13,13,0)_50%)]" />
      </div>

      {/* Content */}
      <div
        key={movie.slug}
        className={`absolute z-10 bottom-0 sm:bottom-[15%] md:bottom-[20%] left-0 right-0 sm:left-4 md:left-12 sm:right-4 md:right-[50%] px-3 sm:px-0 pb-4 sm:pb-0 ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        style={{
          animation: isLoaded ? undefined : undefined,
        }}
      >
        {/* Premium Badge */}
        <div
          className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4"
        >
          <div className="inline-flex px-1 py-0.5 xs:px-1.5 xs:py-0.5 sm:px-3 sm:py-1 md:px-4 md:py-1.5 rounded-full bg-gradient-to-r from-[#F6C453]/90 to-[#D3A13A]/90 backdrop-blur-sm border-[0.5px] xs:border border-[#F6C453]/40 shadow-sm xs:shadow-md sm:shadow-lg">
            <span className="text-[7px] xs:text-[8px] sm:text-xs font-bold text-white tracking-tight xs:tracking-wide sm:tracking-widest uppercase whitespace-nowrap">
              Phim hot
            </span>
          </div>
        </div>

        {/* Premium Title */}
        <h1
          className="text-base sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-black text-white mb-2 sm:mb-4 drop-shadow-2xl line-clamp-2 leading-tight tracking-tight"
        >
          <span className="bg-gradient-to-r from-white via-white to-white/90 bg-clip-text text-transparent">
            {movie.name}
          </span>
        </h1>

        {/* Original Title */}
        {movie.original_name && movie.original_name !== movie.name && (
          <p
            className="text-[10px] sm:text-base md:text-lg text-gray-300 mb-1 sm:mb-3 line-clamp-1 hidden sm:block"
          >
            {movie.original_name}
          </p>
        )}

        {/* Meta Info */}
        <div
          className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1.5 sm:mb-4 text-[10px] sm:text-sm"
        >
          {movie.current_episode && (
            <span className="text-gray-300 text-[10px] sm:text-sm">
              {formatEpisodeLabel(movie.current_episode)}
            </span>
          )}
          {isValidTime(movie.time) && (
            <span className="text-gray-400 text-[10px] sm:text-sm">{movie.time}</span>
          )}
          <span className="px-1 sm:px-1.5 py-0.5 border border-gray-400 text-[9px] sm:text-xs">18+</span>
        </div>

        {/* Description - Ẩn trên mobile để tiết kiệm không gian */}
        {movie.description && (
          <p 
            className="hidden sm:block text-xs sm:text-sm md:text-base text-gray-200 line-clamp-2 sm:line-clamp-3 mb-2 sm:mb-5 max-w-xl"
            dangerouslySetInnerHTML={{
              __html: movie.description.replace(/<[^>]*>/g, "").slice(0, 120) + "...",
            }}
          />
        )}

        {/* Genres - Ẩn trên mobile */}
        {movie.category && movie.category.length > 0 && (
          <div
            className="hidden sm:flex flex-wrap items-center gap-1 text-xs sm:text-sm text-gray-300 mb-2 sm:mb-5"
          >
            {movie.category.slice(0, 3).map((cat, i) => (
              <span key={cat.id}>
                {cat.name}
                {i < Math.min(movie.category.length, 3) - 1 && (
                  <span className="mx-1.5 sm:mx-2 text-gray-600">•</span>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Premium Action Buttons */}
        <div
          className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-0"
        >
          <Link href={`/phim/${movie.slug}`}>
            <Button
              size="lg"
              className="relative group/btn bg-gradient-to-r from-[#F6C453] to-[#D3A13A] hover:from-[#F6C453]/90 hover:to-[#D3A13A]/90 text-white font-bold text-[10px] sm:text-sm md:text-base px-4 sm:px-6 md:px-8 h-9 sm:h-11 md:h-12 rounded-full shadow-[0_8px_30px_rgba(246,196,83,0.4)] hover:shadow-[0_12px_40px_rgba(246,196,83,0.5)] transition-all duration-150 sm:duration-300 flex-1 sm:flex-initial border border-[#F6C453]/30 cursor-pointer"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full opacity-0 group-hover/btn:opacity-100 transition-opacity" />
              <Play className="relative z-10 w-3 h-3 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1.5 sm:mr-2 fill-white" />
              <span className="relative z-10">Phát ngay</span>
            </Button>
          </Link>
          <Link href={`/phim/${movie.slug}`}>
            <Button
              size="lg"
              variant="secondary"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold text-[10px] sm:text-sm md:text-base px-4 sm:px-6 md:px-8 h-9 sm:h-11 md:h-12 rounded-full transition-all duration-150 sm:duration-300"
            >
              <Info className="w-3 h-3 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Thông tin</span>
              <span className="sm:hidden">Info</span>
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
