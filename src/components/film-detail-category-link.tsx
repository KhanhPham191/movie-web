"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { analytics } from "@/lib/analytics";

interface FilmDetailCategoryLinkProps {
  href: string;
  categoryName: string;
  categorySlug: string;
  movieName: string;
  movieSlug: string;
}

export function FilmDetailCategoryLink({ href, categoryName, categorySlug, movieName, movieSlug }: FilmDetailCategoryLinkProps) {
  return (
    <Link 
      href={href}
      onClick={() => {
        analytics.trackFilmDetailCategoryClick(movieName, movieSlug, categoryName, categorySlug);
      }}
    >
      <Badge
        variant="outline"
        className="bg-[#151515] border-[#F6C453]/30 text-white hover:border-[#F6C453] hover:bg-[#F6C453]/15 cursor-pointer transition-all rounded-full"
      >
        {categoryName}
      </Badge>
    </Link>
  );
}

