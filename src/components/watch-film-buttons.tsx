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
    <div className="flex flex-wrap gap-2 sm:gap-3">
      <Button
        size="lg"
        className="relative bg-gradient-to-r from-[#F6C453] to-[#D3A13A] hover:from-[#F6C453]/90 hover:to-[#D3A13A]/90 text-white font-semibold flex-1 sm:flex-none text-sm sm:text-base shadow-[0_8px_25px_rgba(246,196,83,0.3)] hover:shadow-[0_12px_35px_rgba(246,196,83,0.4)] transition-all duration-300"
        asChild
      >
        <Link 
          href={`/phim/${movieSlug}`}
          onClick={() => {
            analytics.trackWatchFilmButtonClick(movieName, movieSlug, 'Chi tiết', episodeSlug);
          }}
        >
          <Info className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
          <span>Chi tiết</span>
        </Link>
      </Button>
      <Button
        size="lg"
        variant="outline"
        className="border-[#F6C453]/40 text-white hover:bg-[#F6C453]/10 hover:border-[#F6C453] flex-1 sm:flex-none text-sm sm:text-base transition-all duration-300"
        asChild
      >
        <Link 
          href="/"
          onClick={() => {
            analytics.trackWatchFilmButtonClick(movieName, movieSlug, 'Trang chủ', episodeSlug);
          }}
        >
          <Home className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
          <span>Trang chủ</span>
        </Link>
      </Button>
    </div>
  );
}

