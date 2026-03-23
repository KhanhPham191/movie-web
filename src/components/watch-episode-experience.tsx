"use client";

import { Suspense, useCallback, useMemo, useState } from "react";
import type { FilmItem } from "@/lib/api";
import { isValidTime } from "@/lib/utils";
import { NetflixPlayer } from "@/components/player/netflix-player";
import { EpisodeSelectorWatch } from "@/components/episode-selector-watch";
import { MovieInfoPanel } from "@/components/movie-info-panel";
import { MovieVersionsSelector } from "@/components/movie-versions-selector";
import { WatchProgressTracker } from "@/components/watch-progress-tracker";
import { WatchFilmTracker } from "@/components/watch-film-tracker";
import { WatchFilmEpisodeNav } from "@/components/watch-film-episode-nav";
import { WatchFilmButtons } from "@/components/watch-film-buttons";
import {
  resolveWatchEpisode,
  type WatchServerItem,
} from "@/lib/watch-episode-resolve";

type WatchEpisodeExperienceProps = {
  slug: string;
  movie: FilmItem;
  filteredEpisodes: WatchServerItem[];
  /** Slug tập sau khi server resolve (khớp URL hoặc fallback) */
  initialEpisodeSlug: string;
  initialServerName: string;
  serverParam?: string;
  shouldRequestFullscreen?: boolean;
  categories: any[];
  /** Server-only slots (async RSC) */
  seriesPartsSlot: React.ReactNode;
  relatedPartsSlot: React.ReactNode;
};

export function WatchEpisodeExperience({
  slug,
  movie,
  filteredEpisodes,
  initialEpisodeSlug,
  initialServerName,
  serverParam,
  shouldRequestFullscreen = false,
  categories,
  seriesPartsSlot,
  relatedPartsSlot,
}: WatchEpisodeExperienceProps) {
  const [episodeSlug, setEpisodeSlug] = useState(initialEpisodeSlug);
  const [preferredServerName, setPreferredServerName] =
    useState(initialServerName);

  const resolved = useMemo(
    () =>
      resolveWatchEpisode(filteredEpisodes, episodeSlug, {
        serverParam,
        preferredServerName,
      }),
    [filteredEpisodes, episodeSlug, serverParam, preferredServerName]
  );

  const { currentEpisode, currentServer, episodeIndex, allEpisodes } =
    resolved;

  const prevEpisode =
    episodeIndex > 0 ? allEpisodes[episodeIndex - 1] : null;
  const nextEpisode =
    episodeIndex >= 0 && episodeIndex < allEpisodes.length - 1
      ? allEpisodes[episodeIndex + 1]
      : null;

  const handleEpisodeSelect = useCallback((nextSlug: string) => {
    setEpisodeSlug(nextSlug);
  }, []);

  const handleServerSelect = useCallback(
    (serverName: string) => {
      setPreferredServerName(serverName);
      const server = filteredEpisodes.find((s) => s.server_name === serverName);
      const items = server?.items || [];
      const idx = items.findIndex((e) => e.slug === episodeSlug);
      if (idx === -1 && items[0]) {
        setEpisodeSlug(items[0].slug);
      }
    },
    [filteredEpisodes, episodeSlug]
  );

  const handleVersionSelect = useCallback(
    (serverName: string, nextSlug: string) => {
      setPreferredServerName(serverName);
      setEpisodeSlug(nextSlug);
    },
    []
  );

  const goToNextEpisode = useCallback(() => {
    if (nextEpisode) setEpisodeSlug(nextEpisode.slug);
  }, [nextEpisode]);

  if (!currentEpisode || !currentServer) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Không tìm thấy tập phim</p>
      </div>
    );
  }

  const countries = Array.isArray(movie.country)
    ? movie.country
    : movie.country
      ? [movie.country]
      : [];
  const formatLabel = (value: any) =>
    typeof value === "object" && value !== null
      ? value.name || value.slug || value.id || ""
      : String(value || "");

  return (
    <div className="space-y-6 sm:space-y-8">
      <Suspense fallback={null}>
        <WatchFilmTracker
          movieName={movie.name}
          movieSlug={movie.slug}
          episodeName={currentEpisode.name}
          episodeSlug={currentEpisode.slug}
        />
      </Suspense>

      <Suspense fallback={null}>
        <div className="animate-fade-in">
          <WatchProgressTracker
            movie={movie}
            episodeSlug={currentEpisode.slug}
            episodeName={currentEpisode.name}
            serverName={currentServer.server_name}
          />
        </div>
      </Suspense>

      <div className="space-y-0 max-w-full text-white">
        <div className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5),0_24px_80px_rgba(0,0,0,0.6)] bg-black ring-1 ring-white/10 before:absolute before:inset-0 before:rounded-xl sm:before:rounded-2xl before:ring-1 before:ring-inset before:ring-white/[0.06] before:pointer-events-none before:z-10">
          <div className="relative aspect-video bg-black w-full">
            {currentEpisode.m3u8 ? (
              <NetflixPlayer
                key={`${currentEpisode.slug}-${currentServer.server_name}`}
                src={currentEpisode.m3u8}
                title={`${movie.name} - ${currentEpisode.name}`}
                className="h-full w-full"
                autoPlay={true}
                muted={false}
                movieName={movie.name}
                movieSlug={movie.slug}
                episodeSlug={currentEpisode.slug}
                nextEpisodeUrl={
                  nextEpisode
                    ? `/xem-phim/${slug}/${nextEpisode.slug}${
                        serverParam ? `?server=${serverParam}` : ""
                      }`
                    : undefined
                }
                onNextEpisode={
                  nextEpisode ? goToNextEpisode : undefined
                }
                nextEpisodeName={nextEpisode ? nextEpisode.name : undefined}
                shouldRequestFullscreen={shouldRequestFullscreen}
              />
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900/95 to-black text-white p-8">
                <div className="text-center space-y-5">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto border-[3px] border-white/10 border-t-[#F6C453] rounded-full animate-spin" />
                  <p className="text-xs sm:text-sm text-white/50 font-medium tracking-wide">
                    Đang tải video...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 sm:mt-5 space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <h1 className="text-base sm:text-lg md:text-xl font-bold text-white truncate leading-tight">
                {movie.name}
              </h1>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {movie.quality && (
                  <span className="px-2 py-0.5 bg-[#F6C453]/12 text-[#F6C453] text-[10px] sm:text-xs font-semibold rounded-md border border-[#F6C453]/15">
                    {movie.quality}
                  </span>
                )}
                {movie.current_episode && (
                  <span className="text-[10px] sm:text-xs text-white/45 font-medium">
                    {movie.current_episode}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-[10px] sm:text-xs text-white/40 font-medium">
              {isValidTime(movie.time) && <span>{movie.time}</span>}
              {isValidTime(movie.time) && countries[0] && (
                <span className="text-white/15">•</span>
              )}
              {countries[0] && <span>{formatLabel(countries[0])}</span>}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4">
            <WatchFilmEpisodeNav
              movieName={movie.name}
              movieSlug={movie.slug}
              currentEpisodeSlug={currentEpisode.slug}
              prevEpisode={
                prevEpisode ? { slug: prevEpisode.slug, name: prevEpisode.name } : null
              }
              nextEpisode={
                nextEpisode ? { slug: nextEpisode.slug, name: nextEpisode.name } : null
              }
              onNavigateEpisode={handleEpisodeSelect}
            />

            <WatchFilmButtons
              movieName={movie.name}
              movieSlug={movie.slug}
              episodeSlug={currentEpisode.slug}
            />
          </div>
        </div>
      </div>

      {filteredEpisodes.length > 0 && currentServer && (
        <Suspense fallback={null}>
          <div className="relative z-50">
            <MovieVersionsSelector
              servers={filteredEpisodes}
              movieSlug={slug}
              currentEpisodeSlug={currentEpisode.slug}
              currentServerName={currentServer.server_name}
              movieName={movie.name}
              posterUrl={movie.thumb_url || movie.poster_url}
              onVersionSelect={handleVersionSelect}
            />
          </div>
        </Suspense>
      )}

      {currentServer && filteredEpisodes.length > 0 && (
        <Suspense fallback={null}>
          <div className="relative z-50">
            <MovieInfoPanel
              movie={movie}
              categories={categories}
              allEpisodes={allEpisodes}
              currentEpisodeIndex={episodeIndex}
              servers={filteredEpisodes}
              movieSlug={slug}
              currentEpisodeSlug={currentEpisode.slug}
              currentServerName={currentServer.server_name}
              onEpisodeSelect={handleEpisodeSelect}
              onServerSelect={handleServerSelect}
            />
          </div>
        </Suspense>
      )}

      {seriesPartsSlot}
      {relatedPartsSlot}
    </div>
  );
}
