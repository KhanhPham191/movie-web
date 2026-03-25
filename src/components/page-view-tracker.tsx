'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView } from '@/lib/analytics';

/**
 * Component to track page views with device info for all pages
 * This will track device info whenever user visits any page on the website
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPathRef = useRef<string>('');

  useEffect(() => {
    if (!pathname) return;
    const query = searchParams?.toString();
    const pagePath = `${pathname}${query ? `?${query}` : ''}`;
    const pageLocation = typeof window !== 'undefined'
      ? `${window.location.origin}${pagePath}`
      : pagePath;

    // Trang xem phim: page_view (kèm movie/episode) do WatchFilmTracker gửi — tránh 2 page_view.
    if (pathname.startsWith('/xem-phim/')) {
      lastTrackedPathRef.current = pagePath;
      return;
    }

    // Track both first render and SPA route/query changes.
    if (lastTrackedPathRef.current !== pagePath) {
      trackPageView(pagePath, pageLocation);
      lastTrackedPathRef.current = pagePath;
    }
  }, [pathname, searchParams]);

  return null; // This component doesn't render anything
}

