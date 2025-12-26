// Google Analytics event tracking utility

import { detectDevice, type DeviceInfo } from './device-detection';

declare global {
  interface Window {
    gtag?: (
      command: 'event' | 'config' | 'js' | 'set',
      targetId: string | Date,
      config?: {
        [key: string]: any;
      }
    ) => void;
    dataLayer?: any[];
  }
}

export interface GAEvent {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: any;
}

/**
 * Track a custom event in Google Analytics
 */
export function trackEvent(eventName: string, params?: Record<string, any>) {
  if (typeof window !== 'undefined' && window.gtag) {
    // Add device info to all events
    const deviceInfo = detectDevice();
    window.gtag('event', eventName, {
      ...params,
      event_category: params?.event_category || 'engagement',
      event_label: params?.event_label || '',
      // Device info - để phân tích browser trên thiết bị nào
      device_type: deviceInfo.deviceType,
      platform: deviceInfo.platform,
      browser: deviceInfo.browser,
      is_mobile: deviceInfo.isMobile,
      is_tablet: deviceInfo.isTablet,
      is_desktop: deviceInfo.isDesktop,
      // Combined field để dễ filter trong GA: "mobile_chrome", "desktop_firefox", etc.
      device_browser: `${deviceInfo.deviceType}_${deviceInfo.browser}`,
      // Combined field với platform: "mobile_ios_safari", "desktop_windows_chrome", etc.
      device_platform_browser: `${deviceInfo.deviceType}_${deviceInfo.platform}_${deviceInfo.browser}`,
    });
  }
}

/**
 * Track page view with device info
 * Note: gtag('config') với page_path tự động track page view trong GA
 * Chúng ta chỉ cần update config với page_path, device info đã được set trong GoogleAnalytics component
 */
export function trackPageView(url: string) {
  if (typeof window !== 'undefined' && window.gtag) {
    // Update config với page_path - GA tự động track page view
    // Device info đã được set trong GoogleAnalytics component khi khởi tạo
    window.gtag('config', process.env.NEXT_PUBLIC_GA_ID || 'G-5GN4EFTX0Q', {
      page_path: url,
    });
  }
}

/**
 * Predefined event tracking functions for common actions
 */
export const analytics = {
  // Generic event tracking
  trackEvent: (eventName: string, params?: Record<string, any>) => {
    trackEvent(eventName, params);
  },

  // Movie/Content events
  trackMovieClick: (movieName: string, movieSlug: string, source?: string, isHome?: boolean, isFilmDetail?: boolean) => {
    let eventName = 'movie_click';
    if (isFilmDetail) {
      eventName = 'filmD_movie_click';
    } else if (isHome) {
      eventName = 'home_movie_click';
    }
    trackEvent(eventName, {
      event_category: 'content',
      event_label: movieName,
      movie_slug: movieSlug,
      source: source || 'home',
    });
  },

  trackWatchNow: (movieName: string, movieSlug: string, source?: string, isHome?: boolean, isFilmDetail?: boolean) => {
    let eventName = 'watch_now';
    if (isFilmDetail) {
      eventName = 'filmD_watch_now';
    } else if (isHome) {
      eventName = 'home_watch_now';
    }
    trackEvent(eventName, {
      event_category: 'content',
      event_label: movieName,
      movie_slug: movieSlug,
      source: source || 'home',
    });
  },

  trackMovieHover: (movieName: string, movieSlug: string, isHome?: boolean, isFilmDetail?: boolean) => {
    let eventName = 'movie_hover';
    if (isFilmDetail) {
      eventName = 'filmD_movie_hover';
    } else if (isHome) {
      eventName = 'home_movie_hover';
    }
    trackEvent(eventName, {
      event_category: 'engagement',
      event_label: movieName,
      movie_slug: movieSlug,
    });
  },

  // Navigation events
  trackNavigation: (destination: string, source?: string) => {
    trackEvent('navigation', {
      event_category: 'navigation',
      event_label: destination,
      source: source || 'header',
    });
  },

  trackCategoryClick: (categoryName: string, categorySlug: string, isHome?: boolean) => {
    const eventName = isHome ? 'home_category_click' : 'category_click';
    trackEvent(eventName, {
      event_category: 'navigation',
      event_label: categoryName,
      category_slug: categorySlug,
    });
  },

  trackGenreClick: (genreName: string, genreSlug: string, isHome?: boolean) => {
    const eventName = isHome ? 'home_genre_click' : 'genre_click';
    trackEvent(eventName, {
      event_category: 'navigation',
      event_label: genreName,
      genre_slug: genreSlug,
    });
  },

  trackCountryClick: (countryName: string, countrySlug: string, isHome?: boolean) => {
    const eventName = isHome ? 'home_country_click' : 'country_click';
    trackEvent(eventName, {
      event_category: 'navigation',
      event_label: countryName,
      country_slug: countrySlug,
    });
  },

  // Search events
  trackSearch: (query: string, resultCount?: number) => {
    trackEvent('search', {
      event_category: 'engagement',
      event_label: query,
      search_term: query,
      result_count: resultCount,
    });
  },

  trackSearchSuggestionClick: (query: string, movieName: string) => {
    trackEvent('search_suggestion_click', {
      event_category: 'engagement',
      event_label: movieName,
      search_term: query,
    });
  },

  // Section events
  trackSectionView: (sectionName: string) => {
    trackEvent('section_view', {
      event_category: 'engagement',
      event_label: sectionName,
    });
  },

  // User interaction events
  trackButtonClick: (buttonName: string, location?: string) => {
    trackEvent('button_click', {
      event_category: 'engagement',
      event_label: buttonName,
      location: location || 'unknown',
    });
  },

  trackReturnHomeLogo: () => {
    trackEvent('click_return_home_logo', {
      event_category: 'navigation',
      event_label: 'logo',
    });
  },

  trackDetailFilms: (movieName: string, movieSlug: string, location?: string, isFilmDetail?: boolean) => {
    const eventName = isFilmDetail ? 'filmD_click_detail_films' : 'click_detail_films';
    trackEvent(eventName, {
      event_category: 'content',
      event_label: movieName,
      movie_slug: movieSlug,
      location: location || 'unknown',
    });
  },

  // Film Detail page specific events
  trackFilmDetailPlayNow: (movieName: string, movieSlug: string, episodeSlug?: string) => {
    trackEvent('filmD_play_now', {
      event_category: 'content',
      event_label: movieName,
      movie_slug: movieSlug,
      episode_slug: episodeSlug,
    });
  },

  trackFilmDetailEpisodeClick: (movieName: string, movieSlug: string, episodeName: string, episodeSlug: string, serverName: string) => {
    trackEvent('filmD_episode_click', {
      event_category: 'content',
      event_label: episodeName,
      movie_slug: movieSlug,
      episode_slug: episodeSlug,
      server_name: serverName,
      movie_name: movieName,
    });
  },

  trackFilmDetailServerChange: (movieName: string, movieSlug: string, serverName: string) => {
    trackEvent('filmD_server_change', {
      event_category: 'engagement',
      event_label: serverName,
      movie_slug: movieSlug,
      movie_name: movieName,
    });
  },

  trackFilmDetailCategoryClick: (movieName: string, movieSlug: string, categoryName: string, categorySlug: string) => {
    trackEvent('filmD_category_click', {
      event_category: 'navigation',
      event_label: categoryName,
      category_slug: categorySlug,
      movie_slug: movieSlug,
      movie_name: movieName,
    });
  },

  trackFilmDetailGenreClick: (movieName: string, movieSlug: string, genreName: string, genreSlug: string) => {
    trackEvent('filmD_genre_click', {
      event_category: 'navigation',
      event_label: genreName,
      genre_slug: genreSlug,
      movie_slug: movieSlug,
      movie_name: movieName,
    });
  },

  trackFilmDetailCountryClick: (movieName: string, movieSlug: string, countryName: string, countrySlug: string) => {
    trackEvent('filmD_country_click', {
      event_category: 'navigation',
      event_label: countryName,
      country_slug: countrySlug,
      movie_slug: movieSlug,
      movie_name: movieName,
    });
  },

  trackFilmDetailSeriesClick: (movieName: string, movieSlug: string, seriesMovieName: string, seriesMovieSlug: string) => {
    trackEvent('filmD_series_click', {
      event_category: 'content',
      event_label: seriesMovieName,
      movie_slug: movieSlug,
      series_movie_slug: seriesMovieSlug,
      movie_name: movieName,
    });
  },

  trackLogin: (method?: string) => {
    trackEvent('login', {
      event_category: 'user',
      event_label: method || 'email',
    });
  },

  trackSignup: (method?: string) => {
    trackEvent('signup', {
      event_category: 'user',
      event_label: method || 'email',
    });
  },

  // Watch Film page specific events (wflim_ prefix)
  trackWatchFilmPageView: (movieName: string, movieSlug: string, episodeName: string, episodeSlug: string) => {
    trackEvent('wflim_page_view', {
      event_category: 'page',
      event_label: movieName,
      movie_slug: movieSlug,
      episode_name: episodeName,
      episode_slug: episodeSlug,
    });
  },

  trackWatchFilmPlay: (movieName: string, movieSlug: string, episodeSlug: string, currentTime?: number) => {
    trackEvent('wflim_play', {
      event_category: 'video',
      event_label: movieName,
      movie_slug: movieSlug,
      episode_slug: episodeSlug,
      current_time: currentTime,
    });
  },

  trackWatchFilmPause: (movieName: string, movieSlug: string, episodeSlug: string, currentTime?: number) => {
    trackEvent('wflim_pause', {
      event_category: 'video',
      event_label: movieName,
      movie_slug: movieSlug,
      episode_slug: episodeSlug,
      current_time: currentTime,
    });
  },

  trackWatchFilmSeek: (movieName: string, movieSlug: string, episodeSlug: string, fromTime: number, toTime: number) => {
    trackEvent('wflim_seek', {
      event_category: 'video',
      event_label: movieName,
      movie_slug: movieSlug,
      episode_slug: episodeSlug,
      from_time: fromTime,
      to_time: toTime,
      seek_duration: Math.abs(toTime - fromTime),
    });
  },

  trackWatchFilmVolumeChange: (movieName: string, movieSlug: string, episodeSlug: string, volume: number, isMuted: boolean) => {
    trackEvent('wflim_volume_change', {
      event_category: 'video',
      event_label: movieName,
      movie_slug: movieSlug,
      episode_slug: episodeSlug,
      volume: volume,
      is_muted: isMuted,
    });
  },

  trackWatchFilmFullscreen: (movieName: string, movieSlug: string, episodeSlug: string, isFullscreen: boolean) => {
    trackEvent('wflim_fullscreen', {
      event_category: 'video',
      event_label: movieName,
      movie_slug: movieSlug,
      episode_slug: episodeSlug,
      is_fullscreen: isFullscreen,
    });
  },

  trackWatchFilmSkip: (movieName: string, movieSlug: string, episodeSlug: string, seconds: number, currentTime: number) => {
    trackEvent('wflim_skip', {
      event_category: 'video',
      event_label: movieName,
      movie_slug: movieSlug,
      episode_slug: episodeSlug,
      skip_seconds: seconds,
      current_time: currentTime,
      direction: seconds > 0 ? 'forward' : 'backward',
    });
  },

  trackWatchFilmPlaybackRate: (movieName: string, movieSlug: string, episodeSlug: string, playbackRate: number) => {
    trackEvent('wflim_playback_rate', {
      event_category: 'video',
      event_label: movieName,
      movie_slug: movieSlug,
      episode_slug: episodeSlug,
      playback_rate: playbackRate,
    });
  },

  trackWatchFilmEpisodeNav: (movieName: string, movieSlug: string, fromEpisodeSlug: string, toEpisodeSlug: string, direction: 'prev' | 'next') => {
    trackEvent('wflim_episode_nav', {
      event_category: 'navigation',
      event_label: movieName,
      movie_slug: movieSlug,
      from_episode_slug: fromEpisodeSlug,
      to_episode_slug: toEpisodeSlug,
      direction: direction,
    });
  },

  trackWatchFilmEpisodeClick: (movieName: string, movieSlug: string, episodeName: string, episodeSlug: string, serverName: string) => {
    trackEvent('wflim_episode_click', {
      event_category: 'content',
      event_label: episodeName,
      movie_slug: movieSlug,
      episode_slug: episodeSlug,
      server_name: serverName,
      movie_name: movieName,
    });
  },

  trackWatchFilmServerChange: (movieName: string, movieSlug: string, serverName: string, episodeSlug: string) => {
    trackEvent('wflim_server_change', {
      event_category: 'engagement',
      event_label: serverName,
      movie_slug: movieSlug,
      episode_slug: episodeSlug,
      movie_name: movieName,
    });
  },

  trackWatchFilmRelatedClick: (movieName: string, movieSlug: string, relatedMovieName: string, relatedMovieSlug: string) => {
    trackEvent('wflim_related_click', {
      event_category: 'content',
      event_label: relatedMovieName,
      movie_slug: movieSlug,
      related_movie_slug: relatedMovieSlug,
      movie_name: movieName,
    });
  },

  trackWatchFilmButtonClick: (movieName: string, movieSlug: string, buttonName: string, episodeSlug: string) => {
    trackEvent('wflim_button_click', {
      event_category: 'engagement',
      event_label: buttonName,
      movie_slug: movieSlug,
      episode_slug: episodeSlug,
      movie_name: movieName,
    });
  },
};

