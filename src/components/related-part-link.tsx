"use client";

import Image from "next/image";
import Link from "next/link";
import { getImageUrl, type FilmItem } from "@/lib/api";
import { analytics } from "@/lib/analytics";

interface RelatedPartLinkProps {
  part: FilmItem;
  movieName: string;
  movieSlug: string;
}

export function RelatedPartLink({ part, movieName, movieSlug }: RelatedPartLinkProps) {
  return (
    <Link
      href={`/phim/${part.slug}`}
      onClick={() => {
        analytics.trackWatchFilmRelatedClick(movieName, movieSlug, part.name, part.slug);
      }}
      className="group relative aspect-[2/3] rounded-md sm:rounded-lg md:rounded-xl overflow-hidden bg-[#151515] border border-white/10 hover:border-[#F6C453]/60 transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105 hover:shadow-[0_12px_40px_rgba(246,196,83,0.4)]"
    >
      <Image
        src={getImageUrl(part.poster_url)}
        alt={part.name}
        fill
        className="object-cover transition-transform duration-300 group-hover:scale-110"
        sizes="(max-width: 475px) 50vw, (max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
        loading="lazy"
      />
      {/* Gradient overlay - luôn hiển thị một phần trên mobile */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Title overlay - luôn hiển thị trên mobile, hover trên desktop */}
      <div className="absolute bottom-0 left-0 right-0 p-1.5 sm:p-2 md:p-3 transform translate-y-0 sm:translate-y-full sm:group-hover:translate-y-0 transition-transform duration-300">
        <h3 className="text-[10px] xs:text-xs sm:text-sm font-semibold text-white line-clamp-2 leading-tight">
          {part.name}
        </h3>
        {part.current_episode && (
          <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-300 mt-0.5 sm:mt-1 line-clamp-1">
            {part.current_episode}
          </p>
        )}
      </div>
    </Link>
  );
}

