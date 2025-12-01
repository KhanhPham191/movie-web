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
  episodes: Episode[];
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

const API_BASE = "https://phim.nguonc.com/api";

// Fetch with error handling
async function fetchAPI<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!res.ok) {
    throw new Error(`API Error: ${res.status}`);
  }

  return res.json();
}

// Get newly updated films
export async function getNewlyUpdatedFilms(page: number = 1): Promise<FilmListResponse> {
  return fetchAPI<FilmListResponse>(`/films/phim-moi-cap-nhat?page=${page}`);
}

// Get films by category (phim-le, phim-bo, phim-dang-chieu, etc.)
export async function getFilmsByCategory(
  slug: string,
  page: number = 1
): Promise<FilmListResponse> {
  return fetchAPI<FilmListResponse>(`/films/danh-sach/${slug}?page=${page}`);
}

// Get film detail by slug
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
    // First, try to fetch page 1 to check total pages available
    const firstPage = await fetchFn(1);
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
    const validResults = remainingResults.filter((r): r is FilmListResponse => r !== null);
    
    // Combine all results
    const allResults = [firstPage, ...validResults];
    return allResults.flatMap((r) => r.items || []);
  } catch (error) {
    // If even page 1 fails, return empty array
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

