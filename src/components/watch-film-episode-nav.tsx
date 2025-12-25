"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { analytics } from "@/lib/analytics";

interface WatchFilmEpisodeNavProps {
  movieName: string;
  movieSlug: string;
  currentEpisodeSlug: string;
  prevEpisode?: { slug: string; name: string } | null;
  nextEpisode?: { slug: string; name: string } | null;
}

export function WatchFilmEpisodeNav({ movieName, movieSlug, currentEpisodeSlug, prevEpisode, nextEpisode }: WatchFilmEpisodeNavProps) {
  return (
    <div className="mt-2 flex items-center justify-between gap-2 sm:gap-4">
      {prevEpisode && (
        <Button
          asChild
          variant="outline"
          size="lg"
          className="relative group/prev min-w-[130px] sm:min-w-[150px] bg-[#191b24] text-white border-white/15 hover:bg-white/5 hover:border-[#F6C453] text-xs sm:text-sm transition-all duration-300"
        >
          <Link 
            href={`/xem-phim/${movieSlug}/${prevEpisode.slug}`}
            onClick={() => {
              analytics.trackWatchFilmEpisodeNav(movieName, movieSlug, currentEpisodeSlug, prevEpisode.slug, 'prev');
            }}
          >
            <ChevronLeft className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 mr-1" />
            <span className="relative z-10 truncate">Tập trước</span>
          </Link>
        </Button>
      )}
      {nextEpisode && (
        <Button
          asChild
          size="lg"
          className="relative group/next ml-auto min-w-[130px] sm:min-w-[150px] bg-gradient-to-r from-[#F6C453] to-[#D3A13A] hover:from-[#F6C453]/90 hover:to-[#D3A13A]/90 text-white font-semibold text-xs sm:text-sm shadow-[0_8px_25px_rgba(246,196,83,0.4)] hover:shadow-[0_12px_35px_rgba(246,196,83,0.5)] transition-all duration-300"
        >
          <Link 
            href={`/xem-phim/${movieSlug}/${nextEpisode.slug}`}
            onClick={() => {
              analytics.trackWatchFilmEpisodeNav(movieName, movieSlug, currentEpisodeSlug, nextEpisode.slug, 'next');
            }}
          >
            <span className="relative z-10 truncate">
              Tập tiếp theo
            </span>
            <ChevronRight className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 ml-1" />
          </Link>
        </Button>
      )}
    </div>
  );
}

