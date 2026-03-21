// API Types based on OPhim (https://ophim.live/)

export interface FilmCategory {
  id: string;
  name: string;
  slug: string;
}

export interface FilmItem {
  id: string;
  name: string;
  slug: string;
  original_name: string;
  thumb_url: string;
  poster_url: string;
  created: string;
  modified: string;
  // Some APIs return year as number, others as string; keep flexible
  year?: number | string;
  description: string;
  total_episodes: number;
  current_episode: string;
  time: string;
  quality: string;
  language: string;
  // Optional rating fields (not always present in API)
  imdb?: number | string;
  tmdb?: number | string;
  vote_average?: number;
  director: string;
  casts: string;
  category: FilmCategory[];
  country: FilmCategory[];
  // Phim chiếu rạp
  chieurap?: boolean;
}

export interface FilmDetail extends FilmItem {
  // episodes có thể không tồn tại hoặc rỗng, nên để là optional
  episodes?: Episode[];
}

export interface Episode {
  server_name: string;
  items: EpisodeItem[];
}

export interface EpisodeItem {
  name: string;
  slug: string;
  embed: string;
  m3u8: string;
}

export interface FilmListResponse {
  status: string;
  message?: string; // Optional message for error cases
  items: FilmItem[];
  paginate: {
    current_page: number;
    total_page: number;
    total_items: number;
    items_per_page: number;
  };
}

export interface FilmDetailResponse {
  status: string;
  message?: string; // Optional message for error cases
  movie?: FilmDetail; // Optional movie for error cases
}

// OPhim API base URL
// Primary: ophim1.com, Fallback: ophim17.cc, ophim18.cc
export const OPHIM_BASE = "https://ophim1.com";
const OPHIM_CDN = "https://img.ophim.live/uploads/movies";

// Fallback bases for resilience
const OPHIM_FALLBACKS = [
  "https://ophim17.cc",
  "https://ophim18.cc",
];

// OPhim API response interfaces
interface OPhimItem {
  _id: string;
  name: string;
  slug: string;
  origin_name: string;
  thumb_url: string;
  poster_url: string;
  created?: { time: string };
  modified?: { time: string };
  content?: string;
  description?: string;
  episode_current?: string;
  episode_total?: number;
  total_episodes?: number; // Alternative name for episode_total
  episodes?: Array<{
    server_name: string;
    server_data: Array<{
      name: string;
      slug: string;
      filename?: string;
      link_embed?: string;
      link_m3u8?: string;
    }>;
  }>;
  time?: string;
  quality?: string;
  lang?: string;
  language?: string;
  year?: number;
  imdb?: { id?: string } | string | number;
  tmdb?: { id?: string; vote_average?: number } | string | number;
  vote_average?: number;
  category?: Array<{ _id?: string; id?: string; name: string; slug: string }>;
  country?: Array<{ _id?: string; id?: string; name: string; slug: string }>;
  director?: string | string[];
  actor?: string[];
  casts?: string;
  type?: string;
  status?: string;
  view?: number;
  chieurap?: boolean | number;
}

// OPhim list response (wrapped format)
interface OPhimListResponse {
  status: boolean;
  message?: string;
  msg?: string;
  data?: {
    items: OPhimItem[];
    params?: any;
    pagination?: {
      totalItems: number;
      totalItemsPerPage: number;
      currentPage: number;
      totalPages: number;
    };
  };
  items?: OPhimItem[];
  pagination?: {
    totalItems: number;
    totalItemsPerPage: number;
    currentPage: number;
    totalPages: number;
  };
  pathImage?: string;
}

// OPhim detail response
interface OPhimDetailResponse {
  status: boolean;
  message?: string;
  msg?: string;
  data?: {
    item?: OPhimItem;
  };
  movie?: OPhimItem;
}

// Helper to normalize image URL from OPhim
function normalizeOPhimImageUrl(url: string, useWebP: boolean = true): string {
  if (!url) return "";
  let normalizedUrl: string;
  
  if (url.startsWith("http://") || url.startsWith("https://")) {
    normalizedUrl = url;
  } else if (url.startsWith("/")) {
    normalizedUrl = `${OPHIM_CDN}${url}`;
  } else {
    normalizedUrl = `${OPHIM_CDN}/${url}`;
  }

  // Chuyển đổi sang WebP nếu useWebP = true
  if (useWebP) {
    return convertImageToWebP(normalizedUrl);
  }
  
  return normalizedUrl;
}

// Helper to convert OPhim item to FilmItem
function convertOPhimItemToFilmItem(item: OPhimItem): FilmItem {
  const thumbUrl = item.thumb_url || item.poster_url || "";
  const posterUrl = item.poster_url || item.thumb_url || "";

  // Normalize rating fields (có thể là object hoặc scalar)
  const normalizeRating = (value: any): string | number => {
    if (value == null) return "";
    if (typeof value === "number" || typeof value === "string") return value;
    if (typeof value === "object") {
      if (value.vote_average != null) return value.vote_average;
      if (value.id != null) return value.id;
    }
    return "";
  };
  const imdb = normalizeRating(item.imdb);
  const tmdb = normalizeRating(item.tmdb);
  
  // Normalize chieurap (có thể là boolean hoặc number 1/0)
  const chieurap = item.chieurap !== undefined 
    ? (typeof item.chieurap === 'boolean' ? item.chieurap : item.chieurap === 1)
    : undefined;

  // OPhim uses `actor[]` for casts, `episode_total` for total_episodes
  // `lang` or `language` for language
  const casts = Array.isArray(item.actor) ? item.actor.join(", ") : (item.casts || "");
  const language = item.lang || item.language || "";
  const totalEpisodes = item.episode_total || item.total_episodes || 0;

  return {
    id: item._id,
    name: item.name,
    slug: item.slug,
    original_name: item.origin_name || item.name,
    thumb_url: normalizeOPhimImageUrl(thumbUrl),
    poster_url: normalizeOPhimImageUrl(posterUrl),
    created: item.created?.time || "",
    modified: item.modified?.time || "",
    year: item.year,
    description: item.content || item.description || "",
    total_episodes: totalEpisodes,
    current_episode: item.episode_current || "",
    time: item.time || "",
    quality: item.quality || "",
    language: language,
    imdb,
    tmdb,
    vote_average: item.vote_average,
    director: Array.isArray(item.director) ? item.director.join(", ") : (item.director || ""),
    casts: casts,
    category: (item.category || []).map((cat) => ({
      id: cat._id || cat.id || cat.slug,
      name: cat.name,
      slug: cat.slug,
    })),
    country: (item.country || []).map((c) => ({
      id: c._id || c.id || c.slug,
      name: c.name,
      slug: c.slug,
    })),
    chieurap,
  };
}

// Fetch from OPhim API (with fallback support)
async function fetchOPhimAPI<T>(endpoint: string, baseOverride?: string): Promise<T> {
  const isBrowser = typeof window !== "undefined";
  const base = baseOverride || OPHIM_BASE;
  
  // Determine the full endpoint URL based on OPhim patterns
  let fullUrl = endpoint;
  if (!endpoint.startsWith("http")) {
    fullUrl = `${base}${endpoint}`;
  }
  
  // When on client, always use proxy to avoid CORS & User-Agent blocking
  const url = isBrowser
    ? `/movpey/ophim?endpoint=${encodeURIComponent(fullUrl)}`
    : fullUrl;
  
  const cacheKey = url;
  
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey) as Promise<T>;
  }
  
  const fetchPromise = (async () => {
    try {
      const timeoutMs = 8000;
      const headers = isBrowser
        ? { Accept: "application/json", "Accept-Language": "vi,en;q=0.9" }
        : DEFAULT_FETCH_HEADERS;

      const res = await Promise.race([
        fetch(url, {
          ...(isBrowser ? {} : { next: { revalidate: 7200 } }),
          headers,
        }),
        createTimeoutPromise(timeoutMs),
      ]) as Response;

      if (!res.ok) {
        // Try fallback endpoint if available
        if (!baseOverride && OPHIM_FALLBACKS.length > 0) {
          return fetchOPhimAPI<T>(endpoint, OPHIM_FALLBACKS[0]);
        }
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      return data;
    } catch (error) {
      // Try fallback endpoint on error
      if (!baseOverride && OPHIM_FALLBACKS.length > 0) {
        return fetchOPhimAPI<T>(endpoint, OPHIM_FALLBACKS[0]).catch(() => {
          throw error;
        });
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(errorMessage);
    }
  })();
  
  fetchPromise.finally(() => {
    setTimeout(() => {
      requestCache.delete(cacheKey);
    }, 30000);
  });
  
  requestCache.set(cacheKey, fetchPromise);
  return fetchPromise;
}

// Helper to extract items and pagination from OPhim response (handles both wrapped and direct formats)
function normalizeOPhimListResponse(response: any): { items: OPhimItem[]; pagination: any } {
  // OPhim API returns different structures:
  // Format 1 (wrapped): { status, data: { items, pagination } }
  // Format 2 (direct): { status, items, pagination, pathImage }
  
  if (response.data?.items) {
    return {
      items: response.data.items || [],
      pagination: response.data.pagination || response.data.params?.pagination || {},
    };
  }
  
  if (response.items) {
    return {
      items: response.items || [],
      pagination: response.pagination || {},
    };
  }
  
  return { items: [], pagination: {} };
}

export const DEFAULT_FETCH_HEADERS: HeadersInit = {
  "User-Agent": "Mozilla/5.0 (compatible; Phim7Bot/1.0; +https://phim7.xyz)",
  Accept: "application/json",
  "Accept-Language": "vi,en;q=0.9",
};

// Request cache để tránh duplicate calls trong cùng một request cycle
const requestCache = new Map<string, Promise<any>>();

// Helper function để tạo timeout promise
function createTimeoutPromise(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });
}

// OPhim API is the primary data source for all film data

// Get films by genre - using OPhim API
export async function getFilmsByGenre(
  slug: string,
  page: number = 1,
  options?: {
    country?: string;
    year?: number;
    sort_field?: string;
    sort_type?: string;
    sort_lang?: string;
    limit?: number;
  }
): Promise<FilmListResponse> {
  try {
    // Build query parameters for OPhim
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(options?.limit || 24));
    
    if (options?.sort_field) {
      params.append('sort_field', options.sort_field);
    }
    if (options?.sort_type) {
      params.append('sort_type', options.sort_type);
    }
    if (options?.country) {
      params.append('country', options.country);
    }
    if (options?.year) {
      params.append('year', String(options.year));
    }
    
    // OPhim endpoint: /v1/api/the-loai/{slug}
    const response = await fetchOPhimAPI<OPhimListResponse>(
      `/v1/api/the-loai/${slug}?${params.toString()}`
    );
    
    // Check if request was successful
    if (!response.status) {
      return {
        status: "error",
        message: response.message || response.msg || "Failed to fetch films",
        items: [],
        paginate: {
          current_page: 1,
          total_page: 1,
          total_items: 0,
          items_per_page: 10,
        },
      };
    }
    
    // Normalize response (handles different OPhim response formats)
    const { items, pagination } = normalizeOPhimListResponse(response);
    
    if (!items || items.length === 0) {
      return {
        status: "error",
        message: "No films found",
        items: [],
        paginate: {
          current_page: pagination?.currentPage || 1,
          total_page: pagination?.totalPages || 1,
          total_items: pagination?.totalItems || 0,
          items_per_page: pagination?.totalItemsPerPage || 24,
        },
      };
    }
    
    // Convert OPhim items to FilmItem format
    const convertedItems = items.map(convertOPhimItemToFilmItem);
    
    return {
      status: "success",
      items: convertedItems,
      paginate: {
        current_page: pagination?.currentPage || page,
        total_page: pagination?.totalPages || 1,
        total_items: pagination?.totalItems || items.length,
        items_per_page: pagination?.totalItemsPerPage || 24,
      },
    };
  } catch (error) {
    // console.error("[API] Error fetching films by genre:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
      items: [],
      paginate: {
        current_page: 1,
        total_page: 1,
        total_items: 0,
        items_per_page: 10,
      },
    };
  }
}

// Get films by category - using OPhim API
export async function getFilmsByCategory(
  slug: string,
  page: number = 1,
  options?: {
    category?: string;
    country?: string;
    year?: number;
    sort_field?: string;
    sort_type?: string;
    sort_lang?: string;
    limit?: number;
    // Filter chỉ lấy phim chiếu rạp (nếu backend hỗ trợ)
    chieurap?: boolean;
  }
): Promise<FilmListResponse> {
  try {
    // Build query parameters for OPhim
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(options?.limit || 24));
    
    if (options?.sort_field) {
      params.append('sort_field', options.sort_field);
    }
    if (options?.sort_type) {
      params.append('sort_type', options.sort_type);
    }
    if (options?.category) {
      params.append('category', options.category);
    }
    if (options?.country) {
      params.append('country', options.country);
    }
    if (options?.year) {
      params.append('year', String(options.year));
    }
    // Map chieurap to query param (1/0) for API
    if (typeof options?.chieurap === "boolean") {
      params.append("chieurap", options.chieurap ? "1" : "0");
    }
    
    // OPhim endpoint: /v1/api/danh-sach/{type}
    const response = await fetchOPhimAPI<OPhimListResponse>(
      `/v1/api/danh-sach/${slug}?${params.toString()}`
    );
    
    // Check if request was successful
    if (!response.status) {
      return {
        status: "error",
        message: response.message || response.msg || "Failed to fetch films",
        items: [],
        paginate: {
          current_page: 1,
          total_page: 1,
          total_items: 0,
          items_per_page: 10,
        },
      };
    }
    
    // Normalize response
    const { items, pagination } = normalizeOPhimListResponse(response);
    
    if (!items || items.length === 0) {
      return {
        status: "error",
        message: "No films found",
        items: [],
        paginate: {
          current_page: pagination?.currentPage || 1,
          total_page: pagination?.totalPages || 1,
          total_items: pagination?.totalItems || 0,
          items_per_page: pagination?.totalItemsPerPage || 24,
        },
      };
    }
    
    // Convert OPhim items to FilmItem format
    const convertedItems = items.map(convertOPhimItemToFilmItem);
    
    return {
      status: "success",
      items: convertedItems,
      paginate: {
        current_page: pagination?.currentPage || page,
        total_page: pagination?.totalPages || 1,
        total_items: pagination?.totalItems || items.length,
        items_per_page: pagination?.totalItemsPerPage || 24,
      },
    };
  } catch (error) {
    // console.error("[API] Error fetching films by category:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
      items: [],
      paginate: {
        current_page: 1,
        total_page: 1,
        total_items: 0,
        items_per_page: 10,
      },
    };
  }
}

// Get films by category - multiple pages
export async function getFilmsByCategoryMultiple(
  slug: string,
  pages: number = 3,
  options?: {
    category?: string;
    country?: string;
    year?: number;
    sort_field?: string;
    sort_type?: string;
    sort_lang?: string;
    limit?: number;
    chieurap?: boolean;
  }
): Promise<FilmItem[]> {
  return getMultiplePages((page) => getFilmsByCategory(slug, page, options), pages);
}

// Get films by country - using OPhim API
export async function getFilmsByCountry(
  slug: string,
  page: number = 1,
  options?: {
    category?: string;
    year?: number;
    sort_field?: string;
    sort_type?: string;
    sort_lang?: string;
    limit?: number;
  }
): Promise<FilmListResponse> {
  try {
    // Build query parameters for OPhim
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(options?.limit || 24));
    
    if (options?.sort_field) {
      params.append('sort_field', options.sort_field);
    }
    if (options?.sort_type) {
      params.append('sort_type', options.sort_type);
    }
    if (options?.category) {
      params.append('category', options.category);
    }
    if (options?.year) {
      params.append('year', String(options.year));
    }
    
    // OPhim endpoint: /v1/api/quoc-gia/{slug}
    const response = await fetchOPhimAPI<OPhimListResponse>(
      `/v1/api/quoc-gia/${slug}?${params.toString()}`
    );
    
    // Check if request was successful
    if (!response.status) {
      return {
        status: "error",
        message: response.message || response.msg || "Failed to fetch films",
        items: [],
        paginate: {
          current_page: 1,
          total_page: 1,
          total_items: 0,
          items_per_page: 10,
        },
      };
    }
    
    // Normalize response
    const { items, pagination } = normalizeOPhimListResponse(response);
    
    if (!items || items.length === 0) {
      return {
        status: "error",
        message: "No films found",
        items: [],
        paginate: {
          current_page: pagination?.currentPage || 1,
          total_page: pagination?.totalPages || 1,
          total_items: pagination?.totalItems || 0,
          items_per_page: pagination?.totalItemsPerPage || 24,
        },
      };
    }
    
    // Convert OPhim items to FilmItem format
    const convertedItems = items.map(convertOPhimItemToFilmItem);
    
    return {
      status: "success",
      items: convertedItems,
      paginate: {
        current_page: pagination?.currentPage || page,
        total_page: pagination?.totalPages || 1,
        total_items: pagination?.totalItems || items.length,
        items_per_page: pagination?.totalItemsPerPage || 24,
      },
    };
  } catch (error) {
    // console.error("[API] Error fetching films by country:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
      items: [],
      paginate: {
        current_page: 1,
        total_page: 1,
        total_items: 0,
        items_per_page: 10,
      },
    };
  }
}

// Get films by country - multiple pages
export async function getFilmsByCountryMultiple(
  slug: string,
  pages: number = 3,
  options?: {
    category?: string;
    year?: number;
    sort_field?: string;
    sort_type?: string;
    sort_lang?: string;
    limit?: number;
  }
): Promise<FilmItem[]> {
  return getMultiplePages((page) => getFilmsByCountry(slug, page, options), pages);
}

// Get all films by country - automatically fetches all available pages
export async function getFilmsByCountryAll(
  slug: string
): Promise<FilmItem[]> {
  try {
    // First, fetch page 1 to get total_page
    const firstPage = await getFilmsByCountry(slug, 1);
    
    // Check if response is error or has no items
    if (firstPage.status === "error" || !firstPage.items || firstPage.items.length === 0) {
      // console.warn(`[API] No items found for country ${slug} or error status:`, firstPage.status);
      return [];
    }
    
    const totalPages = firstPage.paginate?.total_page || 1;
    
    // If only 1 page, return immediately
    if (totalPages === 1) {
      return firstPage.items || [];
    }
    
    // Limit to reasonable number of pages to avoid timeout
    const MAX_PAGES = 50;
    const pagesToFetch = Math.min(totalPages, MAX_PAGES);
    
    // Fetch all remaining pages (2 to pagesToFetch)
    const allResults: FilmItem[] = [...(firstPage.items || [])];
    
    // Batch requests: fetch tối đa 5 pages cùng lúc để tăng tốc độ
    const BATCH_SIZE = 5;
    const remainingPages = pagesToFetch - 1;
    
    for (let i = 0; i < remainingPages; i += BATCH_SIZE) {
      const batchPromises = Array.from(
        { length: Math.min(BATCH_SIZE, remainingPages - i) },
        (_, j) => {
          const pageNum = i + j + 2;
          return getFilmsByCountry(slug, pageNum).catch((err) => {
            // console.warn(`[API] Error fetching country ${slug} page ${pageNum}:`, err);
            return null;
          });
        }
      );
      
      const batchResults = await Promise.all(batchPromises);
      const validBatchResults = batchResults.filter(
        (r): r is FilmListResponse => 
          r !== null && 
          r.status !== "error" && 
          r.items && 
          r.items.length > 0
      );
      
      for (const result of validBatchResults) {
        allResults.push(...(result.items || []));
      }
    }
    
    return allResults;
  } catch (error) {
    // console.error("[API] Error fetching all country pages:", error);
    return [];
  }
}

// Get film detail by slug - using OPhim API
export async function getFilmDetail(slug: string): Promise<FilmDetailResponse> {
  try {
    const response = await fetchOPhimAPI<OPhimDetailResponse>(`/v1/api/phim/${slug}`);
    
    // Check if request was successful
    if (!response.status) {
      return {
        status: "error",
        message: response.message || response.msg || "Failed to fetch film detail",
      };
    }
    
    // OPhim wraps detail response in data.item
    const item = response.data?.item || (response as any).item;
    if (!item) {
      return {
        status: "error",
        message: "Film not found",
      };
    }
    
    // Convert OPhim item to FilmItem
    const filmItem = convertOPhimItemToFilmItem(item);
    
    // Convert episodes if available
    const episodes: Episode[] = (item.episodes || []).map((ep: any) => {
      // Map server_name: fallback to lang if server_name is generic (like "Subteam #1")
      let mappedServerName = ep.server_name || "";
      const isGenericServerName = 
        mappedServerName.toLowerCase().includes("subteam") ||
        mappedServerName.toLowerCase().includes("server");
      
      // If server name is generic, use lang information to create a better name
      if (isGenericServerName && item.lang) {
        const langName = String(item.lang).toLowerCase().trim();
        if (langName.includes("vietsub") || langName.includes("subtitle")) {
          mappedServerName = `Vietsub - ${ep.server_name}`;
        } else if (langName.includes("thuyết") || langName.includes("thuyet") || 
                   langName.includes("voice") || langName.includes("vo")) {
          mappedServerName = `Thuyết minh - ${ep.server_name}`;
        } else if (langName.includes("lồng") || langName.includes("long") || langName.includes("dubbing")) {
          mappedServerName = `Lồng tiếng - ${ep.server_name}`;
        }
      }
      
      return {
        server_name: mappedServerName,
        items: (ep.server_data || []).map((episodeItem: any, index: number) => {
          // Generate proper slug if API returns just a number
          let episodeSlug = episodeItem.slug;
          if (typeof episodeSlug === 'number' || /^\d+$/.test(String(episodeSlug))) {
            episodeSlug = `tap-${episodeSlug}`;
          }
          // If slug is still invalid (empty or whitespace), generate from index
          if (!episodeSlug || typeof episodeSlug !== 'string' || episodeSlug.trim() === '') {
            episodeSlug = `tap-${index + 1}`;
          }
          
          return {
            name: episodeItem.name,
            slug: episodeSlug,
            embed: episodeItem.link_embed || "",
            m3u8: episodeItem.link_m3u8 || "",
          };
        }),
      };
    });
    
    return {
      status: "success",
      movie: {
        ...filmItem,
        description: item.content || filmItem.description,
        episodes: episodes.length > 0 ? episodes : undefined,
      },
    };
  } catch (error) {
    // console.error("[API] Error fetching film detail:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Search films - using OPhim API
// OPhim endpoint: /v1/api/tim-kiem?keyword=[keyword]
export async function searchFilms(
  keyword: string,
  page: number = 1,
  options?: {
    sort_field?: string;
    sort_type?: string;
    sort_lang?: string;
    category?: string;
    country?: string;
    year?: number;
    limit?: number;
  }
): Promise<FilmListResponse> {
  try {
    // Build query parameters for OPhim
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(options?.limit || 24));
    
    if (options?.sort_field) {
      params.append('sort_field', options.sort_field);
    }
    if (options?.sort_type) {
      params.append('sort_type', options.sort_type);
    }
    if (options?.category) {
      params.append('category', options.category);
    }
    if (options?.country) {
      params.append('country', options.country);
    }
    if (options?.year) {
      params.append('year', String(options.year));
    }
    
    // OPhim endpoint: /v1/api/tim-kiem?keyword={keyword}
    const encodedKeyword = encodeURIComponent(keyword);
    params.set('keyword', encodedKeyword);
    const response = await fetchOPhimAPI<OPhimListResponse>(
      `/v1/api/tim-kiem?${params.toString()}`
    );
    
    // Check if request was successful
    if (!response.status) {
      return {
        status: "error",
        message: response.message || response.msg || "Failed to search films",
        items: [],
        paginate: {
          current_page: 1,
          total_page: 1,
          total_items: 0,
          items_per_page: 10,
        },
      };
    }
    
    // Normalize response
    const { items, pagination } = normalizeOPhimListResponse(response);
    
    if (!items || items.length === 0) {
      return {
        status: "error",
        message: "No films found",
        items: [],
        paginate: {
          current_page: pagination?.currentPage || 1,
          total_page: pagination?.totalPages || 1,
          total_items: pagination?.totalItems || 0,
          items_per_page: pagination?.totalItemsPerPage || 24,
        },
      };
    }
    
    // Convert OPhim items to FilmItem format
    const convertedItems = items.map(convertOPhimItemToFilmItem);
    
    return {
      status: "success",
      items: convertedItems,
      paginate: {
        current_page: pagination?.currentPage || page,
        total_page: pagination?.totalPages || 1,
        total_items: pagination?.totalItems || items.length,
        items_per_page: pagination?.totalItemsPerPage || 24,
      },
    };
  } catch (error) {
    // console.error("[API] Error searching films:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
      items: [],
      paginate: {
        current_page: 1,
        total_page: 1,
        total_items: 0,
        items_per_page: 10,
      },
    };
  }
}

// Search films - merged (returns array of items)
export async function searchFilmsMerged(keyword: string): Promise<FilmItem[]> {
  try {
    const res = await searchFilms(keyword, 1);
    return res.items || [];
  } catch (error) {
    return [];
  }
}

// Get newly updated films - using OPhim API
// OPhim provides danh-sach/phim-moi-cap-nhat endpoint with newest movies
export async function getNewlyUpdatedFilms(page: number = 1): Promise<FilmListResponse> {
  try {
    // Build query parameters for OPhim newest endpoint
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', '24');
    
    // OPhim endpoint: /danh-sach/phim-moi-cap-nhat (returns newest movies directly)
    const response = await fetchOPhimAPI<OPhimListResponse>(
      `/danh-sach/phim-moi-cap-nhat?${params.toString()}`
    );
    
    // Check if request was successful
    if (!response.status) {
      return {
        status: "error",
        message: response.message || response.msg || "Failed to fetch newly updated films",
        items: [],
        paginate: {
          current_page: 1,
          total_page: 1,
          total_items: 0,
          items_per_page: 10,
        },
      };
    }
    
    // Normalize response (direct format for newest endpoint)
    const { items, pagination } = normalizeOPhimListResponse(response);
    
    if (!items || items.length === 0) {
      return {
        status: "error",
        message: "No films found",
        items: [],
        paginate: {
          current_page: pagination?.currentPage || 1,
          total_page: pagination?.totalPages || 1,
          total_items: pagination?.totalItems || 0,
          items_per_page: pagination?.totalItemsPerPage || 24,
        },
      };
    }
    
    // Convert OPhim items to FilmItem format
    const convertedItems = items.map(convertOPhimItemToFilmItem);
    
    return {
      status: "success",
      items: convertedItems,
      paginate: {
        current_page: pagination?.currentPage || page,
        total_page: pagination?.totalPages || 1,
        total_items: pagination?.totalItems || items.length,
        items_per_page: pagination?.totalItemsPerPage || 24,
      },
    };
  } catch (error) {
    // console.error("[API] Error fetching newly updated films:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
      items: [],
      paginate: {
        current_page: 1,
        total_page: 1,
        total_items: 0,
        items_per_page: 10,
      },
    };
  }
}

// Get daily updated films - same as newly updated
export async function getDailyUpdatedFilms(page: number = 1): Promise<FilmListResponse> {
  return getNewlyUpdatedFilms(page);
}

// Predefined categories
export const CATEGORIES = {
  PHIM_LE: "phim-le",
  PHIM_BO: "phim-bo",
  PHIM_DANG_CHIEU: "phim-dang-chieu",
  TV_SHOWS: "tv-shows",
} as const;

// Predefined genres
export const GENRES = [
  { name: "Hành Động", slug: "hanh-dong" },
  { name: "Phiêu Lưu", slug: "phieu-luu" },
  { name: "Hoạt Hình", slug: "hoat-hinh" },
  { name: "Hài", slug: "hai" },
  { name: "Hình Sự", slug: "hinh-su" },
  { name: "Tài Liệu", slug: "tai-lieu" },
  { name: "Chính Kịch", slug: "chinh-kich" },
  { name: "Gia Đình", slug: "gia-dinh" },
  { name: "Giả Tưởng", slug: "gia-tuong" },
  { name: "Lịch Sử", slug: "lich-su" },
  { name: "Kinh Dị", slug: "kinh-di" },
  { name: "Nhạc", slug: "nhac" },
  { name: "Bí Ẩn", slug: "bi-an" },
  { name: "Lãng Mạn", slug: "lang-man" },
  { name: "Khoa Học Viễn Tưởng", slug: "khoa-hoc-vien-tuong" },
  { name: "Gây Cấn", slug: "gay-can" },
  { name: "Chiến Tranh", slug: "chien-tranh" },
  { name: "Tâm Lý", slug: "tam-ly" },
  { name: "Tình Cảm", slug: "tinh-cam" },
  { name: "Cổ Trang", slug: "co-trang" },
] as const;

// Predefined countries
export const COUNTRIES = [
  { name: "Âu Mỹ", slug: "au-my" },
  { name: "Anh", slug: "anh" },
  { name: "Trung Quốc", slug: "trung-quoc" },
  { name: "Việt Nam", slug: "viet-nam" },
  { name: "Hàn Quốc", slug: "han-quoc" },
  { name: "Nhật Bản", slug: "nhat-ban" },
  { name: "Thái Lan", slug: "thai-lan" },
  { name: "Đài Loan", slug: "dai-loan" },
  { name: "Hồng Kông", slug: "hong-kong" },
  { name: "Ấn Độ", slug: "an-do" },
] as const;

// Fetch available genres dynamically from OPhim
export async function getAvailableGenres(): Promise<{ name: string; slug: string }[]> {
  try {
    // Use OPhim API: /v1/api/the-loai
    const response = await fetchOPhimAPI<any>(`/v1/api/the-loai`);
    
    // Handle different response formats from OPhim
    const items = response.data?.items || response.items || [];
    
    if (!Array.isArray(items) || items.length === 0) {
      return [...GENRES];
    }

    return items.map((g: any) => ({ name: g.name, slug: g.slug }));
  } catch {
    // Fallback to hardcoded genres if API fails
    return [...GENRES];
  }
}

// Fetch available countries/regions dynamically from OPhim
export async function getAvailableCountries(): Promise<{ name: string; slug: string }[]> {
  try {
    // Use OPhim API: /v1/api/quoc-gia
    const response = await fetchOPhimAPI<any>(`/v1/api/quoc-gia`);
    
    // Handle different response formats from OPhim
    const items = response.data?.items || response.items || [];
    
    if (!Array.isArray(items) || items.length === 0) {
      return [...COUNTRIES];
    }

    return items.map((c: any) => ({ name: c.name, slug: c.slug }));
  } catch {
    // Fallback to hardcoded countries if API fails
    return [...COUNTRIES];
  }
}

// OPhim Image optimization - using img.ophim.live CDN
// OPhim CDN automatically handles image optimization and caching
const OPHIM_IMAGE_CDN = "https://img.ophim.live";

/**
 * Chuyển đổi URL ảnh sang định dạng WebP để tối ưu tốc độ tải
 * OPhim CDN (img.ophim.live) tự động hỗ trợ WebP format
 * @param imageUrl - URL ảnh 
 * @returns URL ảnh (unchanged since OPhim CDN handles WebP automatically)
 */
export function convertImageToWebP(imageUrl: string): string {
  if (!imageUrl || typeof imageUrl !== "string") {
    return "";
  }

  // OPhim CDN automatically handles WebP conversion for supported browsers
  // No need for URL parameter manipulation like old APIs
  // Just return the URL as-is and let the CDN handle optimization
  return imageUrl;
}

// Helper to get full image URL (defensive against non-string values)
export function getImageUrl(path: unknown, useWebP: boolean = true): string {
  // Fallback to existing logo in /public when path không hợp lệ
  if (typeof path !== "string" || !path) return "/logo.svg";
  
  // If starts with /, it's a relative path - return as is (will be handled by Next.js)
  if (path.startsWith("/")) {
    return path;
  }

  let fullUrl: string;

  // If already has http/https, use as is
  if (path.startsWith("http://") || path.startsWith("https://")) {
    fullUrl = path;
  } else {
    // For OPhim relative paths (like "upload/vod/..."), add CDN domain
    if (path.includes("upload/") || path.includes("vod/")) {
      fullUrl = `${OPHIM_CDN}/${path}`;
    } else {
      // Default: return as is
      return path;
    }
  }

  // Nếu useWebP = true, chuyển TẤT CẢ URL ảnh từ OPhim sang WebP
  if (useWebP) {
    // Chuyển đổi nếu URL là ảnh (có extension ảnh hoặc từ domain OPhim)
    // Luôn chuyển đổi nếu URL từ OPhim domain (img.ophim.live)
    // hoặc có path upload/vod (đây là pattern của OPhim)
    const isOPhimUrl = 
      fullUrl.includes("img.ophim.live") ||
      fullUrl.includes("upload/") ||
      fullUrl.includes("vod/");
    
    // Hoặc có extension ảnh
    const hasImageExtension = fullUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i);
    
    if (isOPhimUrl || hasImageExtension) {
      return convertImageToWebP(fullUrl);
    }
  }

  return fullUrl;
}

/**
 * Tạo URL ảnh với tham số tối ưu để giảm kích thước file
 * @param imageUrl - URL ảnh gốc
 * @param width - Chiều rộng mong muốn (optional)
 * @param quality - Chất lượng ảnh từ 1-100 (optional, mặc định 75)
 * @returns URL ảnh đã được tối ưu
 */
export function getOptimizedImageUrl(
  imageUrl: string,
  width?: number,
  quality: number = 75
): string {
  if (!imageUrl || typeof imageUrl !== "string") {
    return "";
  }

  // Nếu là relative path, không thêm tham số
  if (imageUrl.startsWith("/")) {
    return imageUrl;
  }

  // Nếu URL đã có query params, thêm vào
  const url = new URL(imageUrl);
  
  // Thêm tham số width nếu có
  if (width) {
    url.searchParams.set("w", width.toString());
  }
  
  // Thêm tham số quality
  url.searchParams.set("q", quality.toString());

  return url.toString();
}

// Fetch multiple pages and combine results với tối ưu batch requests
export async function getMultiplePages(
  fetchFn: (page: number) => Promise<FilmListResponse>,
  pages: number = 3
): Promise<FilmItem[]> {
  try {
    // Fetch tất cả pages song song để giảm thời gian chờ
    const allPromises = Array.from(
      { length: pages },
      (_, i) => fetchFn(i + 1).catch(() => null)
    );
    
    const allResults = await Promise.all(allPromises);
    
    // Filter kết quả hợp lệ
    const validResults = allResults.filter(
      (r): r is FilmListResponse => r !== null && r.status !== "error"
    );
    
    if (validResults.length === 0) {
      return [];
    }
    
    return validResults.flatMap((r) => r.items || []);
  } catch (error) {
    // If all fails, return empty array
    return [];
  }
}

// NguonC API functions removed

// Get films by genre - multiple pages
export async function getFilmsByGenreMultiple(
  slug: string,
  pages: number = 3
): Promise<FilmItem[]> {
  return getMultiplePages((page) => getFilmsByGenre(slug, page), pages);
}

// NguonC API functions removed

// Get all films by genre - automatically fetches all available pages
// NOTE: This function is kept for backward compatibility but should be avoided
// Use getFilmsByGenre with pagination instead for better performance
export async function getFilmsByGenreAll(
  slug: string
): Promise<FilmItem[]> {
  try {
    // First, fetch page 1 to get total_page
    const firstPage = await getFilmsByGenre(slug, 1);
    
    // Check if response is error or has no items
    if (firstPage.status === "error" || !firstPage.items || firstPage.items.length === 0) {
      // console.warn(`[API] No items found for genre ${slug} or error status:`, firstPage.status);
      return [];
    }
    
    const totalPages = firstPage.paginate?.total_page || 1;
    
    // If only 1 page, return immediately
    if (totalPages === 1) {
      return firstPage.items || [];
    }
    
    // Limit to reasonable number of pages to avoid timeout
    const MAX_PAGES = 50;
    const pagesToFetch = Math.min(totalPages, MAX_PAGES);
    
    // Fetch all remaining pages (2 to pagesToFetch)
    const allResults: FilmItem[] = [...(firstPage.items || [])];
    
    // Batch requests: fetch tối đa 5 pages cùng lúc để tăng tốc độ
    const BATCH_SIZE = 5;
    const remainingPages = pagesToFetch - 1;
    
    for (let i = 0; i < remainingPages; i += BATCH_SIZE) {
      const batchPromises = Array.from(
        { length: Math.min(BATCH_SIZE, remainingPages - i) },
        (_, j) => {
          const pageNum = i + j + 2;
          return getFilmsByGenre(slug, pageNum).catch((err) => {
            // console.warn(`[API] Error fetching genre ${slug} page ${pageNum}:`, err);
            return null;
          });
        }
      );
      
      const batchResults = await Promise.all(batchPromises);
      const validBatchResults = batchResults.filter(
        (r): r is FilmListResponse => 
          r !== null && 
          r.status !== "error" && 
          r.items && 
          r.items.length > 0
      );
      
      for (const result of validBatchResults) {
        allResults.push(...(result.items || []));
      }
    }
    
    return allResults;
  } catch (error) {
    // console.error("[API] Error fetching all genre pages:", error);
    return [];
  }
}

