"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, Info } from "lucide-react";
import { analytics } from "@/lib/analytics";

interface WatchFilmButtonsProps {
  movieName: string;
  movieSlug: string;
  episodeSlug: string;
}

export function WatchFilmButtons({ movieName, movieSlug, episodeSlug }: WatchFilmButtonsProps) {
  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        className="bg-white/[0.04] border-white/[0.08] text-white/70 hover:bg-white/[0.08] hover:border-[#F6C453]/40 hover:text-white text-xs transition-all duration-200 rounded-lg h-8 sm:h-9 px-3 sm:px-4"
        asChild
      >
        <Link 
          href={`/phim/${movieSlug}`}
          onClick={() => {
            analytics.trackWatchFilmButtonClick(movieName, movieSlug, 'Chi tiết', episodeSlug);
          }}
        >
          <Info className="w-3.5 h-3.5 mr-1.5" />
          <span>Chi tiết</span>
        </Link>
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="bg-white/[0.04] border-white/[0.08] text-white/70 hover:bg-white/[0.08] hover:border-[#F6C453]/40 hover:text-white text-xs transition-all duration-200 rounded-lg h-8 sm:h-9 px-3 sm:px-4"
        asChild
      >
        <Link 
          href="/"
          onClick={() => {
            analytics.trackWatchFilmButtonClick(movieName, movieSlug, 'Trang chủ', episodeSlug);
          }}
        >
          <Home className="w-3.5 h-3.5 mr-1.5" />
          <span>Trang chủ</span>
        </Link>
      </Button>
    </div>
  );
}

