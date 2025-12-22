// API Types based on phimapi.com (KKPhim)

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
  imdb?: string;
  tmdb?: string | number;
  vote_average?: number | string;
  year?: number | string;
}

export interface FilmDetail extends FilmItem {
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

// API options interface
export interface FilmListOptions {
  sort_field?: string;
  sort_type?: 'asc' | 'desc';
  sort_lang?: string;
  country?: string;
  category?: string;
  year?: number;
  limit?: number;
  chieurap?: boolean;
}

// API base - phimapi.com
const API_BASE = "https://phimapi.com";

const DEFAULT_FETCH_HEADERS: HeadersInit = {
  "User-Agent": "Mozilla/5.0 (compatible; Phim7Bot/1.0; +https://phim7.xyz)",
  Accept: "application/json",
  "Accept-Language": "vi,en;q=0.9",
};

// Helper: Extract image URL from various formats
function extractImageUrl(value: any): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value.url) return value.url;
  return null;
}

// Helper: Normalize image URL - convert relative paths to absolute URLs and use proxy
function normalizeImageUrl(url: string | null | undefined): string | undefined {
  if (!url || url === '') return undefined;
  
  let finalUrl = url;
  
  // Convert relative paths to absolute URLs
  if (finalUrl.startsWith('upload/') || finalUrl.startsWith('/upload/')) {
    finalUrl = `https://phimimg.com/${finalUrl.replace(/^\/+/, '')}`;
  } else if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
    finalUrl = `https://phimimg.com/${finalUrl}`;
  }
  
  // Use image proxy for WEBP conversion
  if (finalUrl && (finalUrl.startsWith('http://') || finalUrl.startsWith('https://'))) {
    finalUrl = `https://phimapi.com/image.php?url=${encodeURIComponent(finalUrl)}`;
  }
  
  return finalUrl;
}

// Helper: Normalize film item from API response
const normalizeFilmItem = (item: any): any => {
  if (!item || typeof item !== 'object') return item;

  const normalized: any = { ...item };

  // Normalize image fields - kiểm tra nhiều field names khác nhau
  const possibleThumbFields = [
    'thumb_url', 'thumbUrl', 'thumb', 'thumbnail', 'thumbnail_url', 'thumbnailUrl',
    'poster_url', 'posterUrl', 'poster', 'image', 'image_url', 'imageUrl',
    'cover', 'cover_url', 'coverUrl', 'backdrop', 'backdrop_url', 'backdropUrl'
  ];
  const possiblePosterFields = [
    'poster_url', 'posterUrl', 'poster', 'image', 'image_url', 'imageUrl',
    'cover', 'cover_url', 'coverUrl', 'backdrop', 'backdrop_url', 'backdropUrl',
    'thumb_url', 'thumbUrl', 'thumb', 'thumbnail', 'thumbnail_url', 'thumbnailUrl'
  ];

  // Tìm thumb_url - kiểm tra cả khi đã có nhưng có thể là relative path
  let thumbUrlFound = false;
  if (normalized.thumb_url) {
    normalized.thumb_url = normalizeImageUrl(normalized.thumb_url);
    thumbUrlFound = !!normalized.thumb_url;
  }

  if (!thumbUrlFound) {
    for (const field of possibleThumbFields) {
      const value = normalized[field];
      if (value) {
        const extracted = extractImageUrl(value);
        if (extracted) {
          normalized.thumb_url = normalizeImageUrl(extracted);
          if (normalized.thumb_url) break;
        }
      }
    }
  }

  // Tìm poster_url - kiểm tra cả khi đã có nhưng có thể là relative path
  let posterUrlFound = false;
  if (normalized.poster_url) {
    normalized.poster_url = normalizeImageUrl(normalized.poster_url);
    posterUrlFound = !!normalized.poster_url;
  }

  if (!posterUrlFound) {
    for (const field of possiblePosterFields) {
      const value = normalized[field];
      if (value) {
        const extracted = extractImageUrl(value);
        if (extracted) {
          normalized.poster_url = normalizeImageUrl(extracted);
          if (normalized.poster_url) break;
        }
      }
    }
  }

  // Swap thumb_url và poster_url để tương thích với cách sử dụng trong code cũ
  // API mới có vẻ trả về ngược với API cũ: poster_url là landscape, thumb_url là portrait
  const tempThumb = normalized.thumb_url;
  normalized.thumb_url = normalized.poster_url;
  normalized.poster_url = tempThumb;

  // Fallback: nếu có thumb_url nhưng không có poster_url, dùng thumb_url
  if (normalized.thumb_url && !normalized.poster_url) {
    normalized.poster_url = normalized.thumb_url;
  }
  // Fallback: nếu có poster_url nhưng không có thumb_url, dùng poster_url
  if (normalized.poster_url && !normalized.thumb_url) {
    normalized.thumb_url = normalized.poster_url;
  }

  // Đảm bảo image URLs không rỗng
  if (normalized.thumb_url === '') normalized.thumb_url = undefined;
  if (normalized.poster_url === '') normalized.poster_url = undefined;

  // Normalize other fields
  if (!normalized.original_name) {
    normalized.original_name = normalized.originalName || normalized.original_name || normalized.name || '';
  }
  if (normalized.total_episodes === undefined || normalized.total_episodes === null) {
    normalized.total_episodes = normalized.totalEpisodes || normalized.total_episodes || 0;
  }
  if (!normalized.current_episode) {
    normalized.current_episode = normalized.currentEpisode || normalized.current_episode || '';
  }
  if (!normalized.name && normalized.title) {
    normalized.name = normalized.title;
  }
  if (!normalized.slug && normalized.id) {
    normalized.slug = String(normalized.id);
  }

  // Normalize category và country arrays
  if (normalized.category && !Array.isArray(normalized.category)) {
    normalized.category = [normalized.category];
  }
  if (normalized.country && !Array.isArray(normalized.country)) {
    normalized.country = [normalized.country];
  }

  // Đảm bảo các field bắt buộc có giá trị mặc định
  if (!normalized.id && normalized.slug) {
    normalized.id = normalized.slug;
  }
  if (!normalized.name) {
    normalized.name = '';
  }
  if (!normalized.slug) {
    normalized.slug = '';
  }
  if (!normalized.description) {
    normalized.description = '';
  }
  // Normalize time field - loại bỏ NaN và các giá trị không hợp lệ
  if (normalized.time) {
    const timeStr = String(normalized.time).trim();
    if (timeStr === '') {
      normalized.time = '';
    } else {
      const lowerTimeStr = timeStr.toLowerCase();
      const invalidValues = ['nan', 'undefined', 'null', 'none', 'infinity', 'inf', '-infinity', '-inf'];
      
      // Kiểm tra các giá trị không hợp lệ
      if (invalidValues.includes(lowerTimeStr) || lowerTimeStr.includes('nan')) {
        normalized.time = '';
      } else {
        // Kiểm tra nếu là số không hợp lệ
        const numValue = Number(timeStr);
        if (isNaN(numValue) || !isFinite(numValue) || numValue < 0 || numValue > 10000) {
          normalized.time = '';
        } else {
          normalized.time = timeStr;
        }
      }
    }
  } else {
    normalized.time = '';
  }
  if (!normalized.quality) {
    normalized.quality = '';
  }
  if (!normalized.language) {
    normalized.language = '';
  }
  if (!normalized.director) {
    normalized.director = '';
  }
  if (!normalized.casts) {
    normalized.casts = '';
  }
  if (!normalized.created) {
    normalized.created = '';
  }
  if (!normalized.modified) {
    normalized.modified = '';
  }

  // Normalize year field - chuyển đổi sang number nếu có
  if (normalized.year !== undefined && normalized.year !== null) {
    if (typeof normalized.year === 'string') {
      const yearStr = normalized.year.trim();
      const yearNum = parseInt(yearStr, 10);
      if (!isNaN(yearNum) && yearNum >= 1900 && yearNum <= 2100) {
        normalized.year = yearNum;
      } else {
        normalized.year = undefined;
      }
    } else if (typeof normalized.year === 'number') {
      if (isNaN(normalized.year) || normalized.year < 1900 || normalized.year > 2100) {
        normalized.year = undefined;
      }
    }
  }

  // Normalize IMDb field: API đôi khi trả về object, đôi khi là string/number
  if (normalized.imdb !== undefined && normalized.imdb !== null) {
    if (typeof normalized.imdb === 'object') {
      const imdbObj = normalized.imdb as any;
      const rawImdb =
        imdbObj.score ??
        imdbObj.rating ??
        imdbObj.value ??
        imdbObj.id ??
        imdbObj.imdb ??
        '';
      normalized.imdb = rawImdb ? String(rawImdb) : '';
    } else {
      normalized.imdb = String(normalized.imdb);
    }
  }

  // Normalize TMDB field: API đôi khi trả về object, đôi khi là string/number
  if (normalized.tmdb !== undefined && normalized.tmdb !== null) {
    if (typeof normalized.tmdb === 'object') {
      const tmdbObj = normalized.tmdb as any;
      const rawTmdb =
        tmdbObj.score ??
        tmdbObj.rating ??
        tmdbObj.value ??
        tmdbObj.id ??
        tmdbObj.tmdb ??
        '';
      normalized.tmdb = rawTmdb ? String(rawTmdb) : '';
      // Nếu có vote_average trong object tmdb, lấy ra
      if (tmdbObj.vote_average !== undefined && tmdbObj.vote_average !== null) {
        normalized.vote_average = tmdbObj.vote_average;
      }
    } else {
      normalized.tmdb = String(normalized.tmdb);
    }
  }

  // Normalize vote_average field - điểm đánh giá TMDB
  if (normalized.vote_average !== undefined && normalized.vote_average !== null) {
    if (typeof normalized.vote_average === 'string') {
      const voteStr = normalized.vote_average.trim();
      const voteNum = parseFloat(voteStr);
      if (!isNaN(voteNum) && isFinite(voteNum) && voteNum >= 0 && voteNum <= 10) {
        normalized.vote_average = voteNum;
      } else {
        normalized.vote_average = undefined;
      }
    } else if (typeof normalized.vote_average === 'number') {
      if (isNaN(normalized.vote_average) || !isFinite(normalized.vote_average) || normalized.vote_average < 0 || normalized.vote_average > 10) {
        normalized.vote_average = undefined;
      }
    }
  }

  return normalized;
};

// Fetch with error handling and response normalization
async function fetchAPI<T>(endpoint: string, base: string = API_BASE): Promise<T> {
  const url = `${base}${endpoint}`;
  console.log("[API] Fetching:", url);
  
  try {
    const revalidate = endpoint.includes('phim-moi-cap-nhat') ? 600 : 3600;
    
    const res = await fetch(url, {
      next: { revalidate },
      headers: DEFAULT_FETCH_HEADERS,
    });

    console.log("[API] Response status:", res.status, res.statusText);

    if (!res.ok) {
      let errorText = '';
      try {
        errorText = await res.text();
      } catch {
        // If we can't read the response body, that's okay
        errorText = '';
      }
      
      console.error("[API] Error response body:", errorText || '(empty)');
      
      let errorMessage = `API Error: ${res.status} ${res.statusText}`;
      if (errorText) {
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.message) {
            errorMessage = errorJson.message;
          }
        } catch {
          if (errorText.length > 0) {
            errorMessage = errorText.slice(0, 200);
          }
        }
      }
      
      // For 404 or other client errors, return empty response instead of throwing
      if (res.status === 404 || res.status === 400) {
        console.warn("[API] Returning empty response for", res.status);
        return {
          status: 'error',
          items: [],
          paginate: {
            current_page: 1,
            total_page: 1,
            total_items: 0,
            items_per_page: 0,
          },
        } as T;
      }
      
      const error = new Error(errorMessage) as Error & { status?: number };
      error.status = res.status;
      throw error;
    }

    const data = await res.json();
    console.log("[API] Response data keys:", Object.keys(data));
    
    // Check if response has error status
    if (data.status === "error") {
      console.warn("[API] API returned error status:", data.message);
      return data;
    }
    
    // Normalize response structure
    let normalizedData: any = { ...data };
    
    // Handle different response structures
    let items: any[] = [];
    let pagination: any = null;
    
    // Check for items in various locations
    if (data.items) {
      items = data.items;
    } else if (data.data?.items) {
      items = data.data.items;
    } else if (data.data?.data) {
      items = Array.isArray(data.data.data) ? data.data.data : [];
    } else if (data.data && Array.isArray(data.data)) {
      items = data.data;
    } else if (data.results && Array.isArray(data.results)) {
      items = data.results;
    } else if (data.movies && Array.isArray(data.movies)) {
      items = data.movies;
    } else if (data.films && Array.isArray(data.films)) {
      items = data.films;
    }
    
    // Check for pagination in various locations
    if (data.paginate) {
      pagination = data.paginate;
    } else if (data.pagination) {
      pagination = data.pagination;
    } else if (data.data?.paginate) {
      pagination = data.data.paginate;
    } else if (data.data?.pagination) {
      pagination = data.data.pagination;
    }
    
    // Normalize items
    const normalizedItems = items.map(normalizeFilmItem);
    
    // Build normalized response
    normalizedData = {
      status: data.status || 'success',
      items: normalizedItems,
      paginate: pagination || {
        current_page: 1,
        total_page: 1,
        total_items: normalizedItems.length,
        items_per_page: normalizedItems.length,
      },
    };
    
    return normalizedData as T;
  } catch (error) {
    console.error("[API] Fetch error:", error);
    if (error instanceof Error) {
      console.error("[API] Error message:", error.message);
      if ('status' in error) {
        console.error("[API] Error status:", (error as any).status);
      }
    }
    throw error;
  }
}

// Build query string from options
function buildQueryString(options?: FilmListOptions, page: number = 1): string {
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
  if (options?.category) {
    params.append('category', options.category);
  }
  if (options?.year) {
    params.append('year', String(options.year));
  }
  if (options?.limit) {
    params.append('limit', String(options.limit));
  }
  if (options?.chieurap !== undefined) {
    params.append('chieurap', String(options.chieurap));
  }
  
  return params.toString();
}

// Get newly updated films
export async function getNewlyUpdatedFilms(page: number = 1): Promise<FilmListResponse> {
  return fetchAPI<FilmListResponse>(`/v1/api/phim-moi-cap-nhat?page=${page}`);
}

// Get daily updated films
export async function getDailyUpdatedFilms(page: number = 1): Promise<FilmListResponse> {
  return fetchAPI<FilmListResponse>(`/v1/api/phim-moi-cap-nhat?page=${page}`);
}

// Get films by category (phim-le, phim-bo, etc.)
export async function getFilmsByCategory(
  slug: string,
  page: number = 1,
  options?: FilmListOptions
): Promise<FilmListResponse> {
  const queryString = buildQueryString(options, page);
  return fetchAPI<FilmListResponse>(`/v1/api/danh-sach/${slug}?${queryString}`);
}

// Get film detail by slug
export async function getFilmDetail(slug: string): Promise<FilmDetailResponse> {
  const endpoint = `/phim/${slug}`;
  const url = `${API_BASE}${endpoint}`;
  console.log("[API] Fetching detail:", url);

  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: DEFAULT_FETCH_HEADERS,
    });

    if (!res.ok) {
      let errorText = "";
      try {
        errorText = await res.text();
      } catch {
        errorText = "";
      }

      console.error("[API] Detail error body:", errorText || "(empty)");

      const baseMessage = `API Error: ${res.status} ${res.statusText}`;
      const error: Error & { status?: number } = new Error(baseMessage);
      error.status = res.status === 404 || res.status === 400 ? 404 : res.status;
      throw error;
    }

    const data = await res.json();
    console.log("[API] Detail response keys:", Object.keys(data));

    // API mới trả về status: true/false thay vì "success"/"error"
    const isError = data.status === false || data.status === "error" || (!data.movie && !data.data);
    
    if (isError) {
      const error: Error & { status?: number } = new Error(
        data?.msg || data?.message || "Không lấy được dữ liệu chi tiết phim từ API."
      );
      error.status = 404;
      throw error;
    }

    const rawMovie = data.movie || data.data;
    const normalizedMovie = normalizeFilmItem(rawMovie);

    // Xử lý episodes từ response mới
    // API mới trả về episodes array với format: { server_name, server_data: [{ name, slug, link_embed, link_m3u8 }] }
    let normalizedEpisodes: Episode[] | undefined;
    if (data.episodes && Array.isArray(data.episodes)) {
      normalizedEpisodes = data.episodes.map((ep: any) => ({
        server_name: ep.server_name || "",
        items: (ep.server_data || []).map((item: any) => ({
          name: item.name || "",
          slug: item.slug || "",
          embed: item.link_embed || item.embed || "",
          m3u8: item.link_m3u8 || item.m3u8 || "",
        })),
      }));
    }

    // Gán episodes vào normalizedMovie nếu có
    if (normalizedEpisodes && normalizedEpisodes.length > 0) {
      normalizedMovie.episodes = normalizedEpisodes;
    }

    return {
      status: data.status === true ? "success" : (data.status || "success"),
      movie: normalizedMovie,
    } as FilmDetailResponse;
  } catch (error) {
    console.error("[API] getFilmDetail error:", error);
    throw error;
  }
}

// Get films by genre
export async function getFilmsByGenre(
  slug: string,
  page: number = 1,
  options?: FilmListOptions
): Promise<FilmListResponse> {
  const queryString = buildQueryString({ ...options, category: slug }, page);
  // Use danh-sach endpoint with category filter
  return fetchAPI<FilmListResponse>(`/v1/api/danh-sach/phim-bo?${queryString}`);
}

// Get films by country
export async function getFilmsByCountry(
  slug: string,
  page: number = 1,
  options?: FilmListOptions
): Promise<FilmListResponse> {
  const queryString = buildQueryString({ ...options, country: slug }, page);
  // Use danh-sach endpoint with country filter
  return fetchAPI<FilmListResponse>(`/v1/api/danh-sach/phim-bo?${queryString}`);
}

// Get films by year
export async function getFilmsByYear(
  year: number,
  page: number = 1,
  options?: FilmListOptions
): Promise<FilmListResponse> {
  const queryString = buildQueryString({ ...options, year }, page);
  return fetchAPI<FilmListResponse>(`/v1/api/danh-sach/phim-bo?${queryString}`);
}

// Search films
export async function searchFilms(
  keyword: string,
  options?: FilmListOptions
): Promise<FilmListResponse> {
  const params = new URLSearchParams();
  params.append('keyword', keyword);
  
  if (options?.sort_field) {
    params.append('sort_field', options.sort_field);
  }
  if (options?.sort_type) {
    params.append('sort_type', options.sort_type);
  }
  if (options?.limit) {
    params.append('limit', String(options.limit));
  }
  
  return fetchAPI<FilmListResponse>(`/v1/api/tim-kiem?${params.toString()}`);
}

// Search films - merged
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

// Helper to get full image URL
export function getImageUrl(path: string): string {
  if (!path) return "/placeholder.jpg";
  if (path.startsWith("http")) return path;
  return path;
}

// Fetch multiple pages and combine results
export async function getMultiplePages(
  fetchFn: (page: number) => Promise<FilmListResponse>,
  pages: number = 3
): Promise<FilmItem[]> {
  try {
    const firstPage = await fetchFn(1).catch((error) => {
      console.warn("[API] Error fetching first page:", error);
      return {
        status: 'error',
        items: [],
        paginate: {
          current_page: 1,
          total_page: 1,
          total_items: 0,
          items_per_page: 0,
        },
      } as FilmListResponse;
    });
    
    // Check for error status
    if (firstPage.status === 'error' || !firstPage.items || firstPage.items.length === 0) {
      return [];
    }
    
    const totalPages = firstPage.paginate?.total_page || 1;
    const pagesToFetch = Math.min(pages, totalPages);
    
    if (pagesToFetch === 1) {
      return firstPage.items || [];
    }
    
    const remainingPromises = Array.from({ length: pagesToFetch - 1 }, (_, i) => 
      fetchFn(i + 2).catch((error) => {
        console.warn(`[API] Error fetching page ${i + 2}:`, error);
        return null;
      })
    );
    
    const remainingResults = await Promise.all(remainingPromises);
    const validResults = remainingResults.filter((r): r is FilmListResponse => 
      r !== null && r.status !== 'error' && r.items && r.items.length > 0
    );
    
    const allResults = [firstPage, ...validResults];
    return allResults.flatMap((r) => r.items || []);
  } catch (error) {
    console.error("[API] Error in getMultiplePages:", error);
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
  pages: number = 3,
  options?: FilmListOptions
): Promise<FilmItem[]> {
  return getMultiplePages((page) => getFilmsByCategory(slug, page, options), pages);
}

// Get films by genre - multiple pages
export async function getFilmsByGenreMultiple(
  slug: string,
  pages: number = 3,
  options?: FilmListOptions
): Promise<FilmItem[]> {
  return getMultiplePages((page) => getFilmsByGenre(slug, page, options), pages);
}

// Get films by country - multiple pages
export async function getFilmsByCountryMultiple(
  slug: string,
  pages: number = 3,
  options?: FilmListOptions
): Promise<FilmItem[]> {
  return getMultiplePages((page) => getFilmsByCountry(slug, page, options), pages);
}
