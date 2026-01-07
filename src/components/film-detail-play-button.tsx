"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analytics } from "@/lib/analytics";

interface FilmDetailPlayButtonProps {
  href: string;
  movieName: string;
  movieSlug: string;
  episodeSlug?: string;
}

export function FilmDetailPlayButton({ href, movieName, movieSlug, episodeSlug }: FilmDetailPlayButtonProps) {
  return (
    <Link
      href={href}
      className="inline-flex w-full sm:w-auto"
      onClick={() => {
        analytics.trackFilmDetailPlayNow(movieName, movieSlug, episodeSlug);
      }}
    >
      <Button
        size="lg"
        className="relative group/btn bg-gradient-to-r from-[#F6C453] to-[#D3A13A] hover:from-[#F6C453]/90 hover:to-[#D3A13A]/90 text-white font-bold text-xs sm:text-sm md:text-base px-4 sm:px-6 md:px-8 h-9 sm:h-11 md:h-12 rounded-full shadow-[0_18px_40px_rgba(246,196,83,0.4)] hover:shadow-[0_24px_50px_rgba(246,196,83,0.5)] transition-all duration-300 w-full sm:w-auto border border-[#F6C453]/30 cursor-pointer"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full opacity-0 group-hover/btn:opacity-100 transition-opacity" />
        <Play className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1.5 sm:mr-2 fill-white" />
        <span className="relative z-10">Phát ngay</span>
      </Button>
    </Link>
  );
}

