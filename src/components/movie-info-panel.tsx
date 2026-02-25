"use client";

import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { getImageUrl } from "@/lib/api";

const BLUR_DATA_URL = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjE1IiBmaWxsPSIjMWExYTJlIi8+PC9zdmc+";
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
    <div className="rounded-xl bg-white/[0.03] ring-1 ring-white/[0.06] p-3 sm:p-4">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1.2fr] gap-3 sm:gap-5 items-start">
        {/* Cột trái: Thông tin phim */}
        <div className="space-y-2.5 min-w-0">
          <div className="flex gap-2.5 sm:gap-3">
            {/* Poster */}
            <div className="relative aspect-[2/3] w-20 sm:w-24 flex-shrink-0 rounded-lg overflow-hidden bg-black/40 ring-1 ring-white/[0.06]">
              <Image
                src={posterUrl}
                alt={movie.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 80px, 96px"
                quality={70}
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
              />
            </div>

            {/* Content */}
            <div className="flex-1 space-y-1.5 min-w-0 max-w-full">
              {/* Titles */}
              <div className="space-y-0.5 min-h-[32px] sm:min-h-[36px]">
                <h1 className="text-sm sm:text-base font-bold text-white line-clamp-1">
                  {movie.name}
                </h1>
                {movie.original_name && movie.original_name !== movie.name && (
                  <p className="text-[11px] sm:text-xs text-white/50 line-clamp-1">
                    {movie.original_name}
                  </p>
                )}
              </div>

              {/* Info Badges */}
              <div className="flex flex-wrap gap-1 min-h-[20px]">
                {(() => {
                  const imdbNumber = Number(movie.imdb);
                  const hasValidImdb =
                    movie.imdb != null &&
                    String(movie.imdb).trim() !== "" &&
                    !Number.isNaN(imdbNumber) &&
                    imdbNumber > 0;

                  return hasValidImdb ? (
                    <Badge className="bg-yellow-500/90 text-black font-semibold text-[10px] px-1.5 py-0.5">
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
                    <Badge className="bg-blue-500/90 text-white font-semibold text-[10px] px-1.5 py-0.5">
                      TMDB {movie.tmdb}
                    </Badge>
                  ) : null;
                })()}
                {year && (
                  <Badge className="bg-white/10 text-white/70 font-medium text-[10px] px-1.5 py-0.5">
                    {year}
                  </Badge>
                )}
                {episodeInfo?.part && (
                  <Badge className="bg-white/10 text-white/70 font-medium text-[10px] px-1.5 py-0.5">
                    Phần {episodeInfo.part}
                  </Badge>
                )}
                {maxTotalEpisodes > 0 && (
                  <Badge className="bg-white/10 text-white/70 font-medium text-[10px] px-1.5 py-0.5">
                    {maxTotalEpisodes} tập
                  </Badge>
                )}
              </div>

              {/* Genre Tags */}
              {categories.length > 0 && (
                <div className="min-h-[24px]">
                  <ExpandableCategories categories={categories} showExpandButton={false} />
                </div>
              )}
            </div>
          </div>

          {/* Synopsis */}
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

        {/* Cột phải: Danh sách tập phim */}
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

