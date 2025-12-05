// API Types based on https://phim.nguonc.com/api-document

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
  description: string;
  total_episodes: number;
  current_episode: string;
  time: string;
  quality: string;
  language: string;
  director: string;
  casts: string;
  category: FilmCategory[];
  country: FilmCategory[];
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
  movie: FilmDetail;
}

// API base (chỉ dùng NguonC, bỏ iPhim)
const API_BASE = "https://phim.nguonc.com/api";

const DEFAULT_FETCH_HEADERS: HeadersInit = {
  "User-Agent": "Mozilla/5.0 (compatible; Phim7Bot/1.0; +https://phim7.xyz)",
  Accept: "application/json",
  "Accept-Language": "vi,en;q=0.9",
};

// Fetch with error handling
async function fetchAPI<T>(endpoint: string, base: string = API_BASE): Promise<T> {
  const url = `${base}${endpoint}`;
  console.log("[API] Fetching:", url);
  
  try {
    // For newly updated films endpoint, use shorter cache (10 minutes)
    // For other endpoints, use longer cache (1 hour)
    const revalidate = endpoint.includes('phim-moi-cap-nhat') ? 600 : 3600;
    
    const res = await fetch(url, {
      next: { revalidate }, // Dynamic cache based on endpoint
      headers: DEFAULT_FETCH_HEADERS,
    });

    console.log("[API] Response status:", res.status, res.statusText);

    if (!res.ok) {
      const errorText = await res.text();
      
      // Parse error response if it's JSON
      let errorMessage = `API Error: ${res.status} ${res.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorMessage = errorJson.message;
        }
        // Nếu response là JSON với status error, trả về luôn
        if (errorJson.status === "error") {
          return errorJson as T;
        }
      } catch {
        // If not JSON, use the text as is
        errorMessage = errorText.slice(0, 200);
      }
      
      // Thay vì throw error, trả về error response object để caller có thể xử lý
      // Chỉ log warning cho các lỗi client (4xx) trừ 404, log error cho server errors (5xx)
      if (res.status >= 400 && res.status < 500) {
        // Client errors (404, etc.) - không log 404 để tránh spam
        if (res.status !== 404) {
          console.warn(`[API] ${res.status} ${res.statusText}: ${errorMessage}`);
        }
      } else {
        // Server errors (500, etc.) - log error
        console.error(`[API] ${res.status} ${res.statusText}: ${errorMessage}`);
      }
      
      // Trả về error response object thay vì throw
      // Kiểm tra endpoint để trả về đúng type
      if (endpoint.includes('/films/') || endpoint.includes('/danh-sach/')) {
        // FilmListResponse
        return {
          status: "error",
          message: errorMessage,
          items: [],
          paginate: {
            current_page: 1,
            total_page: 1,
            total_items: 0,
            items_per_page: 20,
          },
        } as T;
      } else {
        // FilmDetailResponse hoặc các response khác - chỉ trả về status và message
        return {
          status: "error",
          message: errorMessage,
        } as T;
      }
    }

    const data = await res.json();
    console.log("[API] Response data keys:", Object.keys(data));
    
    // Check if response has error status - but return it instead of throwing
    if (data.status === "error") {
      console.warn("[API] API returned error status:", data.message);
      // Return the error response as is, don't throw
      return data;
    }
    
    return data;
  } catch (error) {
    // Network errors hoặc các lỗi khác - trả về error response thay vì throw
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn("[API] Fetch error:", errorMessage);
    
    // Trả về error response object để caller có thể xử lý
    if (endpoint.includes('/films/') || endpoint.includes('/danh-sach/')) {
      // FilmListResponse
      return {
        status: "error",
        message: errorMessage,
        items: [],
        paginate: {
          current_page: 1,
          total_page: 1,
          total_items: 0,
          items_per_page: 20,
        },
      } as T;
    } else {
      // FilmDetailResponse hoặc các response khác
      return {
        status: "error",
        message: errorMessage,
      } as T;
    }
  }
}

// Get newly updated films
export async function getNewlyUpdatedFilms(page: number = 1): Promise<FilmListResponse> {
  return fetchAPI<FilmListResponse>(`/films/phim-moi-cap-nhat?page=${page}`);
}

// Get daily updated films (same as newly updated but with different cache)
export async function getDailyUpdatedFilms(page: number = 1): Promise<FilmListResponse> {
  return fetchAPI<FilmListResponse>(`/films/phim-moi-cap-nhat?page=${page}`);
}

// Valid category slugs
const VALID_CATEGORY_SLUGS = [
  "phim-le",
  "phim-bo",
  "phim-dang-chieu",
  "tv-shows",
] as const;

// Get films by category (phim-le, phim-bo, phim-dang-chieu, etc.)
export async function getFilmsByCategory(
  slug: string,
  page: number = 1
): Promise<FilmListResponse> {
  // Validate slug trước khi gọi API để tránh lỗi không cần thiết
  if (!VALID_CATEGORY_SLUGS.includes(slug as any)) {
    console.warn(`[getFilmsByCategory] Invalid category slug: ${slug}`);
    return {
      status: "error",
      message: `Category ${slug} doesn't exist!`,
      items: [],
      paginate: {
        current_page: 1,
        total_page: 1,
        total_items: 0,
        items_per_page: 20,
      },
    };
  }
  
  return fetchAPI<FilmListResponse>(`/films/danh-sach/${slug}?page=${page}`);
}

// Get film detail by slug (NguonC)
export async function getFilmDetail(slug: string): Promise<FilmDetailResponse> {
  return fetchAPI<FilmDetailResponse>(`/film/${slug}`);
}

// Get films by genre
export async function getFilmsByGenre(
  slug: string,
  page: number = 1
): Promise<FilmListResponse> {
  return fetchAPI<FilmListResponse>(`/films/the-loai/${slug}?page=${page}`);
}

// Get films by country
export async function getFilmsByCountry(
  slug: string,
  page: number = 1
): Promise<FilmListResponse> {
  return fetchAPI<FilmListResponse>(`/films/quoc-gia/${slug}?page=${page}`);
}

// Get films by year
export async function getFilmsByYear(
  year: number,
  page: number = 1
): Promise<FilmListResponse> {
  return fetchAPI<FilmListResponse>(`/films/nam-phat-hanh/${year}?page=${page}`);
}

// Search films
export async function searchFilms(keyword: string): Promise<FilmListResponse> {
  return fetchAPI<FilmListResponse>(`/films/search?keyword=${encodeURIComponent(keyword)}`);
}

/**
 * Search films - using NGUONC API
 */
export async function searchFilmsMerged(keyword: string): Promise<FilmItem[]> {
  try {
    const res = await searchFilms(keyword);
    return res.items || [];
  } catch (error) {
    console.error("[API] Search error:", error);
    return [];
  }
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

// Helper to get full image URL (defensive against non-string values)
export function getImageUrl(path: unknown): string {
  // Fallback to existing logo in /public when path không hợp lệ
  if (typeof path !== "string" || !path) return "/logo.ico";
  if (path.startsWith("http")) return path;
  return path;
}

// Fetch multiple pages and combine results
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
      console.warn("[getMultiplePages] Fetch error on page 1:", fetchError instanceof Error ? fetchError.message : String(fetchError));
      return [];
    }
    
    // Kiểm tra nếu API trả về lỗi
    if (firstPage.status === "error") {
      // Chỉ log warning nếu không phải lỗi category không tồn tại (để tránh spam log)
      if (!firstPage.message?.includes("doesn't exist")) {
        console.warn("[getMultiplePages] API returned error status:", firstPage.message);
      }
      return [];
    }
    
    const totalPages = firstPage.paginate?.total_page || 1;
    
    // Only fetch pages that actually exist
    const pagesToFetch = Math.min(pages, totalPages);
    
    if (pagesToFetch === 1) {
      return firstPage.items || [];
    }
    
    // Fetch remaining pages in parallel
    const remainingPromises = Array.from({ length: pagesToFetch - 1 }, (_, i) => 
      fetchFn(i + 2).catch(() => null) // Return null on error instead of throwing
    );
    
    const remainingResults = await Promise.all(remainingPromises);
    const validResults = remainingResults.filter((r): r is FilmListResponse => 
      r !== null && r.status !== "error"
    );
    
    // Combine all results
    const allResults = [firstPage, ...validResults];
    return allResults.flatMap((r) => r.items || []);
  } catch (error) {
    // If even page 1 fails, return empty array
    console.error("[getMultiplePages] Error:", error);
    return [];
  }
}

// Get newly updated films - multiple pages
export async function getNewlyUpdatedFilmsMultiple(pages: number = 3): Promise<FilmItem[]> {
  return getMultiplePages(getNewlyUpdatedFilms, pages);
}

// Get films by category - multiple pages
export async function getFilmsByCategoryMultiple(
  slug: string,
  pages: number = 3
): Promise<FilmItem[]> {
  return getMultiplePages((page) => getFilmsByCategory(slug, page), pages);
}

// Get films by genre - multiple pages
export async function getFilmsByGenreMultiple(
  slug: string,
  pages: number = 3
): Promise<FilmItem[]> {
  return getMultiplePages((page) => getFilmsByGenre(slug, page), pages);
}

// Get films by country - multiple pages
export async function getFilmsByCountryMultiple(
  slug: string,
  pages: number = 3
): Promise<FilmItem[]> {
  return getMultiplePages((page) => getFilmsByCountry(slug, page), pages);
}

