/**
 * Device detection utility for analytics
 */

export interface DeviceInfo {
  deviceType: 'mobile' | 'tablet' | 'desktop';
  platform: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'other';
  browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'other';
  userAgent: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

/**
 * Detect device type from user agent
 */
export function detectDevice(): DeviceInfo {
  if (typeof window === 'undefined') {
    return {
      deviceType: 'desktop',
      platform: 'other',
      browser: 'other',
      userAgent: '',
      isMobile: false,
      isTablet: false,
      isDesktop: true,
    };
  }

  const userAgent = window.navigator.userAgent || '';
  const ua = userAgent.toLowerCase();

  // Detect device type
  const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/i.test(ua);
  const isTablet = /ipad|android(?!.*mobile)|tablet|playbook|silk/i.test(ua);
  const isDesktop = !isMobile && !isTablet;

  let deviceType: 'mobile' | 'tablet' | 'desktop' = 'desktop';
  if (isMobile) deviceType = 'mobile';
  else if (isTablet) deviceType = 'tablet';

  // Detect platform
  let platform: 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'other' = 'other';
  if (/iphone|ipad|ipod/i.test(ua)) platform = 'ios';
  else if (/android/i.test(ua)) platform = 'android';
  else if (/win/i.test(ua)) platform = 'windows';
  else if (/mac/i.test(ua)) platform = 'macos';
  else if (/linux/i.test(ua)) platform = 'linux';

  // Detect browser
  let browser: 'chrome' | 'firefox' | 'safari' | 'edge' | 'opera' | 'other' = 'other';
  if (/edg/i.test(ua)) browser = 'edge';
  else if (/opr|opera/i.test(ua)) browser = 'opera';
  else if (/chrome/i.test(ua) && !/edg/i.test(ua)) browser = 'chrome';
  else if (/firefox/i.test(ua)) browser = 'firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'safari';

  return {
    deviceType,
    platform,
    browser,
    userAgent,
    isMobile,
    isTablet,
    isDesktop,
  };
}

/**
 * Get device info as string for analytics
 */
export function getDeviceInfoString(): string {
  const device = detectDevice();
  return `${device.deviceType}_${device.platform}_${device.browser}`;
}

/**
 * Get simplified device type for analytics
 */
export function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  return detectDevice().deviceType;
}

