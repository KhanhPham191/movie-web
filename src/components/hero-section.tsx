"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Info, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { FilmItem } from "@/lib/api";
import { getImageUrl } from "@/lib/api";

interface HeroSectionProps {
  movies: FilmItem[];
}

export function HeroSection({ movies }: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

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

  const backdropUrl = getImageUrl(movie.poster_url || movie.thumb_url);

  return (
    <section className="relative h-[50vh] sm:h-[56.25vw] max-h-[80vh] min-h-[300px] sm:min-h-[400px]">
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
              className="object-cover object-top"
              priority={index === 0}
              sizes="100vw"
              unoptimized
            />
          </div>
        ))}
        
        {/* Vignette & Gradients - Lighter for better visibility */}
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,20,20,0.2)_0%,rgba(20,20,20,0)_25%,rgba(20,20,20,0)_65%,rgba(20,20,20,0.5)_85%,rgba(20,20,20,0.9)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,20,20,0.5)_0%,rgba(20,20,20,0.2)_30%,rgba(20,20,20,0)_50%)]" />
      </div>

      {/* Content */}
      <div 
        className={`absolute bottom-[15%] sm:bottom-[20%] left-3 sm:left-4 md:left-12 right-3 sm:right-4 md:right-[50%] transition-all duration-700 ${
          isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Netflix N Logo + Series indicator */}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3">
          <div className="flex items-center gap-0.5 sm:gap-1">
            <span className="text-blue-500 font-black text-lg sm:text-xl tracking-tighter">P</span>
            <span className="text-[10px] sm:text-xs font-semibold text-gray-300 tracking-widest uppercase">
              Phim hot
            </span>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl font-black text-white mb-2 sm:mb-3 drop-shadow-lg line-clamp-2">
          {movie.name}
        </h1>

        {/* Original Title */}
        {movie.original_name && movie.original_name !== movie.name && (
          <p className="text-sm sm:text-base md:text-lg text-gray-300 mb-2 sm:mb-3 line-clamp-1">
            {movie.original_name}
          </p>
        )}

        {/* Meta Info */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 text-xs sm:text-sm">
          <span className="text-green-500 font-semibold">98% Phù hợp</span>
          {movie.quality && (
            <span className="px-1 sm:px-1.5 py-0.5 border border-gray-400 text-[10px] sm:text-xs font-medium">{movie.quality}</span>
          )}
          {movie.current_episode && (
            <span className="text-gray-300 text-xs sm:text-sm">{movie.current_episode}</span>
          )}
          {movie.time && (
            <span className="text-gray-400 text-xs sm:text-sm">{movie.time}</span>
          )}
          <span className="px-1 sm:px-1.5 py-0.5 border border-gray-400 text-[10px] sm:text-xs">18+</span>
        </div>

        {/* Description - Netflix 2024 shows shorter description */}
        {movie.description && (
          <p 
            className="text-xs sm:text-sm md:text-base text-gray-200 line-clamp-2 sm:line-clamp-3 mb-3 sm:mb-5 max-w-xl"
            dangerouslySetInnerHTML={{
              __html: movie.description.replace(/<[^>]*>/g, "").slice(0, 120) + "...",
            }}
          />
        )}

        {/* Genres */}
        {movie.category && movie.category.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 text-xs sm:text-sm text-gray-300 mb-3 sm:mb-5">
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

        {/* Action Buttons - Netflix 2024 Style */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Link href={`/phim/${movie.slug}`}>
            <Button
              size="lg"
              className="bg-white hover:bg-white/90 text-black font-bold text-xs sm:text-sm md:text-base px-3 sm:px-5 md:px-8 h-8 sm:h-10 md:h-12 rounded-md"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1 sm:mr-2 fill-black" />
              Phát
            </Button>
          </Link>
          <Link href={`/phim/${movie.slug}`}>
            <Button
              size="lg"
              variant="secondary"
              className="bg-gray-500/70 hover:bg-gray-500/90 text-white font-bold text-xs sm:text-sm md:text-base px-3 sm:px-5 md:px-8 h-8 sm:h-10 md:h-12 rounded-md"
            >
              <Info className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Thông tin</span>
              <span className="sm:hidden">Info</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Right Side - Mute Button & Age Rating - Hide on mobile */}
      <div className="absolute bottom-[15%] sm:bottom-[20%] right-3 sm:right-4 md:right-12 flex items-center gap-2 sm:gap-3">
        {/* Mute Toggle */}
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-gray-400 flex items-center justify-center hover:border-white transition-colors bg-black/20"
        >
          {isMuted ? (
            <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          ) : (
            <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          )}
        </button>

        {/* Age Rating - Netflix style */}
        <div className="hidden sm:block px-2 sm:px-3 py-1 bg-gray-800/80 border-l-2 border-white/50 text-xs sm:text-sm font-medium text-white">
          18+
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
