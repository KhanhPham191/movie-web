'use client';

import Script from 'next/script';

export function GoogleAnalytics({ gaId }: { gaId: string }) {
  if (process.env.NODE_ENV !== 'production') return null;

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
            
            gtag('config', '${gaId}', {
              // Use persisted client_id so GA recognizes returning users
              client_id: clientId,
              // Cookie configuration for better persistence
              cookie_domain: 'auto',
              cookie_expires: 63072000, // 2 years in seconds
              cookie_flags: 'SameSite=Lax;Secure',
              cookie_update: true,
              // Disable auto page_view — PageViewTracker handles SPA navigations
              send_page_view: false,
              // Custom dimension to track returning status from localStorage
              user_type: isReturning ? 'returning' : 'new',
            });

            // Trang xem phim: page_view do WatchFilmTracker gửi (kèp tham số phim/tập), tránh đếm đôi
            if (!window.location.pathname.startsWith('/xem-phim/')) {
              gtag('event', 'page_view', {
                page_path: window.location.pathname,
                page_title: document.title,
                user_type: isReturning ? 'returning' : 'new',
              });
            }
          `,
        }}
      />
    </>
  );
}

