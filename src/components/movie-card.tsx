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
  // Use thumb_url for all movie cards on homepage
  const imageUrl = getImageUrl(movie.thumb_url || movie.poster_url);

  // Top 10 variant - Netflix style with badge
  if (variant === "top10" && rank) {
    return (
      <Link href={`/phim/${movie.slug}`}>
        <div className="group relative">
          {/* Poster */}
          <div className="relative aspect-[2/3] rounded-md overflow-hidden transition-transform duration-300 group-hover:scale-105 bg-muted">
            <Image
              src={imageUrl}
              alt={movie.name}
              fill
              className="object-cover"
              unoptimized
            />
            
            {/* Rank Badge - Top Left Corner */}
            <div className="absolute top-0 left-0 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center rounded-br-md shadow-lg">
              <span className="text-white font-black text-xl md:text-2xl">{rank}</span>
            </div>
            
            {/* Top 10 Badge - Bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2">
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">T</span>
                </div>
                <span className="text-white text-xs font-semibold">Top 10</span>
              </div>
            </div>
          </div>
          
          {/* Title below */}
          <h3 className="mt-2 text-sm font-medium line-clamp-1 group-hover:text-white transition-colors">
            {movie.name}
          </h3>
        </div>
      </Link>
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

  // Default variant - Portrait poster (2:3 ratio)
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
            className="object-cover object-center"
            sizes="(max-width: 640px) 100px, (max-width: 768px) 120px, (max-width: 1024px) 140px, 160px"
            quality={90}
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
