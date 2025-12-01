// Cloudflare Worker Proxy for video streaming
const CLOUDFLARE_WORKER_URL = 'https://proxypey.thanhtaidaiviet.workers.dev';

/**
 * Extract video URL from embed page through Cloudflare Worker
 */
export async function extractVideoFromEmbed(embedUrl: string): Promise<{
  success: boolean;
  videoUrl?: string;
  type?: string;
  error?: string;
}> {
  if (!embedUrl) {
    return { success: false, error: 'No embed URL provided' };
  }

  try {
    const proxyUrl = `${CLOUDFLARE_WORKER_URL}?extract=true&url=${encodeURIComponent(embedUrl)}`;
    const response = await fetch(proxyUrl);
    const data = await response.json();
    
    console.log('[VIDEO EXTRACT]', { embedUrl, result: data });
    
    return data;
  } catch (error: any) {
    console.error('[VIDEO EXTRACT] Error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Proxy video URL through Cloudflare Worker
 */
export function getProxiedVideoUrl(videoUrl: string): string {
  if (!videoUrl) return videoUrl;
  if (videoUrl.includes(CLOUDFLARE_WORKER_URL)) return videoUrl;
  
  return `${CLOUDFLARE_WORKER_URL}?url=${encodeURIComponent(videoUrl)}`;
}

/**
 * Proxy embed URL - dùng trực tiếp không qua proxy
 * Vì iframe không thể proxy qua Worker
 */
export function getProxiedEmbedUrl(embedUrl: string): string {
  // Trả về URL gốc vì embed đã cho phép iframe
  return embedUrl;
}

/**
 * Check if URL should be proxied
 */
export function shouldProxyUrl(url: string): boolean {
  if (!url) return false;
  if (url.includes(CLOUDFLARE_WORKER_URL)) return false;
  if (url.startsWith('/') || url.includes('localhost')) return false;
  return true;
}

/**
 * Get the Cloudflare Worker URL
 */
export function getProxyBaseUrl(): string {
  return CLOUDFLARE_WORKER_URL;
}

