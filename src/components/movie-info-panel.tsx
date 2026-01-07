"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getImageUrl } from "@/lib/api";
import { ExpandableContent } from "./expandable-content";
import { ExpandableCategories } from "./expandable-categories";
import { EpisodeSelectorWatch } from "./episode-selector-watch";

interface MovieInfoPanelProps {
  movie: {
    name: string;
    original_name?: string;
    poster_url?: string;
    thumb_url?: string;
    quality?: string;
    current_episode?: string;
    time?: string;
    created?: string;
    description?: string;
    imdb?: string | number;
    tmdb?: string | number;
    total_episodes?: number;
  };
  categories: any[];
  allEpisodes: any[];
  currentEpisodeIndex: number;
  servers: any[];
  movieSlug: string;
  currentEpisodeSlug: string;
  currentServerName: string;
}

export function MovieInfoPanel({
  movie,
  categories,
  allEpisodes,
  currentEpisodeIndex,
  servers,
  movieSlug,
  currentEpisodeSlug,
  currentServerName,
}: MovieInfoPanelProps) {
  // Dùng poster_url cho poster nhỏ trong info panel (ảnh dọc 2:3)
  const posterUrl = getImageUrl(movie.poster_url || movie.thumb_url);
  const cleanDescription = movie.description?.replace(/<[^>]*>/g, "") || "";
  
  // Tính số tập cao nhất từ tất cả servers (cố định, không thay đổi)
  const maxTotalEpisodes = Math.max(
    ...servers.map(s => s.items?.length || 0),
    allEpisodes.length,
    0
  );
  
  // Lấy năm từ created date
  const year = movie.created ? new Date(movie.created).getFullYear() : null;
  
  // Parse current_episode để lấy phần và tập
  const parseEpisode = (episode?: string) => {
    if (!episode) return null;
    const partMatch = episode.match(/[Pp]hần\s*(\d+)/i);
    const epMatch = episode.match(/[Tt]ập\s*(\d+)/i);
    return {
      part: partMatch ? partMatch[1] : null,
      episode: epMatch ? epMatch[1] : null,
    };
  };
  
  const episodeInfo = parseEpisode(movie.current_episode);

  return (
    <div className="card-surface p-2.5 sm:p-3">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-3 sm:gap-4 items-start">
        {/* Cột trái: Thông tin phim - Cố định để không bị ảnh hưởng */}
        <div className="space-y-2 min-w-0">
          <div className="flex gap-2 sm:gap-3">
            {/* Poster - Smaller */}
            <div className="relative aspect-[2/3] w-20 sm:w-24 flex-shrink-0 rounded-lg overflow-hidden bg-[#0a0a0a]">
              <Image
                src={posterUrl}
                alt={movie.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 80px, 96px"
                loading="lazy"
                quality={60}
              />
            </div>

            {/* Content - Cố định width */}
            <div className="flex-1 space-y-1.5 min-w-0 max-w-full">
              {/* Titles - Tăng kích thước text */}
              <div className="space-y-0.5 min-h-[32px] sm:min-h-[36px]">
                <h1 className="text-base sm:text-lg font-bold text-white line-clamp-1">
                  {movie.name}
                </h1>
                {movie.original_name && movie.original_name !== movie.name && (
                  <p className="text-xs sm:text-sm text-white/70 line-clamp-1">
                    {movie.original_name}
                  </p>
                )}
              </div>

              {/* Info Badges - Tăng kích thước text */}
              <div className="flex flex-wrap gap-1.5 min-h-[20px]">
                {(() => {
                  const imdbNumber = Number(movie.imdb);
                  const hasValidImdb =
                    movie.imdb != null &&
                    String(movie.imdb).trim() !== "" &&
                    !Number.isNaN(imdbNumber) &&
                    imdbNumber > 0;

                  return hasValidImdb ? (
                    <Badge className="bg-yellow-500 text-black font-semibold text-[10px] sm:text-xs px-2 py-1">
                      IMDb {movie.imdb}
                    </Badge>
                  ) : null;
                })()}
                {(() => {
                  const tmdbNumber = Number(movie.tmdb);
                  const hasValidTmdb =
                    movie.tmdb != null &&
                    String(movie.tmdb).trim() !== "" &&
                    !Number.isNaN(tmdbNumber) &&
                    tmdbNumber > 0;

                  return hasValidTmdb ? (
                    <Badge className="bg-blue-500 text-white font-semibold text-[10px] sm:text-xs px-2 py-1">
                      TMDB {movie.tmdb}
                    </Badge>
                  ) : null;
                })()}
                <Badge className="bg-black text-white font-semibold text-[10px] sm:text-xs px-2 py-1 border border-white/20">
                  T18
                </Badge>
                {year && (
                  <Badge className="bg-white text-black font-semibold text-[10px] sm:text-xs px-2 py-1">
                    {year}
                  </Badge>
                )}
                {episodeInfo?.part && (
                  <Badge className="bg-white text-black font-semibold text-[10px] sm:text-xs px-2 py-1">
                    Phần {episodeInfo.part}
                  </Badge>
                )}
                {maxTotalEpisodes > 0 && (
                  <Badge className="bg-white text-black font-semibold text-[10px] sm:text-xs px-2 py-1">
                    Tập {maxTotalEpisodes}
                  </Badge>
                )}
              </div>

              {/* Genre Tags - Smaller - Cố định height */}
              {categories.length > 0 && (
                <div className="min-h-[24px]">
                  <ExpandableCategories categories={categories} showExpandButton={false} />
                </div>
              )}
            </div>
          </div>

          {/* Synopsis - Cố định để không bị shift */}
          {cleanDescription && (
            <div className="min-h-[60px]">
              <ExpandableContent
                title="Thông tin phim >"
                content={movie.description || cleanDescription}
                maxLines={2}
              />
            </div>
          )}
        </div>

        {/* Cột phải: Danh sách tập phim - Không ảnh hưởng cột trái */}
        {servers.length > 0 && allEpisodes.length > 0 && (
          <div className="min-w-0">
            <EpisodeSelectorWatch
              servers={servers}
              movieSlug={movieSlug}
              currentEpisodeSlug={currentEpisodeSlug}
              currentServerName={currentServerName}
              currentEpisodeIndex={currentEpisodeIndex}
              movieName={movie.name}
              posterUrl={movie.thumb_url || movie.poster_url}
            />
          </div>
        )}
      </div>
    </div>
  );
}

