"use client";

import { useState, useEffect } from "react";
import type React from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Info, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FilmItem } from "@/lib/api";
import { getImageUrl } from "@/lib/api";

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

  // Prefer poster_url for better quality
  const backdropUrl = getImageUrl(movie.poster_url || movie.thumb_url);

  return (
    <section
      className="relative h-[50vh] sm:h-[56.25vw] max-h-[70vh] sm:max-h-[80vh] min-h-[280px] sm:min-h-[400px] select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Images */}
      <div className="absolute inset-0">
        {featuredMovies.map((m, index) => (
          <div
            key={m.slug}
            className={`absolute inset-0 transition-opacity duration-700 ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={getImageUrl(m.poster_url || m.thumb_url)}
              alt={m.name}
              fill
              className="object-cover object-center sm:object-top"
              priority={index === 0}
              sizes="100vw"
              quality={90}
              unoptimized
            />
          </div>
        ))}
        
        {/* Vignette & Gradients - Tối ưu cho mobile */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(15,15,15,0.1)_0%,rgba(15,15,15,0)_20%,rgba(15,15,15,0)_50%,rgba(15,15,15,0.6)_75%,rgba(15,15,15,0.95)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,15,15,0.4)_0%,rgba(15,15,15,0.1)_25%,rgba(15,15,15,0)_45%)]" />
      </div>

      {/* Content */}
      <div 
        className={`absolute bottom-0 sm:bottom-[15%] md:bottom-[20%] left-0 right-0 sm:left-4 md:left-12 sm:right-4 md:right-[50%] px-3 sm:px-0 pb-4 sm:pb-0 transition-all duration-700 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Badge + Series indicator */}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-3">
          <div className="flex items-center gap-0.5 sm:gap-1">
            <span className="text-[#FF6EA0] font-black text-sm sm:text-xl tracking-tighter drop-shadow-lg">
              P
            </span>
            <span className="text-[9px] sm:text-xs font-semibold text-gray-200 tracking-widest uppercase">
              Phim hot
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-base sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-black text-white mb-1 sm:mb-3 drop-shadow-lg line-clamp-2">
          {movie.name}
        </h1>

        {/* Original Title */}
        {movie.original_name && movie.original_name !== movie.name && (
          <p className="text-[10px] sm:text-base md:text-lg text-gray-300 mb-1 sm:mb-3 line-clamp-1 hidden sm:block">
            {movie.original_name}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-1 sm:gap-2 mb-1.5 sm:mb-4 text-[10px] sm:text-sm">
          <span className="text-green-500 font-semibold">98% Phù hợp</span>
          {movie.current_episode && (
            <span className="text-gray-300 text-[10px] sm:text-sm">
              {formatEpisodeLabel(movie.current_episode)}
            </span>
          )}
          {movie.time && (
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
          <div className="hidden sm:flex flex-wrap items-center gap-1 text-xs sm:text-sm text-gray-300 mb-2 sm:mb-5">
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

        {/* Action Buttons - Tối ưu cho mobile */}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-0">
          <Link href={`/phim/${movie.slug}`}>
            <Button
              size="lg"
              className="bg-white hover:bg-white/90 text-black font-bold text-[10px] sm:text-sm md:text-base px-3 sm:px-5 md:px-8 h-8 sm:h-10 md:h-12 rounded-md flex-1 sm:flex-initial"
            >
              <Play className="w-3 h-3 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1 sm:mr-2 fill-black" />
              Phát
            </Button>
          </Link>
          <Link href={`/phim/${movie.slug}`}>
            <Button
              size="lg"
              variant="secondary"
              className="bg-gray-500/70 hover:bg-gray-500/90 text-white font-bold text-[10px] sm:text-sm md:text-base px-3 sm:px-5 md:px-8 h-8 sm:h-10 md:h-12 rounded-md"
            >
              <Info className="w-3 h-3 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Thông tin</span>
              <span className="sm:hidden">Info</span>
            </Button>
          </Link>
        </div>
      </div>


      {/* Thumbnail Navigation Dots */}
      {featuredMovies.length > 1 && (
        <div className="absolute bottom-4 sm:bottom-8 right-3 sm:right-4 md:right-12 flex items-center gap-1">
          {featuredMovies.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`transition-all duration-300 ${
                index === currentIndex
                  ? "w-5 sm:w-6 h-0.5 sm:h-1 bg-white rounded-full"
                  : "w-2.5 sm:w-3 h-0.5 sm:h-1 bg-white/40 rounded-full hover:bg-white/60"
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
