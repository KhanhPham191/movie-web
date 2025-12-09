"use client";

import { useState, useEffect } from "react";
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
  variant?: "default" | "portrait" | "top10" | "newRelease" | "series" | "cinema";
  rank?: number;
}

// Chuẩn hoá text số tập: "Hoàn tất (20/20)" -> "20/20"
function formatEpisodeLabel(episode?: string) {
  if (!episode) return "";
  const match = episode.match(/Hoàn tất\s*\(([^)]+)\)/i);
  if (match) return match[1]; // chỉ lấy "20/20"
  return episode;
}

export function MovieCard({ movie, index = 0, variant = "default", rank }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPortraitImage, setIsPortraitImage] = useState(false);
  // Use thumb_url for movie cards in categories (clearer for horizontal display)
  const imageUrl = getImageUrl(movie.thumb_url || movie.poster_url);
  useEffect(() => {
    setIsPortraitImage(false);
  }, [imageUrl]);

  // Top 10 variant - Netflix style with badge
  if (variant === "top10" && rank) {
    return (
      <Link href={`/phim/${movie.slug}`}>
        <div className="group relative flex flex-col h-full">
          {/* Poster */}
          <div 
            className="relative aspect-[2/3] w-full rounded-[10px] overflow-hidden transition-all duration-300 group-hover:scale-105 bg-muted flex-shrink-0 border border-transparent group-hover:border-[rgba(246,196,83,0.3)]"
            style={{
              willChange: "transform",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "translateZ(0)",
            }}
          >
            {/* Overlay vàng khi hover */}
            <div className="absolute inset-0 bg-[rgba(246,196,83,0.15)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10" />
            <Image
              src={imageUrl}
              alt={movie.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
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
          <div className="mt-2 space-y-1 flex-shrink-0">
            <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5rem] group-hover:text-white transition-colors">
              {movie.name}
            </h3>
            {(movie.time || movie.total_episodes) && (
              <p className="text-[10px] text-gray-400 flex items-center gap-2">
                {movie.time && <span className="truncate">{movie.time}</span>}
                <span className="px-1 py-0.5 rounded border border-gray-500 text-[9px] leading-none">
                  16+
                </span>
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Portrait variant (vertical poster)
  if (variant === "portrait") {
    return (
      <Link href={`/phim/${movie.slug}`}>
        <div 
          className="group relative flex flex-col h-full"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="relative aspect-[2/3] w-full rounded-[10px] overflow-hidden bg-muted transition-all duration-300 group-hover:scale-105 group-hover:z-10 flex-shrink-0 border border-transparent group-hover:border-[rgba(246,196,83,0.3)]">
            {/* Overlay vàng khi hover */}
            <div className="absolute inset-0 bg-[rgba(246,196,83,0.15)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10" />
            <Image
              src={imageUrl}
              alt={movie.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            />
            {movie.current_episode && (
              <Badge className="absolute top-2 right-2 bg-red-600 text-white border-0 text-[10px]">
                {formatEpisodeLabel(movie.current_episode)}
              </Badge>
            )}
          </div>
          <div className="mt-2 space-y-1 flex-shrink-0">
            <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5rem] group-hover:text-white transition-colors">
              {movie.name}
            </h3>
            {(movie.time || movie.total_episodes) && (
              <p className="text-[10px] text-gray-400 flex items-center gap-2">
                {movie.time && <span className="truncate">{movie.time}</span>}
                <span className="px-1 py-0.5 rounded border border-gray-500 text-[9px] leading-none">
                  16+
                </span>
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // New Release variant - poster + big rank + info, giống layout Top mới
  if (variant === "newRelease") {
    // Xác định hướng nghiêng: 1 phải, 2 trái, 3 phải,... dựa trên rank (fallback index)
    const order = rank ?? index + 1;
    const tiltDeg = order % 2 === 1 ? 12 : -12;

    return (
      <Link href={`/phim/${movie.slug}`}>
        <div
          className="group relative flex flex-col items-start h-full"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Poster */}
          <div
            className="relative aspect-[2/3] w-full rounded-[10px] overflow-hidden bg-muted transition-all duration-150 ease-out group-hover:shadow-2xl flex-shrink-0 border border-transparent group-hover:border-[rgba(246,196,83,0.3)]"
            style={{
              transform: `perspective(900px) rotateY(${tiltDeg}deg) scale(${isHovered ? 1.06 : 1})`,
              transformStyle: "preserve-3d",
            }}
          >
            {/* Overlay vàng khi hover */}
            <div className="absolute inset-0 bg-[rgba(246,196,83,0.15)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10" />
            <Image
              src={imageUrl}
              alt={movie.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            />
            {movie.current_episode && (
              <Badge className="absolute bottom-2 left-2 bg-red-600 text-white border-0 text-[10px] font-bold">
                {formatEpisodeLabel(movie.current_episode)}
              </Badge>
            )}
          </div>

          {/* Rank + Info */}
          <div className="mt-3 flex items-start gap-2 w-full flex-shrink-0">
            {rank && (
              <div className="text-3xl xs:text-4xl sm:text-5xl font-black text-[#F6C453] leading-none flex-shrink-0">
                {rank}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm xs:text-base font-semibold text-white line-clamp-2 min-h-[2.5rem]">
                {movie.name}
              </h3>
              <p className="mt-1 text-[11px] xs:text-xs text-gray-400 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                {movie.time && <span>{movie.time}</span>}
                {movie.language && (
                  <span className="px-1 py-0.5 rounded bg-white/10 text-[10px] uppercase tracking-wide">
                    {movie.language}
                  </span>
                )}
                <span className="px-1 py-0.5 rounded border border-gray-500 text-[10px]">
                  13+
                </span>
              </p>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Series variant - poster + info, không số thứ tự, 3D nhẹ khi hover
  if (variant === "series") {
    return (
      <Link href={`/phim/${movie.slug}`}>
        <div
          className="group relative flex flex-col items-start h-full"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Poster */}
          <div
            className="relative aspect-[2/3] w-full rounded-[10px] overflow-hidden bg-muted transition-all duration-150 ease-out group-hover:shadow-2xl flex-shrink-0 border border-transparent group-hover:border-[rgba(246,196,83,0.3)]"
            style={{
              transform: isHovered
                ? "perspective(900px) rotateY(8deg) scale(1.04)"
                : "none",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Overlay vàng khi hover */}
            <div className="absolute inset-0 bg-[rgba(246,196,83,0.15)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10" />
            <Image
              src={imageUrl}
              alt={movie.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            />
            {movie.current_episode && (
              <Badge className="absolute bottom-2 left-2 bg-red-600 text-white border-0 text-[10px] font-bold">
                {formatEpisodeLabel(movie.current_episode)}
              </Badge>
            )}
          </div>

          {/* Info */}
          <div className="mt-3 w-full flex-shrink-0">
            <h3 className="text-sm xs:text-base font-semibold text-white line-clamp-2 min-h-[2.5rem]">
              {movie.name}
            </h3>
            <p className="mt-1 text-[11px] xs:text-xs text-gray-400 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {movie.time && <span>{movie.time}</span>}
              <span className="px-1 py-0.5 rounded border border-gray-500 text-[10px]">
                16+
              </span>
            </p>
          </div>
        </div>
      </Link>
    );
  }

  // Cinema / US-UK variant - wide backdrop + small poster + info (layout giống hình bạn gửi)
  if (variant === "cinema") {
    // Đổi ngược lại giữa poster và thumb_url:
    // - backdrop dùng poster_url (nếu có) để rõ nét
    // - poster nhỏ bên dưới dùng thumb_url để khác hình
    const backdropUrl = getImageUrl(movie.poster_url || movie.thumb_url);
    const thumbUrl = getImageUrl(movie.thumb_url || movie.poster_url);

    return (
      <Link href={`/phim/${movie.slug}`}>
        <div className="group relative w-full max-w-full h-full flex flex-col">
          {/* Wide backdrop */}
          <div className="relative aspect-[16/9] w-full rounded-[10px] overflow-hidden bg-muted transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl flex-shrink-0 border border-transparent group-hover:border-[rgba(246,196,83,0.3)]">
            {/* Overlay vàng khi hover */}
            <div className="absolute inset-0 bg-[rgba(246,196,83,0.15)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10" />
            <Image
              src={backdropUrl}
              alt={movie.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              unoptimized
            />

            {/* Dark gradient bar at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-20 sm:h-24 bg-gradient-to-t from-[#050505] via-[#050505e6] to-transparent" />

            {/* Poster + text overlay on bottom bar */}
            <div className="absolute left-3 right-3 sm:left-4 sm:right-4 bottom-3 flex items-end gap-2 sm:gap-3">
              {/* Small vertical poster */}
              <div className="relative aspect-[2/3] w-12 xs:w-14 sm:w-20 rounded-md overflow-hidden shadow-2xl shadow-black/80 border border-white/10 bg-black/60 flex-shrink-0">
                <Image
                  src={thumbUrl}
                  alt={movie.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>

              {/* Text & badges */}
              <div className="flex-1 min-w-0">
                <div className="mb-0.5 sm:mb-1 flex flex-wrap items-center gap-1">
                  {movie.language && (
                    <Badge className="bg-white text-black text-[9px] xs:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 border-0">
                      {movie.language}
                    </Badge>
                  )}
                  {movie.current_episode && (
                    <Badge className="bg-red-600 text-white text-[9px] xs:text-[10px] font-semibold border-0">
                      {formatEpisodeLabel(movie.current_episode)}
                    </Badge>
                  )}
                </div>
                <h3 className="text-xs xs:text-sm sm:text-base font-semibold text-white line-clamp-1">
                  {movie.name}
                </h3>
                {movie.original_name && movie.original_name !== movie.name && (
                  <p className="text-[10px] xs:text-xs text-gray-300 line-clamp-1">
                    {movie.original_name}
                  </p>
                )}
                <p className="mt-0.5 sm:mt-1 text-[10px] xs:text-xs text-gray-300 flex flex-wrap items-center gap-x-1.5 sm:gap-x-2 gap-y-0.5">
                  <span className="px-1 py-0.5 rounded border border-gray-500 text-[9px] xs:text-[10px]">
                    18+
                  </span>
                  {movie.time && <span>{movie.time}</span>}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Default variant - Netflix 2024 horizontal thumbnail
  return (
    <div
      className="group relative flex flex-col h-full premium-hover"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/phim/${movie.slug}`}>
        <div
          className={`relative rounded-[10px] overflow-hidden bg-muted transition-all duration-300 ease-out flex-shrink-0 border border-transparent ${
            isHovered
              ? "scale-[1.25] sm:scale-[1.35] md:scale-[1.4] z-50 shadow-2xl shadow-black/80 border-[rgba(246,196,83,0.3)] rounded-t-[10px] rounded-b-none"
              : "scale-100 z-10 group-hover:border-[rgba(246,196,83,0.3)]"
          }`}
          style={{
            transformOrigin: index === 0 ? "left center" : "center center",
            willChange: "transform",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "translateZ(0)",
          }}
        >
          {/* Overlay vàng khi hover */}
          <div className={`absolute inset-0 bg-[rgba(246,196,83,0.15)] transition-opacity duration-300 pointer-events-none z-10 ${
            isHovered ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`} />
          {/* Thumbnail - 16:9 using thumb_url (crop center) */}
          <div className="relative aspect-video w-full overflow-hidden rounded-[10px]">
            <Image
              src={imageUrl}
              alt={movie.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            />

            {/* Episode badge */}
            {!isHovered && movie.current_episode && (
              <div className="absolute bottom-2 left-2">
                <Badge className="bg-red-600 text-white border-0 text-[10px] font-bold">
                  {formatEpisodeLabel(movie.current_episode)}
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
            <div className="absolute left-0 right-0 top-full bg-[#0f0f1f] rounded-b-md p-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Action Buttons Row */}
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F6C453] to-[#D3A13A] hover:brightness-110 text-white border-0"
                  onClick={(e) => e.preventDefault()}
                >
                  <Play className="w-5 h-5 fill-white" />
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
        <h3 className="mt-2 text-sm font-medium line-clamp-2 min-h-[2.5rem] text-gray-300 group-hover:text-white transition-colors flex-shrink-0">
          {movie.name}
        </h3>
      )}
    </div>
  );
}
