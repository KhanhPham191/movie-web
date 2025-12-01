"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Plus, ThumbsUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FilmItem } from "@/lib/api";
import { getImageUrl } from "@/lib/api";

interface MovieCardProps {
  movie: FilmItem;
  index?: number;
}

export function MovieCard({ movie, index = 0 }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const imageUrl = getImageUrl(movie.thumb_url || movie.poster_url);

  return (
    <div
      className="group relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <Link href={`/phim/${movie.slug}`}>
        {/* Main Card */}
        <div
          className={`relative rounded-md overflow-hidden transition-all duration-300 ease-out ${
            isHovered
              ? "scale-110 z-30 shadow-2xl shadow-black/80"
              : "scale-100 z-10"
          }`}
        >
          {/* Image */}
          <div className="relative aspect-[2/3] bg-muted">
            <Image
              src={imageUrl}
              alt={movie.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              unoptimized
            />

            {/* Top Badges */}
            <div className="absolute top-2 left-2 right-2 flex justify-between items-start">
              {movie.quality && (
                <Badge className="bg-blue-600 text-white border-0 text-[10px] font-bold px-1.5 py-0.5">
                  {movie.quality}
                </Badge>
              )}
              {movie.current_episode && (
                <Badge className="bg-green-600 text-white border-0 text-[10px] font-bold px-1.5 py-0.5">
                  {movie.current_episode}
                </Badge>
              )}
            </div>

            {/* Netflix-style Progress Bar (if watching) */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600">
              <div className="h-full bg-blue-600 w-0 group-hover:w-0" />
            </div>
          </div>

          {/* Hover Content - Netflix Style */}
          <div
            className={`absolute inset-x-0 bottom-0 bg-card rounded-b-md transition-all duration-300 ${
              isHovered
                ? "translate-y-0 opacity-100"
                : "translate-y-full opacity-0"
            }`}
          >
            {/* Action Buttons */}
            <div className="p-3 space-y-3">
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  className="w-9 h-9 rounded-full bg-white hover:bg-white/90 text-black"
                >
                  <Play className="w-5 h-5 fill-black" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="w-9 h-9 rounded-full border-white/40 hover:border-white bg-transparent hover:bg-white/10"
                >
                  <Plus className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="w-9 h-9 rounded-full border-white/40 hover:border-white bg-transparent hover:bg-white/10"
                >
                  <ThumbsUp className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="w-9 h-9 rounded-full border-white/40 hover:border-white bg-transparent hover:bg-white/10 ml-auto"
                >
                  <ChevronDown className="w-5 h-5" />
                </Button>
              </div>

              {/* Info */}
              <div className="space-y-1.5">
                <h3 className="font-bold text-sm line-clamp-1">{movie.name}</h3>
                
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  {movie.time && <span>{movie.time}</span>}
                  {movie.language && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-white/30">
                      {movie.language}
                    </Badge>
                  )}
                </div>

                {/* Genres */}
                <div className="flex flex-wrap gap-1">
                  {movie.category?.slice(0, 3).map((cat, i) => (
                    <span key={cat.id} className="text-[11px] text-muted-foreground">
                      {cat.name}
                      {i < Math.min((movie.category?.length || 0), 3) - 1 && (
                        <span className="mx-1">•</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </Link>

      {/* Title below card (when not hovered) */}
      <div
        className={`mt-2 transition-opacity duration-200 ${
          isHovered ? "opacity-0" : "opacity-100"
        }`}
      >
        <h3 className="text-sm font-medium line-clamp-1 group-hover:text-primary transition-colors">
          {movie.name}
        </h3>
        {movie.original_name && movie.original_name !== movie.name && (
          <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
            {movie.original_name}
          </p>
        )}
      </div>
    </div>
  );
}
