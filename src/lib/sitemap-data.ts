import {
  COUNTRIES,
  GENRES,
  getFilmDetail,
  getNewlyUpdatedFilms,
  type EpisodeItem,
  type FilmItem,
} from "@/lib/api";

const DEFAULT_SITE_URL = "https://www.movpey.xyz";

const MAX_MOVIES_IN_SITEMAP = 1000;
const MAX_MOVIES_FOR_WATCH_SITEMAP = 120;
const MAX_EPISODES_PER_MOVIE_IN_SITEMAP = 10;
const MAX_WATCH_URLS_IN_SITEMAP = 1500;

export type SitemapEntry = {
  url: string;
  lastModified: Date;
  changeFrequency?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: number;
};

export function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!envUrl) return DEFAULT_SITE_URL;

  let url = envUrl.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = `https://${url}`;
  }
  if (url.endsWith("/")) {
    url = url.slice(0, -1);
  }
  return url || DEFAULT_SITE_URL;
}

export function toSitemapXml(entries: SitemapEntry[]): string {
  const urlset = entries
    .map((entry) => {
      const parts = [
        `<loc>${entry.url}</loc>`,
        `<lastmod>${entry.lastModified.toISOString()}</lastmod>`,
      ];
      if (entry.changeFrequency) parts.push(`<changefreq>${entry.changeFrequency}</changefreq>`);
      if (typeof entry.priority === "number") parts.push(`<priority>${entry.priority.toFixed(1)}</priority>`);
      return `<url>${parts.join("")}</url>`;
    })
    .join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlset}
</urlset>`;
}

export function toSitemapIndexXml(urls: string[]): string {
  const body = urls.map((url) => `<sitemap><loc>${url}</loc></sitemap>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</sitemapindex>`;
}

export function getStaticSitemapEntries(now = new Date()): SitemapEntry[] {
  const siteUrl = getSiteUrl();
  return [
    { url: siteUrl, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${siteUrl}/danh-sach/phim-le`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/danh-sach/phim-bo`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${siteUrl}/danh-sach/phim-dang-chieu`, lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: `${siteUrl}/danh-sach/tv-shows`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${siteUrl}/danh-sach/phim-moi-cap-nhat`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${siteUrl}/danh-sach/phim-cap-nhat-hang-ngay`, lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: `${siteUrl}/tim-kiem`, lastModified: now, changeFrequency: "daily", priority: 0.4 },
    ...GENRES.map((genre) => ({
      url: `${siteUrl}/the-loai/${genre.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...COUNTRIES.map((country) => ({
      url: `${siteUrl}/quoc-gia/${country.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}

export async function getMoviesForSitemap(): Promise<FilmItem[]> {
  try {
    const movies: FilmItem[] = [];
    let page = 1;
    const maxPages = Math.ceil(MAX_MOVIES_IN_SITEMAP / 24);

    while (movies.length < MAX_MOVIES_IN_SITEMAP && page <= maxPages) {
      const response = await getNewlyUpdatedFilms(page);
      if (response.status === "error" || !response.items || response.items.length === 0) break;

      movies.push(...response.items);
      if (response.items.length < 24 || page >= response.paginate.total_page) break;
      page++;
    }

    return movies.slice(0, MAX_MOVIES_IN_SITEMAP);
  } catch (error) {
    console.error("[Sitemap] Error fetching movies:", error);
    return [];
  }
}

export async function getMovieSitemapEntries(now = new Date()): Promise<SitemapEntry[]> {
  const siteUrl = getSiteUrl();
  const movies = await getMoviesForSitemap();
  return movies.map((movie) => ({
    url: `${siteUrl}/phim/${movie.slug}`,
    lastModified: movie.modified ? new Date(movie.modified) : now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));
}

export async function getWatchSitemapEntries(now = new Date()): Promise<SitemapEntry[]> {
  try {
    const siteUrl = getSiteUrl();
    const movies = (await getMoviesForSitemap()).slice(0, MAX_MOVIES_FOR_WATCH_SITEMAP);
    const watchRoutes: SitemapEntry[] = [];

    const BATCH_SIZE = 8;
    for (let i = 0; i < movies.length; i += BATCH_SIZE) {
      const batch = movies.slice(i, i + BATCH_SIZE);
      const details = await Promise.allSettled(
        batch.map(async (movie) => ({ movie, detail: await getFilmDetail(movie.slug) }))
      );

      for (const result of details) {
        if (result.status !== "fulfilled") continue;
        const { movie, detail } = result.value;
        const episodeGroups = detail.movie?.episodes || [];

        const slugs = new Set<string>();
        for (const group of episodeGroups) {
          for (const item of (group.items || []) as EpisodeItem[]) {
            if (item.slug) slugs.add(item.slug);
          }
        }

        for (const episodeSlug of Array.from(slugs).slice(0, MAX_EPISODES_PER_MOVIE_IN_SITEMAP)) {
          watchRoutes.push({
            url: `${siteUrl}/xem-phim/${movie.slug}/${episodeSlug}`,
            lastModified: movie.modified ? new Date(movie.modified) : now,
            changeFrequency: "weekly",
            priority: 0.6,
          });
          if (watchRoutes.length >= MAX_WATCH_URLS_IN_SITEMAP) {
            return watchRoutes;
          }
        }
      }
    }

    return watchRoutes;
  } catch (error) {
    console.error("[Sitemap] Error fetching watch entries:", error);
    return [];
  }
}
