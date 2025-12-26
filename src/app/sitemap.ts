import type { MetadataRoute } from "next";
import { CATEGORIES, GENRES, COUNTRIES, getNewlyUpdatedFilms, type FilmItem } from "@/lib/api";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://movpey.example.com");

// Limit số lượng phim trong sitemap để tránh timeout
const MAX_MOVIES_IN_SITEMAP = 1000;

async function getMoviesForSitemap(): Promise<FilmItem[]> {
  try {
    const movies: FilmItem[] = [];
    let page = 1;
    const maxPages = Math.ceil(MAX_MOVIES_IN_SITEMAP / 24); // Giả sử 24 phim mỗi trang

    while (movies.length < MAX_MOVIES_IN_SITEMAP && page <= maxPages) {
      const response = await getNewlyUpdatedFilms(page);
      
      if (response.status === "error" || !response.items || response.items.length === 0) {
        break;
      }

      movies.push(...response.items);
      
      // Nếu đã hết trang hoặc không còn phim nào
      if (response.items.length < 24 || page >= response.paginate.total_page) {
        break;
      }
      
      page++;
    }

    return movies.slice(0, MAX_MOVIES_IN_SITEMAP);
  } catch (error) {
    // console.error("[Sitemap] Error fetching movies:", error);
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${siteUrl}/danh-sach/phim-le`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/danh-sach/phim-bo`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/danh-sach/phim-dang-chieu`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
    {
      url: `${siteUrl}/danh-sach/tv-shows`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${siteUrl}/danh-sach/phim-moi-cap-nhat`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/danh-sach/phim-cap-nhat-hang-ngay`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${siteUrl}/tim-kiem`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.4,
    },
  ];

  const genreRoutes: MetadataRoute.Sitemap = GENRES.map((genre) => ({
    url: `${siteUrl}/the-loai/${genre.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const countryRoutes: MetadataRoute.Sitemap = COUNTRIES.map((country) => ({
    url: `${siteUrl}/quoc-gia/${country.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  // Thêm dynamic movie routes
  const movies = await getMoviesForSitemap();
  const movieRoutes: MetadataRoute.Sitemap = movies.map((movie) => ({
    url: `${siteUrl}/phim/${movie.slug}`,
    lastModified: movie.modified ? new Date(movie.modified) : now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...genreRoutes, ...countryRoutes, ...movieRoutes];
}










