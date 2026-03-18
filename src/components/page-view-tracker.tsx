'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/analytics';

/**
 * Component to track page views with device info for all pages
 * This will track device info whenever user visits any page on the website
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const lastTrackedPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    // Initial page_view is already sent in GoogleAnalytics script.
    // This tracker should only handle SPA route changes to avoid duplicates.
    if (lastTrackedPathRef.current === null) {
      lastTrackedPathRef.current = pathname;
      return;
    }

    if (lastTrackedPathRef.current !== pathname) {
      trackPageView(pathname);
      lastTrackedPathRef.current = pathname;
    }
  }, [pathname]);

  return null; // This component doesn't render anything
}

