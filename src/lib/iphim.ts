const IPHIM_BASE = "https://iphim.cc/api";

export interface IphimEpisodeItem {
  name: string;
  slug: string;
  [key: string]: any;
}

export interface IphimEpisodeServer {
  server_name: string;
  items: IphimEpisodeItem[];
}

export interface IphimDetail {
  name: string;
  slug: string;
  episodes: IphimEpisodeServer[];
}

export interface IphimDetailResponse {
  status: string;
  movie: IphimDetail;
}

async function fetchIphim<T>(endpoint: string): Promise<T | null> {
  const url = `${IPHIM_BASE}${endpoint}`;
  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
      console.error("[IPHIM] HTTP", res.status, res.statusText);
      return null;
    }
    return (await res.json()) as T;
  } catch (e) {
    console.error("[IPHIM] error", e);
    return null;
  }
}

export async function getIphimDetail(slug: string): Promise<IphimDetailResponse | null> {
  return fetchIphim<IphimDetailResponse>(`/phim/${slug}`);
}

export async function getIphimM3u8ForEpisode(
  slug: string,
  episodeSlug: string
): Promise<string | null> {
  const res = await getIphimDetail(slug);
  const movie = res?.movie;
  if (!movie || !movie.episodes?.length) return null;

  const server = movie.episodes[0];
  if (!server.items?.length) return null;

  const ep =
    server.items.find((e) => e.slug === episodeSlug) ??
    server.items.find((e) => e.slug.includes(episodeSlug)) ??
    server.items[0];
  if (!ep) return null;

  const url =
    (ep as any).m3u8 ||
    (ep as any).link_m3u8 ||
    (ep as any).file ||
    (ep as any).url ||
    "";

  if (!url || typeof url !== "string") return null;
  return url;
}
