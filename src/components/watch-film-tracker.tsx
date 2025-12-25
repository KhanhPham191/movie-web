"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { analytics } from "@/lib/analytics";

interface WatchFilmTrackerProps {
  movieName: string;
  movieSlug: string;
  episodeName: string;
  episodeSlug: string;
}

export function WatchFilmTracker({ movieName, movieSlug, episodeName, episodeSlug }: WatchFilmTrackerProps) {
  const pathname = usePathname();
  
  useEffect(() => {
    // Track page view for watch film page
    if (pathname?.startsWith('/xem-phim/')) {
      analytics.trackWatchFilmPageView(movieName, movieSlug, episodeName, episodeSlug);
    }
  }, [pathname, movieName, movieSlug, episodeName, episodeSlug]);

  return null;
}

