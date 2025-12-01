/**
 * Development configuration for video testing
 * Use this to test video M3U8 URLs locally
 */

/**
 * Mock M3U8 URLs for local testing
 * Replace with real URLs when needed
 */
export const MOCK_M3U8_URLS = {
  // Sample HLS streams for testing
  'test-video-1': 'https://test-streams.mux.dev/x36xhzz/x3zzjt.m3u8',
  'test-video-2': 'https://commondatastorage.googleapis.com/gtv-videos-library/sample/BigBuckBunny.m3u8',
  'test-video-3': 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_fmp4/master.m3u8',
};

/**
 * Environment configuration
 */
export const VIDEO_CONFIG = {
  // Enable/disable proxy for local testing
  USE_PROXY: process.env.NEXT_PUBLIC_USE_VIDEO_PROXY !== 'false',
  
  // Use mock URLs for development
  USE_MOCK_DATA: process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true',
  
  // Cloudflare Worker URL
  WORKER_URL: 'https://proxypey.thanhtaidaiviet.workers.dev',
};

/**
 * Get a random mock M3U8 URL for testing
 */
export function getRandomMockM3u8(): string {
  const urls = Object.values(MOCK_M3U8_URLS);
  return urls[Math.floor(Math.random() * urls.length)];
}

/**
 * Get specific mock M3U8 by key
 */
export function getMockM3u8(key: string): string {
  return MOCK_M3U8_URLS[key as keyof typeof MOCK_M3U8_URLS] || getRandomMockM3u8();
}
