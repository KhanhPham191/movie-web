// API Types based on PhimAPI.com

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

// PhimAPI.com base URL
export const PHIMAPI_BASE = "https://phimapi.com/v1/api";
const PHIMAPI_CDN = "https://phimimg.com";

// PhimAPI.com response interfaces
interface PhimAPIItem {
  _id: string;
  name: string;
  slug: string;
  origin_name: string;
  thumb_url: string;
  poster_url: string;
  created: { time: string };
  modified: { time: string };
  description?: string;
  episode_current?: string;
  time?: string;
  quality?: string;
  lang?: string;
  year?: number;
  imdb?: number | string;
  tmdb?: number | string;
  category?: Array<{ id: string; name: string; slug: string }>;
  country?: Array<{ id: string; name: string; slug: string }>;
  director?: string;
  casts?: string;
  total_episodes?: number;
  chieurap?: boolean | number; // API có thể trả về boolean hoặc number (1/0)
}

interface PhimAPIResponse {
  status: boolean;
  msg?: string;
  data: {
    items: PhimAPIItem[];
    params: {
      pagination: {
        totalItems: number;
        totalItemsPerPage: number;
        currentPage: number;
        totalPages: number;
      };
    };
  };
}

interface PhimAPIDetailResponse {
  status: boolean;
  msg?: string;
  data: {
    item: PhimAPIItem & {
      content?: string;
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
    };
  };
}

interface PhimAPIDetailResponse {
  status: boolean;
  msg?: string;
  data: {
    item: PhimAPIItem & {
      content?: string;
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
    };
  };
}

// Helper to normalize image URL from PhimAPI
function normalizePhimAPIImageUrl(url: string, useWebP: boolean = true): string {
  if (!url) return "";
  let normalizedUrl: string;
  
  if (url.startsWith("http://") || url.startsWith("https://")) {
    normalizedUrl = url;
  } else if (url.startsWith("/")) {
    normalizedUrl = `${PHIMAPI_CDN}${url}`;
  } else {
    normalizedUrl = `${PHIMAPI_CDN}/${url}`;
  }

  // Chuyển đổi sang WebP nếu useWebP = true
  if (useWebP) {
    return convertImageToWebP(normalizedUrl);
  }
  
  return normalizedUrl;
}

// Helper to convert PhimAPI item to FilmItem
function convertPhimAPIItemToFilmItem(item: PhimAPIItem): FilmItem {
  const thumbUrl = item.thumb_url || item.poster_url || "";
  const posterUrl = item.poster_url || item.thumb_url || "";

  // Chuẩn hoá các field rating có thể là object (tmdb/imdb: { id, vote_average, ... })
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
  
  // Chuẩn hóa chieurap: có thể là boolean hoặc number (1/0)
  const chieurap = item.chieurap !== undefined 
    ? (typeof item.chieurap === 'boolean' ? item.chieurap : item.chieurap === 1)
    : undefined;

  return {
    id: item._id,
    name: item.name,
    slug: item.slug,
    original_name: item.origin_name || item.name,
    thumb_url: normalizePhimAPIImageUrl(thumbUrl),
    poster_url: normalizePhimAPIImageUrl(posterUrl),
    created: item.created?.time || "",
    modified: item.modified?.time || "",
    year: item.year,
    description: item.description || "",
    total_episodes: item.total_episodes || 0,
    current_episode: item.episode_current || "",
    time: item.time || "",
    quality: item.quality || "",
    language: item.lang || "",
    imdb,
    tmdb,
    director: item.director || "",
    casts: item.casts || "",
    category: (item.category || []).map((cat) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
    })),
    country: (item.country || []).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
    })),
    chieurap,
  };
}

// Fetch from PhimAPI.com
async function fetchPhimAPI<T>(endpoint: string): Promise<T> {
  const isBrowser = typeof window !== "undefined";
  // Khi chạy trên client (đặc biệt mobile), đi qua proxy để tránh CORS/chặn UA
  const url = isBrowser
    ? `/api/phimapi?endpoint=${encodeURIComponent(endpoint)}`
    : `${PHIMAPI_BASE}${endpoint}`;
  const cacheKey = url;
  
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey) as Promise<T>;
  }
  
  const fetchPromise = (async () => {
    try {
      const timeoutMs = 30000;
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
        throw new Error(`HTTP ${res.status}`);
      }

      const data = await res.json();
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(errorMessage);
    }
  })();
  
  fetchPromise.finally(() => {
    setTimeout(() => {
      requestCache.delete(cacheKey);
    }, 100);
  });
  
  requestCache.set(cacheKey, fetchPromise);
  return fetchPromise;
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

// All NguonC API functions have been removed - only PhimAPI.com is used

// Get films by genre - using PhimAPI.com only
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
    // Build query parameters
    const params = new URLSearchParams();
    params.append('page', String(page));
    
    if (options?.sort_field) {
      params.append('sort_field', options.sort_field);
    }
    if (options?.sort_type) {
      params.append('sort_type', options.sort_type);
    }
    if (options?.sort_lang) {
      params.append('sort_lang', options.sort_lang);
    }
    if (options?.country) {
      params.append('country', options.country);
    }
    if (options?.year) {
      params.append('year', String(options.year));
    }
    if (options?.limit) {
      params.append('limit', String(options.limit));
    }
    
    const response = await fetchPhimAPI<PhimAPIResponse>(
      `/the-loai/${slug}?${params.toString()}`
    );
    
    // Check if PhimAPI returned valid data
    if (!response.status || !response.data || !response.data.items) {
      return {
        status: "error",
        message: response.msg || "Failed to fetch films",
        items: [],
        paginate: {
          current_page: 1,
          total_page: 1,
          total_items: 0,
          items_per_page: 10,
        },
      };
    }
    
    // Convert PhimAPI response to FilmListResponse format
    const items = response.data.items.map(convertPhimAPIItemToFilmItem);
    const pagination = response.data.params.pagination;
    
    return {
      status: "success",
      items: items,
      paginate: {
        current_page: pagination.currentPage,
        total_page: pagination.totalPages,
        total_items: pagination.totalItems,
        items_per_page: pagination.totalItemsPerPage,
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

// Get films by category - using PhimAPI.com
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
    // Build query parameters
    const params = new URLSearchParams();
    params.append('page', String(page));
    
    if (options?.sort_field) {
      params.append('sort_field', options.sort_field);
    }
    if (options?.sort_type) {
      params.append('sort_type', options.sort_type);
    }
    if (options?.sort_lang) {
      params.append('sort_lang', options.sort_lang);
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
    if (options?.limit) {
      params.append('limit', String(options.limit));
    }
    // Map biến chieurap sang query param (1/0) cho API
    if (typeof options?.chieurap === "boolean") {
      params.append("chieurap", options.chieurap ? "1" : "0");
    }
    
    const response = await fetchPhimAPI<PhimAPIResponse>(
      `/danh-sach/${slug}?${params.toString()}`
    );
    
    // Check if PhimAPI returned valid data
    if (!response.status || !response.data || !response.data.items) {
      return {
        status: "error",
        message: response.msg || "Failed to fetch films",
        items: [],
        paginate: {
          current_page: 1,
          total_page: 1,
          total_items: 0,
          items_per_page: 10,
        },
      };
    }
    
    // Convert PhimAPI response to FilmListResponse format
    const items = response.data.items.map(convertPhimAPIItemToFilmItem);
    const pagination = response.data.params.pagination;
    
    return {
      status: "success",
      items: items,
      paginate: {
        current_page: pagination.currentPage,
        total_page: pagination.totalPages,
        total_items: pagination.totalItems,
        items_per_page: pagination.totalItemsPerPage,
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

// Get films by country - using PhimAPI.com
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
    // Build query parameters
    const params = new URLSearchParams();
    params.append('page', String(page));
    
    if (options?.sort_field) {
      params.append('sort_field', options.sort_field);
    }
    if (options?.sort_type) {
      params.append('sort_type', options.sort_type);
    }
    if (options?.sort_lang) {
      params.append('sort_lang', options.sort_lang);
    }
    if (options?.category) {
      params.append('category', options.category);
    }
    if (options?.year) {
      params.append('year', String(options.year));
    }
    if (options?.limit) {
      params.append('limit', String(options.limit));
    }
    
    const response = await fetchPhimAPI<PhimAPIResponse>(
      `/quoc-gia/${slug}?${params.toString()}`
    );
    
    // Check if PhimAPI returned valid data
    if (!response.status || !response.data || !response.data.items) {
      return {
        status: "error",
        message: response.msg || "Failed to fetch films",
        items: [],
        paginate: {
          current_page: 1,
          total_page: 1,
          total_items: 0,
          items_per_page: 10,
        },
      };
    }
    
    // Convert PhimAPI response to FilmListResponse format
    const items = response.data.items.map(convertPhimAPIItemToFilmItem);
    const pagination = response.data.params.pagination;
    
    return {
      status: "success",
      items: items,
      paginate: {
        current_page: pagination.currentPage,
        total_page: pagination.totalPages,
        total_items: pagination.totalItems,
        items_per_page: pagination.totalItemsPerPage,
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

// Get film detail by slug - using PhimAPI.com
export async function getFilmDetail(slug: string): Promise<FilmDetailResponse> {
  try {
    const response = await fetchPhimAPI<PhimAPIDetailResponse>(`/phim/${slug}`);
    
    if (!response.status || !response.data || !response.data.item) {
      return {
        status: "error",
        message: response.msg || "Failed to fetch film detail",
      };
    }
    
    const item = response.data.item;
    const filmItem = convertPhimAPIItemToFilmItem(item);
    
    // Convert episodes if available
    const episodes: Episode[] = (item.episodes || []).map((ep) => ({
      server_name: ep.server_name,
      items: ep.server_data.map((item) => ({
        name: item.name,
        slug: item.slug,
        embed: item.link_embed || "",
        m3u8: item.link_m3u8 || "",
      })),
    }));
    
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

// Search films - using PhimAPI.com
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
    const params = new URLSearchParams();
    params.append('keyword', keyword);
    params.append('page', String(page));
    
    if (options?.sort_field) {
      params.append('sort_field', options.sort_field);
    }
    if (options?.sort_type) {
      params.append('sort_type', options.sort_type);
    }
    if (options?.sort_lang) {
      params.append('sort_lang', options.sort_lang);
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
    if (options?.limit) {
      params.append('limit', String(options.limit));
    }
    
    const response = await fetchPhimAPI<PhimAPIResponse>(
      `/tim-kiem?${params.toString()}`
    );
    
    if (!response.status || !response.data || !response.data.items) {
      return {
        status: "error",
        message: response.msg || "Failed to search films",
        items: [],
        paginate: {
          current_page: 1,
          total_page: 1,
          total_items: 0,
          items_per_page: 10,
        },
      };
    }
    
    const items = response.data.items.map(convertPhimAPIItemToFilmItem);
    const pagination = response.data.params.pagination;
    
    return {
      status: "success",
      items: items,
      paginate: {
        current_page: pagination.currentPage,
        total_page: pagination.totalPages,
        total_items: pagination.totalItems,
        items_per_page: pagination.totalItemsPerPage,
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

// Get newly updated films - using PhimAPI.com
export async function getNewlyUpdatedFilms(page: number = 1): Promise<FilmListResponse> {
  // Use danh-sach/phim-bo with sort by modified time
  try {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('sort_field', 'modified.time');
    params.append('sort_type', 'desc');
    
    const response = await fetchPhimAPI<PhimAPIResponse>(
      `/danh-sach/phim-bo?${params.toString()}`
    );
    
    if (!response.status || !response.data || !response.data.items) {
      return {
        status: "error",
        message: response.msg || "Failed to fetch newly updated films",
        items: [],
        paginate: {
          current_page: 1,
          total_page: 1,
          total_items: 0,
          items_per_page: 10,
        },
      };
    }
    
    const items = response.data.items.map(convertPhimAPIItemToFilmItem);
    const pagination = response.data.params.pagination;
    
    return {
      status: "success",
      items: items,
      paginate: {
        current_page: pagination.currentPage,
        total_page: pagination.totalPages,
        total_items: pagination.totalItems,
        items_per_page: pagination.totalItemsPerPage,
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

// PhimAPI Image Converter API - chuyển đổi ảnh sang WebP format
const PHIMAPI_IMAGE_CONVERTER = "https://phimapi.com/image.php";

/**
 * Chuyển đổi URL ảnh từ KKPhim sang định dạng WebP để tối ưu tốc độ tải và SEO
 * @param imageUrl - URL ảnh mặc định mà KKPhim trả về
 * @returns URL ảnh đã được chuyển đổi sang WebP format
 */
export function convertImageToWebP(imageUrl: string): string {
  if (!imageUrl || typeof imageUrl !== "string") {
    return "";
  }

  // Nếu URL đã là từ image converter API, trả về nguyên bản
  if (imageUrl.includes("phimapi.com/image.php")) {
    return imageUrl;
  }

  // Nếu là relative path hoặc local path, không chuyển đổi
  if (imageUrl.startsWith("/") || !imageUrl.startsWith("http")) {
    return imageUrl;
  }

  // Chuyển đổi TẤT CẢ URL ảnh từ KKPhim/PhimAPI sang WebP
  // API image.php của KKPhim sẽ tự động trả về WebP khi browser gửi Accept: image/webp header
  // Encode URL để truyền vào query parameter
  const encodedUrl = encodeURIComponent(imageUrl);
  // Thêm timestamp để tránh cache (optional, có thể bỏ nếu không cần)
  return `${PHIMAPI_IMAGE_CONVERTER}?url=${encodedUrl}`;
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
    // For PhimAPI relative paths (like "upload/vod/..."), add CDN domain
    if (path.includes("upload/") || path.includes("vod/")) {
      fullUrl = `${PHIMAPI_CDN}/${path}`;
    } else {
      // Default: return as is
      return path;
    }
  }

  // Nếu useWebP = true, chuyển TẤT CẢ URL ảnh từ PhimAPI sang WebP
  // API image.php của KKPhim có thể xử lý bất kỳ URL ảnh nào từ KKPhim
  if (useWebP) {
    // Chuyển đổi nếu URL là ảnh (có extension ảnh hoặc từ domain PhimAPI/KKPhim)
    // Luôn chuyển đổi nếu URL từ PhimAPI domain (phimimg.com, phimapi.com, img.ophim.live)
    // hoặc có path upload/vod (đây là pattern của PhimAPI)
    const isPhimAPIUrl = 
      fullUrl.includes("phimimg.com") ||
      fullUrl.includes("phimapi.com") ||
      fullUrl.includes("img.ophim.live") ||
      fullUrl.includes("upload/") ||
      fullUrl.includes("vod/");
    
    // Hoặc có extension ảnh
    const hasImageExtension = fullUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)(\?|$)/i);
    
    if (isPhimAPIUrl || hasImageExtension) {
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
    // First, try to fetch page 1 to check total pages available
    let firstPage: FilmListResponse;
    try {
      firstPage = await fetchFn(1);
    } catch (fetchError) {
      // Nếu fetch throw error (network error, etc.), return empty array
      return [];
    }
    
    // Kiểm tra nếu API trả về lỗi
    if (firstPage.status === "error") {
      return [];
    }
    
    const totalPages = firstPage.paginate?.total_page || 1;
    
    // Only fetch pages that actually exist
    const pagesToFetch = Math.min(pages, totalPages);
    
    if (pagesToFetch === 1) {
      return firstPage.items || [];
    }
    
    // Batch requests: fetch tối đa 3 pages cùng lúc để tránh quá tải
    const BATCH_SIZE = 3;
    const remainingPages = pagesToFetch - 1;
    const allResults: FilmListResponse[] = [firstPage];
    
    // Fetch remaining pages theo batch
    for (let i = 0; i < remainingPages; i += BATCH_SIZE) {
      const batchPromises = Array.from(
        { length: Math.min(BATCH_SIZE, remainingPages - i) },
        (_, j) => fetchFn(i + j + 2).catch(() => null)
    );
    
      const batchResults = await Promise.all(batchPromises);
      const validBatchResults = batchResults.filter(
        (r): r is FilmListResponse => r !== null && r.status !== "error"
    );
      allResults.push(...validBatchResults);
    }
    
    return allResults.flatMap((r) => r.items || []);
  } catch (error) {
    // If even page 1 fails, return empty array
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

