"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Plus, ThumbsUp, ChevronDown, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FilmItem } from "@/lib/api";
import { getImageUrl } from "@/lib/api";

interface MovieCardProps {
  movie: FilmItem;
  index?: number;
  variant?: "default" | "portrait" | "top10";
  rank?: number;
}

export function MovieCard({ movie, index = 0, variant = "default", rank }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const imageUrl = getImageUrl(movie.poster_url || movie.thumb_url);

  // Top 10 variant
  if (variant === "top10" && rank) {
    return (
      <div className="flex items-center gap-0 group">
        {/* Large Rank Number */}
        <span 
          className="text-[120px] md:text-[150px] font-black leading-none text-transparent select-none shrink-0"
          style={{
            WebkitTextStroke: "4px rgba(128,128,128,0.5)",
          }}
        >
          {rank}
        </span>
        
        {/* Poster */}
        <Link href={`/phim/${movie.slug}`} className="-ml-8 md:-ml-10">
          <div className="relative w-[100px] md:w-[120px] aspect-[2/3] rounded-md overflow-hidden transition-transform duration-300 group-hover:scale-105">
            <Image
              src={imageUrl}
              alt={movie.name}
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        </Link>
      </div>
    );
  }

  // Portrait variant (vertical poster)
  if (variant === "portrait") {
    return (
      <Link href={`/phim/${movie.slug}`}>
        <div 
          className="group relative"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="relative aspect-[2/3] rounded-md overflow-hidden bg-muted transition-all duration-300 group-hover:scale-105 group-hover:z-10">
            <Image
              src={imageUrl}
              alt={movie.name}
              fill
              className="object-cover"
              unoptimized
            />
            {movie.quality && (
              <Badge className="absolute top-2 left-2 bg-blue-600 text-white border-0 text-[10px] font-bold">
                {movie.quality}
              </Badge>
            )}
            {movie.current_episode && (
              <Badge className="absolute top-2 right-2 bg-red-600 text-white border-0 text-[10px]">
                {movie.current_episode}
              </Badge>
            )}
          </div>
          <h3 className="mt-2 text-sm font-medium line-clamp-1 group-hover:text-white transition-colors">
            {movie.name}
          </h3>
        </div>
      </Link>
    );
  }

  // Default variant - Netflix 2024 horizontal thumbnail
  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/phim/${movie.slug}`}>
        <div
          className={`relative rounded-md overflow-hidden bg-muted transition-all duration-300 ease-out ${
            isHovered
              ? "scale-[1.4] z-50 shadow-2xl shadow-black/80 rounded-t-md rounded-b-none"
              : "scale-100 z-10"
          }`}
          style={{
            transformOrigin: index === 0 ? "left center" : "center center",
          }}
        >
          {/* Thumbnail - 16:9 ratio */}
          <div className="relative aspect-video">
            <Image
              src={imageUrl}
              alt={movie.name}
              fill
              className="object-cover"
              unoptimized
            />

            {/* Badges on thumbnail */}
            {!isHovered && (
              <div className="absolute top-2 left-2 flex gap-1">
                {movie.quality && (
                  <Badge className="bg-black/60 text-white border-0 text-[10px] font-medium backdrop-blur-sm">
                    {movie.quality}
                  </Badge>
                )}
              </div>
            )}

            {/* Episode badge */}
            {!isHovered && movie.current_episode && (
              <div className="absolute bottom-2 left-2">
                <Badge className="bg-red-600 text-white border-0 text-[10px] font-bold">
                  {movie.current_episode}
                </Badge>
              </div>
            )}

            {/* Progress bar (simulated) */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600/50">
              <div className="h-full bg-red-600 w-0" />
            </div>
          </div>

          {/* Hover Content Panel */}
          {isHovered && (
            <div className="absolute left-0 right-0 top-full bg-[#181818] rounded-b-md p-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Action Buttons Row */}
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  className="w-9 h-9 rounded-full bg-white hover:bg-white/90 text-black"
                  onClick={(e) => e.preventDefault()}
                >
                  <Play className="w-5 h-5 fill-black" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="w-9 h-9 rounded-full border-gray-400 hover:border-white bg-transparent"
                  onClick={(e) => e.preventDefault()}
                >
                  <Plus className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="w-9 h-9 rounded-full border-gray-400 hover:border-white bg-transparent"
                  onClick={(e) => e.preventDefault()}
                >
                  <ThumbsUp className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="w-9 h-9 rounded-full border-gray-400 hover:border-white bg-transparent ml-auto"
                  onClick={(e) => e.preventDefault()}
                >
                  <ChevronDown className="w-5 h-5" />
                </Button>
              </div>

              {/* Meta Info Row */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-green-500 font-semibold">97% Phù hợp</span>
                {movie.quality && (
                  <span className="px-1 border border-gray-500 text-[10px]">{movie.quality}</span>
                )}
                {movie.time && <span className="text-gray-400">{movie.time}</span>}
              </div>

              {/* Genres */}
              <div className="flex flex-wrap items-center gap-1 text-xs text-gray-300">
                {movie.category?.slice(0, 3).map((cat, i) => (
                  <span key={cat.id}>
                    {cat.name}
                    {i < Math.min((movie.category?.length || 0), 3) - 1 && (
                      <span className="mx-1 text-gray-600">•</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Title below (when not hovered) */}
      {!isHovered && (
        <h3 className="mt-2 text-sm font-medium line-clamp-1 text-gray-300 group-hover:text-white transition-colors">
          {movie.name}
        </h3>
      )}
    </div>
  );
}
