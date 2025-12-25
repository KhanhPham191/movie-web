"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { analytics } from "@/lib/analytics";

interface FilmDetailCountryLinkProps {
  href: string;
  countryName: string;
  countrySlug: string;
  movieName: string;
  movieSlug: string;
}

export function FilmDetailCountryLink({ href, countryName, countrySlug, movieName, movieSlug }: FilmDetailCountryLinkProps) {
  return (
    <Link 
      href={href}
      onClick={() => {
        analytics.trackFilmDetailCountryClick(movieName, movieSlug, countryName, countrySlug);
      }}
    >
      <Badge
        variant="outline"
        className="bg-[#151515] border-[#F6C453]/30 text-white hover:border-[#F6C453] hover:bg-[#F6C453]/15 cursor-pointer transition-all rounded-full"
      >
        {countryName}
      </Badge>
    </Link>
  );
}

