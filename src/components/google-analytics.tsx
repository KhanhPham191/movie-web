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
              device_type: deviceType,
              platform: platform,
              browser: browser,
              is_mobile: isMobile,
              is_tablet: isTablet,
              is_desktop: isDesktop,
            });
          `,
        }}
      />
    </>
  );
}

