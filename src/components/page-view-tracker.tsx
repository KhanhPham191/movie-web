'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageView } from '@/lib/analytics';

/**
 * Component to track page views with device info for all pages
 * This will track device info whenever user visits any page on the website
 */
export function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      // Track page view with device info
      trackPageView(pathname);
    }
  }, [pathname]);

  return null; // This component doesn't render anything
}

