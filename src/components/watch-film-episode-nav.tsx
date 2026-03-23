"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { analytics } from "@/lib/analytics";

interface WatchFilmEpisodeNavProps {
  movieName: string;
  movieSlug: string;
  currentEpisodeSlug: string;
  prevEpisode?: { slug: string; name: string } | null;
  nextEpisode?: { slug: string; name: string } | null;
  /** Chỉ đổi video, không đổi URL */
  onNavigateEpisode?: (episodeSlug: string) => void;
}

export function WatchFilmEpisodeNav({ movieName, movieSlug, currentEpisodeSlug, prevEpisode, nextEpisode, onNavigateEpisode }: WatchFilmEpisodeNavProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const serverParam = searchParams?.get('server');

  if (!prevEpisode && !nextEpisode) return null;

  const buildHref = (episodeSlug: string) => {
    const base = `/xem-phim/${movieSlug}/${episodeSlug}`;
    return serverParam ? `${base}?server=${serverParam}` : base;
  };

  const handleEpisodeNav = (episodeSlug: string, direction: 'prev' | 'next') => {
    const nextEp = direction === 'prev' ? prevEpisode : nextEpisode;
    if (nextEp) {
      analytics.trackWatchFilmEpisodeNav(movieName, movieSlug, currentEpisodeSlug, episodeSlug, direction);
      if (onNavigateEpisode) {
        onNavigateEpisode(episodeSlug);
      } else {
        router.push(buildHref(episodeSlug), { scroll: false });
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      {prevEpisode && (
        <Button
          onClick={() => handleEpisodeNav(prevEpisode.slug, 'prev')}
          variant="outline"
          size="sm"
          className="group/prev bg-white/[0.04] text-white/80 border-white/[0.08] hover:bg-white/[0.08] hover:border-[#F6C453]/40 hover:text-white text-xs transition-all duration-200 rounded-lg h-8 sm:h-9 px-3 sm:px-4"
        >
          <ChevronLeft className="w-3.5 h-3.5 mr-0.5 transition-transform group-hover/prev:-translate-x-0.5" />
          <span className="truncate">Tập trước</span>
        </Button>
      )}
      {nextEpisode && (
        <Button
          onClick={() => handleEpisodeNav(nextEpisode.slug, 'next')}
          size="sm"
          className="group/next bg-[#F6C453] hover:bg-[#e5b742] text-black font-semibold text-xs shadow-[0_4px_16px_rgba(246,196,83,0.25)] hover:shadow-[0_6px_20px_rgba(246,196,83,0.35)] transition-all duration-200 rounded-lg h-8 sm:h-9 px-3 sm:px-4"
        >
          <span className="truncate">Tập tiếp</span>
          <ChevronRight className="w-3.5 h-3.5 ml-0.5 transition-transform group-hover/next:translate-x-0.5" />
        </Button>
      )}
    </div>
  );
}

