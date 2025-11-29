"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Clock, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { FilmItem } from "@/lib/api";
import { getImageUrl } from "@/lib/api";

interface MovieCardProps {
  movie: FilmItem;
  index?: number;
}

export function MovieCard({ movie, index = 0 }: MovieCardProps) {
  const imageUrl = getImageUrl(movie.thumb_url || movie.poster_url);

  return (
    <Link href={`/phim/${movie.slug}`}>
      <Card
        className="movie-card group relative overflow-hidden bg-card border-border/50 cursor-pointer animate-fade-in"
        style={{ animationDelay: `${index * 50}ms` }}
      >
        {/* Poster */}
        <div className="relative aspect-[2/3] overflow-hidden bg-muted">
          <Image
            src={imageUrl}
            alt={movie.name}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            unoptimized
          />

          {/* Quality Badge */}
          {movie.quality && (
            <Badge className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 text-xs font-semibold">
              {movie.quality}
            </Badge>
          )}

          {/* Episodes Badge */}
          {movie.current_episode && (
            <Badge className="absolute top-2 right-2 bg-blue-500/90 text-white border-0 text-xs">
              {movie.current_episode}
            </Badge>
          )}

          {/* Language Badge */}
          {movie.language && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm rounded-full px-2 py-1">
              <span className="text-white text-xs font-medium">{movie.language}</span>
            </div>
          )}

          {/* Overlay on Hover */}
          <div className="movie-overlay absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex flex-col items-center justify-center gap-3 p-4">
            <Button
              size="lg"
              className="rounded-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/30 animate-pulse-glow"
            >
              <Play className="w-5 h-5 mr-1 fill-white" />
              Xem ngay
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-white border-white/30 hover:bg-white/20 hover:text-white"
            >
              <Info className="w-4 h-4 mr-1" />
              Chi tiết
            </Button>
          </div>
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">
            {movie.name}
          </h3>
          {movie.original_name && movie.original_name !== movie.name && (
            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {movie.original_name}
            </p>
          )}
          <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
            {movie.time && (
              <>
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{movie.time}</span>
                </div>
                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
              </>
            )}
            {movie.country?.[0] && <span>{movie.country[0].name}</span>}
          </div>
          <div className="flex flex-wrap gap-1 mt-2">
            {movie.category?.slice(0, 2).map((cat) => (
              <Badge
                key={cat.id}
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              >
                {cat.name}
              </Badge>
            ))}
          </div>
        </div>
      </Card>
    </Link>
  );
}
