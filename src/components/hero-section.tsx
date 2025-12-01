"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Info, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FilmItem } from "@/lib/api";
import { getImageUrl } from "@/lib/api";

interface HeroSectionProps {
  movies: FilmItem[];
}

export function HeroSection({ movies }: HeroSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  const featuredMovies = movies.slice(0, 5);
  const movie = featuredMovies[currentIndex];

  // Auto-slide every 8 seconds
  useEffect(() => {
    if (featuredMovies.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % featuredMovies.length);
    }, 8000);

    return () => clearInterval(interval);
  }, [featuredMovies.length]);

  if (!movie) return null;

  const backdropUrl = getImageUrl(movie.poster_url || movie.thumb_url);

  return (
    <section className="relative h-[85vh] lg:h-[95vh] flex items-end overflow-hidden">
      {/* Background Image with Ken Burns effect */}
      <div className="absolute inset-0">
        {featuredMovies.map((m, index) => (
          <div
            key={m.slug}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentIndex ? "opacity-100" : "opacity-0"
            }`}
          >
            <Image
              src={getImageUrl(m.poster_url || m.thumb_url)}
              alt={m.name}
              fill
              className="object-cover object-top animate-ken-burns"
              priority={index === 0}
              sizes="100vw"
              unoptimized
            />
          </div>
        ))}
        
        {/* Netflix-style Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </div>

      {/* Content */}
      <div className="container relative mx-auto px-4 pb-32 lg:pb-40">
        <div className="max-w-2xl">
          {/* Netflix-style N logo or Category */}
          <div className="flex items-center gap-3 mb-4 animate-fade-in">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">P7</span>
            </div>
            <span className="text-sm font-medium tracking-wider uppercase text-foreground/80">
              Phim hot
            </span>
          </div>

          {/* Title */}
          <h1 
            className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black tracking-tight mb-4 animate-fade-in"
            style={{ animationDelay: "100ms" }}
          >
            {movie.name}
          </h1>

          {/* Metadata Row */}
          <div 
            className="flex flex-wrap items-center gap-3 mb-4 animate-fade-in"
            style={{ animationDelay: "200ms" }}
          >
            {movie.quality && (
              <Badge className="bg-blue-600 text-white border-0 font-semibold">
                {movie.quality}
              </Badge>
            )}
            {movie.current_episode && (
              <Badge variant="outline" className="border-white/30 text-foreground">
                {movie.current_episode}
              </Badge>
            )}
            {movie.time && (
              <span className="text-sm text-foreground/70">{movie.time}</span>
            )}
            {movie.country?.[0] && (
              <span className="text-sm text-foreground/70">{movie.country[0].name}</span>
            )}
          </div>

          {/* Genres */}
          {movie.category && movie.category.length > 0 && (
            <div 
              className="flex flex-wrap gap-2 mb-5 animate-fade-in"
              style={{ animationDelay: "300ms" }}
            >
              {movie.category.slice(0, 4).map((cat, i) => (
                <span key={cat.id} className="text-sm text-foreground/70">
                  {cat.name}
                  {i < Math.min(movie.category.length, 4) - 1 && (
                    <span className="mx-2">•</span>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {movie.description && (
            <p 
              className="text-base lg:text-lg text-foreground/80 leading-relaxed mb-6 line-clamp-3 max-w-xl animate-fade-in"
              style={{ animationDelay: "400ms" }}
              dangerouslySetInnerHTML={{
                __html: movie.description.replace(/<[^>]*>/g, "").slice(0, 200) + "...",
              }}
            />
          )}

          {/* Action Buttons - Netflix Style */}
          <div 
            className="flex flex-wrap items-center gap-3 animate-fade-in"
            style={{ animationDelay: "500ms" }}
          >
            <Link href={`/phim/${movie.slug}`}>
              <Button
                size="lg"
                className="bg-white hover:bg-white/90 text-black font-bold text-base px-8 h-12 rounded-md shadow-xl"
              >
                <Play className="w-6 h-6 mr-2 fill-black" />
                Phát
              </Button>
            </Link>
            <Link href={`/phim/${movie.slug}`}>
              <Button
                size="lg"
                variant="secondary"
                className="bg-white/20 hover:bg-white/30 text-white font-bold text-base px-8 h-12 rounded-md backdrop-blur-sm"
              >
                <Info className="w-6 h-6 mr-2" />
                Thông tin
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Right Controls */}
      <div className="absolute bottom-32 lg:bottom-40 right-4 lg:right-8 flex items-center gap-3 animate-fade-in">
        {/* Mute Button */}
        <Button
          variant="ghost"
          size="icon"
          className="w-10 h-10 rounded-full border border-white/40 bg-black/20 hover:bg-black/40 text-white"
          onClick={() => setIsMuted(!isMuted)}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </Button>

        {/* Age Rating */}
        <div className="px-3 py-1 bg-black/40 border-l-2 border-white/60 text-sm font-medium">
          18+
        </div>
      </div>

      {/* Slide Indicators */}
      {featuredMovies.length > 1 && (
        <div className="absolute bottom-20 lg:bottom-28 right-4 lg:right-8 flex items-center gap-2">
          {featuredMovies.map((_, index) => (
            <button
              key={index}
              className={`h-1 rounded-full transition-all duration-300 ${
                index === currentIndex
                  ? "w-8 bg-white"
                  : "w-4 bg-white/40 hover:bg-white/60"
              }`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
