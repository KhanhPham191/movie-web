"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { analytics } from "@/lib/analytics";

interface FilmDetailTrackerProps {
  movieName: string;
  movieSlug: string;
}

export function FilmDetailTracker({ movieName, movieSlug }: FilmDetailTrackerProps) {
  const pathname = usePathname();
  
  useEffect(() => {
    // Track page view for film detail
    if (pathname?.startsWith('/phim/')) {
      analytics.trackEvent('filmD_page_view', {
        event_category: 'page',
        event_label: movieName,
        movie_slug: movieSlug,
      });
    }
  }, [pathname, movieName, movieSlug]);

  return null;
}

