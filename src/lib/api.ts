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

// API bases
const NGUONC_BASE = "https://phim.nguonc.com/api";
const IPHIM_BASE = "https://iphim.cc/api";

const API_BASE = NGUONC_BASE;

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
      console.error("[API] Error response body:", errorText);
      
      // Parse error response if it's JSON
      let errorMessage = `API Error: ${res.status} ${res.statusText}`;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.message) {
          errorMessage = errorJson.message;
        }
      } catch {
        // If not JSON, use the text as is
        errorMessage = errorText.slice(0, 200);
      }
      
      // Create a custom error with status code
      const error = new Error(errorMessage) as Error & { status?: number };
      error.status = res.status;
      throw error;
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

// Safe fetch for a specific source – returns null on error instead of throwing
async function fetchFromSource<T>(endpoint: string, base: string): Promise<T | null> {
  try {
    return await fetchAPI<T>(endpoint, base);
  } catch (error) {
    console.error("[API] Source fetch error:", base, endpoint, error);
    return null;
  }
}

// Merge two film lists, removing duplicates by slug.
// preferred: danh sách ưu tiên (ví dụ Nguonc), secondary: danh sách bổ sung (ví dụ iPhim).
function mergeFilmLists(preferred: FilmItem[], secondary: FilmItem[]): FilmItem[] {
  const seen = new Set<string>();
  const result: FilmItem[] = [];

  for (const film of preferred || []) {
    if (!film?.slug) continue;
    if (seen.has(film.slug)) continue;
    seen.add(film.slug);
    result.push(film);
  }

  for (const film of secondary || []) {
    if (!film?.slug) continue;
    if (seen.has(film.slug)) continue;
    seen.add(film.slug);
    result.push(film);
  }

  return result;
}

// Merge episodes: base theo NguonPhim, chỉ override m3u8 bằng từ iPhim nếu có trùng slug.
function mergeEpisodesWithIphimM3u8(
  nguoncEpisodes: Episode[] | undefined,
  iphimEpisodes: Episode[] | undefined
): Episode[] | undefined {
  if (!nguoncEpisodes && !iphimEpisodes) return undefined;
  if (!nguoncEpisodes || nguoncEpisodes.length === 0) return iphimEpisodes;
  if (!iphimEpisodes || iphimEpisodes.length === 0) return nguoncEpisodes;

  // Clone để tránh mutate response gốc
  const merged = nguoncEpisodes.map((server) => ({
    server_name: server.server_name,
    items: server.items.map((it) => ({ ...it })),
  }));

  // Map slug -> m3u8 từ iPhim
  const iphimM3u8BySlug = new Map<string, string>();
  for (const server of iphimEpisodes) {
    for (const ep of server.items || []) {
      if (ep.slug && ep.m3u8) {
        iphimM3u8BySlug.set(ep.slug, ep.m3u8);
      }
    }
  }

  // Gán m3u8 iPhim vào tập tương ứng
  for (const server of merged) {
    for (const ep of server.items) {
      const m3u8FromIphim = iphimM3u8BySlug.get(ep.slug);
      if (m3u8FromIphim) {
        ep.m3u8 = m3u8FromIphim;
      }
    }
  }

  return merged;
}

// Helper: lấy số tập lớn nhất từ danh sách episodes (dựa vào name hoặc slug chứa số)
function getMaxEpisodeNumber(episodes: Episode[] | undefined): number {
  if (!episodes || episodes.length === 0) return 0;

  let maxEp = 0;

  for (const server of episodes) {
    for (const ep of server.items || []) {
      const candidates: string[] = [];
      if (ep.name) candidates.push(ep.name);
      if (ep.slug) candidates.push(ep.slug);

      for (const str of candidates) {
        const match = String(str).match(/(\d+)/);
        if (match) {
          const num = Number(match[1]);
          if (!Number.isNaN(num) && num > maxEp) {
            maxEp = num;
          }
        }
      }
    }
  }

  return maxEp;
}

// Get newly updated films
export async function getNewlyUpdatedFilms(page: number = 1): Promise<FilmListResponse> {
  return fetchAPI<FilmListResponse>(`/films/phim-moi-cap-nhat?page=${page}`);
}

// Get newly updated films from both sources, merged & deduped by slug
export async function getNewlyUpdatedFilmsCombined(page: number = 1): Promise<FilmItem[]> {
  const endpoint = `/films/phim-moi-cap-nhat?page=${page}`;
  const [nguonc, iphim] = await Promise.all([
    fetchFromSource<FilmListResponse>(endpoint, NGUONC_BASE),
    fetchFromSource<FilmListResponse>(endpoint, IPHIM_BASE),
  ]);

  return mergeFilmLists(nguonc?.items || [], iphim?.items || []);
}

// Get daily updated films (same as newly updated but with different cache)
export async function getDailyUpdatedFilms(page: number = 1): Promise<FilmListResponse> {
  return fetchAPI<FilmListResponse>(`/films/phim-moi-cap-nhat?page=${page}`);
}

// Daily updated films from both sources, merged & deduped
export async function getDailyUpdatedFilmsCombined(page: number = 1): Promise<FilmItem[]> {
  const endpoint = `/films/phim-moi-cap-nhat?page=${page}`;
  const [nguonc, iphim] = await Promise.all([
    fetchFromSource<FilmListResponse>(endpoint, NGUONC_BASE),
    fetchFromSource<FilmListResponse>(endpoint, IPHIM_BASE),
  ]);

  return mergeFilmLists(nguonc?.items || [], iphim?.items || []);
}

// Get films by category (phim-le, phim-bo, phim-dang-chieu, etc.)
export async function getFilmsByCategory(
  slug: string,
  page: number = 1
): Promise<FilmListResponse> {
  return fetchAPI<FilmListResponse>(`/films/danh-sach/${slug}?page=${page}`);
}

// Category films from both sources, merged & deduped
export async function getFilmsByCategoryCombined(
  slug: string,
  page: number = 1
): Promise<FilmItem[]> {
  const endpoint = `/films/danh-sach/${slug}?page=${page}`;
  const [nguonc, iphim] = await Promise.all([
    fetchFromSource<FilmListResponse>(endpoint, NGUONC_BASE),
    fetchFromSource<FilmListResponse>(endpoint, IPHIM_BASE),
  ]);

  return mergeFilmLists(nguonc?.items || [], iphim?.items || []);
}

// Get film detail by slug from a specific base
export async function getFilmDetail(slug: string, base: string = NGUONC_BASE): Promise<FilmDetailResponse> {
  // NguonC: /film/{slug}, iPhim: /phim/{slug}
  const endpoint = base === NGUONC_BASE ? `/film/${slug}` : `/phim/${slug}`;
  return fetchAPI<FilmDetailResponse>(endpoint, base);
}

/**
 * Get film detail - try NGUONC first, then fallback to iPhim.
 */
export async function getFilmDetailMerged(slug: string): Promise<FilmDetailResponse | null> {
  try {
    console.log(`[API] Fetching detail (merged) for slug: ${slug}`);

    const [fromNguoncRaw, fromIphimRaw] = await Promise.all([
      fetchFromSource<FilmDetailResponse & { episodes?: any[] }>(`/film/${slug}`, NGUONC_BASE),
      fetchFromSource<any>(`/phim/${slug}`, IPHIM_BASE),
    ]);

    // --- Normalize NguonPhim (gần như đã đúng format) ---
    const nguonc: FilmDetailResponse | null =
      fromNguoncRaw && fromNguoncRaw.status !== "error" && fromNguoncRaw.movie
        ? fromNguoncRaw
        : null;

    // --- Normalize iPhim về FilmDetailResponse + Episode[] chuẩn ---
    let iphim: FilmDetailResponse | null = null;
    let iphimEpisodes: Episode[] | undefined;

    if (fromIphimRaw && fromIphimRaw.status !== false) {
      const raw = fromIphimRaw as any;
      const movie = raw.movie || {};

      // Map field khác tên
      movie.original_name = movie.original_name || movie.origin_name || "";
      movie.current_episode = movie.current_episode || movie.episode_current || "";
      if (!movie.total_episodes && movie.episode_total) {
        const match = String(movie.episode_total).match(/\d+/);
        movie.total_episodes = match ? Number(match[0]) : 0;
      }

      // episodes ở top-level: episodes[].server_data
      if (Array.isArray(raw.episodes)) {
        iphimEpisodes = raw.episodes.map((server: any) => {
          const serverData = Array.isArray(server.server_data) ? server.server_data : [];
          return {
            server_name: server.server_name || "Server",
            items: serverData.map((ep: any) => ({
              name: String(ep.name ?? ""),
              slug: String(ep.slug ?? ""),
              embed: Array.isArray(ep.link_embed) ? String(ep.link_embed[0] ?? "") : "",
              m3u8: Array.isArray(ep.link_m3u8) ? String(ep.link_m3u8[0] ?? "") : "",
            })),
          } as Episode;
        });
      }

      (movie as any).episodes = iphimEpisodes;
      iphim = {
        status: raw.status === true ? "success" : String(raw.status || "error"),
        movie: movie as FilmDetail,
      };
    }

    // --- Quyết định base movie & episodes ---
    if (!nguonc && !iphim) {
      console.warn("[API] ❌ Not found in both sources:", slug);
      return null;
    }

    // Base meta: ƯU TIÊN iPhim, nếu không có thì dùng NguonPhim
    const base = (iphim || nguonc)!;
    const movie = { ...(base.movie as any) } as FilmDetail;

    const nguoncEpisodes = (nguonc?.movie as any)?.episodes as Episode[] | undefined;
    const hasIphimEpisodes = Array.isArray(iphimEpisodes) && iphimEpisodes.length > 0;
    const hasNguoncEpisodes = Array.isArray(nguoncEpisodes) && nguoncEpisodes.length > 0;

    // Chuẩn hóa episodes từ NguonPhim: giữ nguyên embed nhưng bỏ m3u8
    const nguoncEpisodesProcessed: Episode[] | undefined = hasNguoncEpisodes
      ? nguoncEpisodes.map((server) => ({
          server_name: server.server_name,
          items: server.items.map((ep) => ({
            ...ep,
            m3u8: "", // xoá m3u8 để player fallback sang iframe embed nếu không có iPhim
          })),
        }))
      : undefined;

    if (hasIphimEpisodes && hasNguoncEpisodes) {
      // Cả hai nguồn đều có tập: so sánh số tập cao nhất
      const maxNguonc = getMaxEpisodeNumber(nguoncEpisodes);
      const maxIphim = getMaxEpisodeNumber(iphimEpisodes);

      if (maxIphim > maxNguonc) {
        // iPhim đang dẫn trước: dùng list tập của iPhim
        movie.episodes = iphimEpisodes;
      } else {
        // NguonPhim đã có tập mới hơn hoặc bằng: giữ list tập của NguonPhim,
        // nhưng override m3u8 cho các tập trùng slug từ iPhim (nếu có)
        movie.episodes = mergeEpisodesWithIphimM3u8(
          nguoncEpisodesProcessed,
          iphimEpisodes
        );
      }
    } else if (hasIphimEpisodes) {
      // Chỉ có iPhim
      movie.episodes = iphimEpisodes;
    } else if (hasNguoncEpisodes) {
      // Chỉ có NguonPhim
      movie.episodes = nguoncEpisodesProcessed;
    } else {
      movie.episodes = undefined;
    }

    return {
      status: "success",
      movie,
    };
  } catch (error) {
    console.error(`[API] Error fetching merged detail:`, error);
    return null;
  }
}

// Get films by genre
export async function getFilmsByGenre(
  slug: string,
  page: number = 1
): Promise<FilmListResponse> {
  return fetchAPI<FilmListResponse>(`/films/the-loai/${slug}?page=${page}`);
}

// Genre films from both sources, merged & deduped
export async function getFilmsByGenreCombined(
  slug: string,
  page: number = 1
): Promise<FilmItem[]> {
  const endpoint = `/films/the-loai/${slug}?page=${page}`;
  const [nguonc, iphim] = await Promise.all([
    fetchFromSource<FilmListResponse>(endpoint, NGUONC_BASE),
    fetchFromSource<FilmListResponse>(endpoint, IPHIM_BASE),
  ]);

  return mergeFilmLists(nguonc?.items || [], iphim?.items || []);
}

// Get films by country
export async function getFilmsByCountry(
  slug: string,
  page: number = 1
): Promise<FilmListResponse> {
  return fetchAPI<FilmListResponse>(`/films/quoc-gia/${slug}?page=${page}`);
}

// Country films from both sources, merged & deduped
export async function getFilmsByCountryCombined(
  slug: string,
  page: number = 1
): Promise<FilmItem[]> {
  const endpoint = `/films/quoc-gia/${slug}?page=${page}`;
  const [nguonc, iphim] = await Promise.all([
    fetchFromSource<FilmListResponse>(endpoint, NGUONC_BASE),
    fetchFromSource<FilmListResponse>(endpoint, IPHIM_BASE),
  ]);

  return mergeFilmLists(nguonc?.items || [], iphim?.items || []);
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

// Search films in both sources, merged & deduped
export async function searchFilmsCombined(keyword: string): Promise<FilmItem[]> {
  const endpoint = `/films/search?keyword=${encodeURIComponent(keyword)}`;

  const [nguonc, iphim] = await Promise.all([
    fetchFromSource<FilmListResponse>(endpoint, NGUONC_BASE),
    fetchFromSource<FilmListResponse>(endpoint, IPHIM_BASE),
  ]);

  return mergeFilmLists(nguonc?.items || [], iphim?.items || []);
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

