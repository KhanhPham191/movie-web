'use client';

import Script from 'next/script';

export function GoogleAnalytics({ gaId }: { gaId: string }) {
  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            
            // Persist client_id in localStorage as fallback for cookie loss
            // This ensures returning users are recognized even if _ga cookie is cleared
            function getOrCreateClientId() {
              var storageKey = 'ga_client_id';
              var storedId = null;
              try {
                storedId = localStorage.getItem(storageKey);
              } catch(e) {}
              
              if (storedId) return storedId;
              
              // Generate a new client_id in GA4 format: random.timestamp
              var newId = Math.floor(Math.random() * 2147483647) + '.' + Math.floor(Date.now() / 1000);
              try {
                localStorage.setItem(storageKey, newId);
              } catch(e) {}
              return newId;
            }
            
            var clientId = getOrCreateClientId();
            
            // Track first visit time to distinguish new vs returning
            var firstVisitKey = 'ga_first_visit';
            var isReturning = false;
            try {
              var firstVisit = localStorage.getItem(firstVisitKey);
              if (firstVisit) {
                isReturning = true;
              } else {
                localStorage.setItem(firstVisitKey, new Date().toISOString());
              }
            } catch(e) {}
            
            // Detect device info
            const ua = navigator.userAgent.toLowerCase();
            const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua);
            const isTablet = /ipad|android(?!.*mobile)|tablet|playbook|silk/i.test(ua);
            const isDesktop = !isMobile && !isTablet;
            let deviceType = 'desktop';
            if (isMobile) deviceType = 'mobile';
            else if (isTablet) deviceType = 'tablet';
            
            let platform = 'other';
            if (/iphone|ipad|ipod/i.test(ua)) platform = 'ios';
            else if (/android/i.test(ua)) platform = 'android';
            else if (/win/i.test(ua)) platform = 'windows';
            else if (/mac/i.test(ua)) platform = 'macos';
            else if (/linux/i.test(ua)) platform = 'linux';
            
            let browser = 'other';
            if (/edg/i.test(ua)) browser = 'edge';
            else if (/opr|opera/i.test(ua)) browser = 'opera';
            else if (/chrome/i.test(ua) && !/edg/i.test(ua)) browser = 'chrome';
            else if (/firefox/i.test(ua)) browser = 'firefox';
            else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'safari';
            
            gtag('config', '${gaId}', {
              // Use persisted client_id so GA recognizes returning users
              client_id: clientId,
              // Cookie configuration for better persistence
              cookie_domain: 'auto',
              cookie_expires: 63072000, // 2 years in seconds
              cookie_flags: 'SameSite=None;Secure',
              cookie_update: true,
              // Device info
              device_type: deviceType,
              platform: platform,
              browser: browser,
              is_mobile: isMobile,
              is_tablet: isTablet,
              is_desktop: isDesktop,
              // Custom dimension to track returning status from localStorage
              user_type: isReturning ? 'returning' : 'new',
            });
          `,
        }}
      />
    </>
  );
}

