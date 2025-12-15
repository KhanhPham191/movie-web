"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Heart, Info, Play } from "lucide-react";
import type { FilmItem } from "@/lib/api";
import { getImageUrl } from "@/lib/api";

interface AuMyCarouselProps {
  movies: FilmItem[];
  autoPlayMs?: number;
}

function formatEpisodeLabel(episode?: string) {
  if (!episode) return "";
  const match = episode.match(/Hoàn tất\s*\(([^)]+)\)/i);
  if (match) return match[1];
  return episode;
}

function stripHtml(value?: string) {
  if (!value) return "";
  return value.replace(/<[^>]*>/g, "");
}

export function AuMyCarousel({ movies, autoPlayMs = 9000 }: AuMyCarouselProps) {
  const slides = useMemo(() => movies.slice(0, 12), [movies]);
  const [current, setCurrent] = useState(0);

  const goTo = useCallback(
    (index: number) => {
      const len = slides.length;
      if (len === 0) return;
      const nextIndex = ((index % len) + len) % len;
      setCurrent(nextIndex);
    },
    [slides.length]
  );

  const next = useCallback(() => goTo(current + 1), [current, goTo]);
  const prev = useCallback(() => goTo(current - 1), [current, goTo]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setTimeout(next, autoPlayMs);
    return () => clearTimeout(timer);
  }, [current, next, slides.length, autoPlayMs]);

  if (slides.length === 0) return null;

  const movie = slides[current];
  const backdrop = getImageUrl(movie.poster_url || movie.thumb_url);
  const thumb = getImageUrl(movie.thumb_url || movie.poster_url);
  const episodeLabel = formatEpisodeLabel(movie.current_episode);
  const year = movie.created ? new Date(movie.created).getFullYear() : undefined;
  const description = stripHtml(movie.description || "").trim();
  const safeDescription =
    description.length > 0
      ? `${description.slice(0, 220)}${description.length > 220 ? "... " : ""}`
      : "Nội dung đang được cập nhật.";

  return (
    <div className="relative h-[460px] xs:h-[500px] sm:h-[540px] md:h-[600px] overflow-hidden rounded-[28px] border border-[#f6c453]/25 bg-[#191b24] shadow-[0_26px_60px_rgba(0,0,0,0.6)]">
      {/* Backdrop */}
      <div className="absolute inset-0">
        <Image
          src={backdrop}
          alt={movie.name}
          fill
          className="object-cover"
          priority
          sizes="100vw"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0d111c] via-[#0d111c]/88 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/35 to-[#0d111c]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(246,196,83,0.14),transparent_35%),radial-gradient(circle_at_85%_10%,rgba(255,46,188,0.1),transparent_32%)]" />
      </div>

      {/* Content block */}
      <div className="relative h-full px-4 sm:px-6 md:px-10 lg:px-12 flex flex-col justify-center pb-16 sm:pb-20 pt-12 sm:pt-16">
        <div className="max-w-3xl space-y-2.5 sm:space-y-4">
          <div>
            <p className="text-xs sm:text-base text-[#F6C453] font-semibold">
              Phim Âu - Mỹ (US-UK)
            </p>
            <h2 className="text-xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white leading-tight drop-shadow-lg">
              {movie.name}
            </h2>
            {movie.original_name && movie.original_name !== movie.name && (
              <p className="text-xs sm:text-base text-white/80">{movie.original_name}</p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="rounded-md bg-white/10 border border-white/12 text-white text-[10px] sm:text-xs font-semibold px-2.5 py-1">
              T16
            </span>
            {year && (
              <span className="rounded-md bg-[#1a2130] border border-white/10 text-white text-[10px] sm:text-xs font-semibold px-2.5 py-1">
                {year}
              </span>
            )}
            <span className="rounded-md bg-[#1a2130] border border-white/10 text-white text-[10px] sm:text-xs font-semibold px-2.5 py-1">
              Phần 1
            </span>
            {episodeLabel && (
              <span className="rounded-md bg-[#1a2130] border border-white/10 text-white text-[10px] sm:text-xs font-semibold px-2.5 py-1">
                {episodeLabel}
              </span>
            )}
          </div>

          {movie.category && movie.category.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm text-white/90">
              {movie.category.slice(0, 4).map((cat) => (
                <span
                  key={cat.slug}
                  className="rounded-full bg-[#1a2130] border border-white/12 px-2.5 py-1"
                >
                  {cat.name}
                </span>
              ))}
            </div>
          )}

          <p className="text-[13px] sm:text-base text-white/90 leading-relaxed max-w-2xl line-clamp-2 sm:line-clamp-3">
            {safeDescription}
          </p>

          <div className="flex items-center gap-3 pt-1">
            <Link href={`/phim/${movie.slug}`}>
              <button
                type="button"
                className="group relative h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-[#ffd66b] to-[#f6c453] shadow-[0_14px_30px_rgba(246,196,83,0.4)] hover:shadow-[0_18px_38px_rgba(246,196,83,0.5)] transition-all flex items-center justify-center"
                aria-label="Phát ngay"
              >
                <div className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Play className="relative z-10 h-5 w-5 sm:h-7 sm:w-7 fill-white text-white" />
              </button>
            </Link>

            <button
              type="button"
              className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/8 border border-white/12 text-white hover:bg-white/15 transition"
              aria-label="Yêu thích"
            >
              <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            <Link href={`/phim/${movie.slug}`}>
              <button
                type="button"
                className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/8 border border-white/12 text-white hover:bg-white/15 transition"
                aria-label="Thông tin"
              >
                <Info className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Thumbnail rail */}
      <div className="absolute inset-x-0 bottom-3 sm:bottom-6 px-3 sm:px-6">
        <div className="relative flex items-center justify-center">
          {slides.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-0 sm:-left-2 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-black/55 border border-white/10 text-white hover:bg-white/10 transition"
                aria-label="Phim trước"
              >
                <ChevronLeft className="mx-auto h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-0 sm:-right-2 h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-black/55 border border-white/10 text-white hover:bg-white/10 transition"
                aria-label="Phim kế tiếp"
              >
                <ChevronRight className="mx-auto h-4 w-4" />
              </button>
            </>
          )}

          <div className="flex gap-2 sm:gap-3 overflow-x-auto px-8 sm:px-16 pb-1 sm:pb-2 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
            {slides.map((item, index) => {
              const isActive = index === current;
              const image = getImageUrl(item.thumb_url || item.poster_url);
              return (
                <button
                  key={item.slug}
                  type="button"
                  onClick={() => goTo(index)}
                  className={`relative shrink-0 aspect-[2/3] w-16 xs:w-20 sm:w-24 md:w-28 overflow-hidden rounded-xl sm:rounded-2xl transition-all duration-300 border ${
                    isActive
                      ? "shadow-[0_16px_36px_rgba(246,196,83,0.45)] scale-[1.05] border-[#F6C453]"
                      : "shadow-[0_10px_26px_rgba(0,0,0,0.4)] border-white/14 hover:border-white/30"
                  }`}
                  aria-label={`Chọn phim ${item.name}`}
                >
                  <Image
                    src={image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="128px"
                    unoptimized
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
