/**
 * Video Proxy Configuration using Cloudflare Workers
 * Helps bypass CORS restrictions and m3u8 blocking
 */

const CLOUDFLARE_WORKER_URL = 'https://proxy-pey.thanhtaidaiviet.workers.dev';

/**
 * Check if proxy is enabled
 */
function isProxyEnabled(): boolean {
  // In development, check environment variable
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_USE_VIDEO_PROXY !== 'false';
  }
  return true;
}

/**
 * Convert original M3U8 URL to proxied URL
 * @param originalUrl - The original M3U8 or video URL
 * @returns Proxied URL through Cloudflare Worker
 */
export function getProxiedUrl(originalUrl: string): string {
  if (!originalUrl) return '';
  
  try {
    // Check if proxy should be used
    if (!isProxyEnabled()) {
      console.log('[VIDEO PROXY] Proxy disabled, using original URL');
      return originalUrl;
    }

    const proxiedUrl = `${CLOUDFLARE_WORKER_URL}?url=${encodeURIComponent(originalUrl)}`;
    console.log('[VIDEO PROXY] Proxying URL:', {
      original: originalUrl,
      proxied: proxiedUrl
    });
    return proxiedUrl;
  } catch (error) {
    console.error('[VIDEO PROXY] Error creating proxied URL:', error);
    return originalUrl; // Fallback to original URL if something goes wrong
  }
}
