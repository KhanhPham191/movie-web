"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, Info, Clock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FilmItem } from "@/lib/api";
import { getImageUrl } from "@/lib/api";

interface HeroSectionProps {
  movie: FilmItem;
}

export function HeroSection({ movie }: HeroSectionProps) {
  const backdropUrl = getImageUrl(movie.poster_url || movie.thumb_url);

  return (
    <section className="relative min-h-[85vh] md:min-h-[90vh] flex items-end overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src={backdropUrl}
          alt={movie.name}
          fill
          className="object-cover object-top"
          priority
          sizes="100vw"
          unoptimized
        />
        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 hero-gradient" />
      </div>

      {/* Content */}
      <div className="container relative mx-auto px-4 pb-16 md:pb-24">
        <div className="max-w-2xl animate-fade-in">
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0 px-3 py-1">
              🔥 Mới cập nhật
            </Badge>
            {movie.quality && (
              <Badge variant="outline" className="border-primary/50 text-primary">
                {movie.quality}
              </Badge>
            )}
            {movie.language && (
              <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                {movie.language}
              </Badge>
            )}
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-3">
            <span className="gradient-text">{movie.name}</span>
          </h1>

          {/* Original Title */}
          {movie.original_name && movie.original_name !== movie.name && (
            <p className="text-lg text-muted-foreground mb-4">
              {movie.original_name}
            </p>
          )}

          {/* Meta Info */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-5">
            {movie.current_episode && (
              <span className="text-primary font-medium">{movie.current_episode}</span>
            )}
            {movie.time && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{movie.time}</span>
              </div>
            )}
            {movie.country?.[0] && (
              <div className="flex items-center gap-1.5">
                <Globe className="w-4 h-4" />
                <span>{movie.country[0].name}</span>
              </div>
            )}
          </div>

          {/* Categories/Genres */}
          {movie.category && movie.category.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-5">
              {movie.category.slice(0, 5).map((cat) => (
                <Badge key={cat.id} variant="secondary" className="px-3 py-1">
                  {cat.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Description */}
          {movie.description && (
            <p
              className="text-muted-foreground leading-relaxed mb-6 line-clamp-3 md:line-clamp-4"
              dangerouslySetInnerHTML={{
                __html: movie.description.replace(/<[^>]*>/g, "").slice(0, 300) + "...",
              }}
            />
          )}

          {/* Cast & Director */}
          <div className="space-y-1 text-sm text-muted-foreground mb-6">
            {movie.director && (
              <p>
                <span className="text-foreground font-medium">Đạo diễn: </span>
                {movie.director}
              </p>
            )}
            {movie.casts && (
              <p>
                <span className="text-foreground font-medium">Diễn viên: </span>
                {movie.casts.slice(0, 100)}
                {movie.casts.length > 100 ? "..." : ""}
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <Link href={`/phim/${movie.slug}`}>
              <Button
                size="lg"
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-lg shadow-amber-500/30 px-8"
              >
                <Play className="w-5 h-5 mr-2 fill-white" />
                Xem phim
              </Button>
            </Link>
            <Link href={`/phim/${movie.slug}`}>
              <Button
                size="lg"
                variant="outline"
                className="border-foreground/20 hover:bg-foreground/10"
              >
                <Info className="w-5 h-5 mr-2" />
                Thông tin
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
