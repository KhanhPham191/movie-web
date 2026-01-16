import type { MetadataRoute } from "next";
import { CATEGORIES, GENRES, COUNTRIES, getNewlyUpdatedFilms, type FilmItem } from "@/lib/api";

// Cache sitemap trong 24 giờ để tránh timeout
export const revalidate = 86400; // 24 hours

// Đảm bảo siteUrl đúng format: có https:// và không có trailing slash
// LUÔN dùng domain production, KHÔNG BAO GIỜ dùng Vercel preview URL
function getSiteUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL;
  
  // Ưu tiên NEXT_PUBLIC_SITE_URL nếu có và hợp lệ
  if (envUrl) {
    // Loại bỏ trailing slash và đảm bảo có https://
    let url = envUrl.trim();
    if (url.endsWith("/")) {
      url = url.slice(0, -1);
    }
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }
    // Đảm bảo URL hợp lệ: có https://, không phải example.com, không phải Vercel preview
    const isValidUrl = url && 
                       url.startsWith("https://") && 
                       !url.includes("example.com") &&
                       !(url.includes("vercel.app") && !url.includes("movpey"));
    
    if (isValidUrl) {
      return url;
    }
  }
  
  // KHÔNG dùng VERCEL_URL vì nó có thể là preview URL
  // LUÔN dùng production domain làm default
  return "https://www.movpey.xyz";
}

const siteUrl = getSiteUrl();

// Limit số lượng phim trong sitemap để tránh timeout
// Tăng lên 1000 để index nhiều phim hơn (Google hỗ trợ tối đa 50,000 URLs/sitemap)
// Nhưng giữ ở 1000 để tránh timeout và đảm bảo performance
const MAX_MOVIES_IN_SITEMAP = 1000;

async function getMoviesForSitemap(): Promise<FilmItem[]> {
  try {
    const movies: FilmItem[] = [];
    let page = 1;
    const maxPages = Math.ceil(MAX_MOVIES_IN_SITEMAP / 24); // Giả sử 24 phim mỗi trang
    const timeout = 10000; // 10 seconds timeout

    // Tạo promise với timeout
    const fetchPromise = (async () => {
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
    })();

    // Race với timeout
    const timeoutPromise = new Promise<FilmItem[]>((_, reject) => {
      setTimeout(() => reject(new Error("Sitemap fetch timeout")), timeout);
    });

    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch (error) {
    // Log error trong production để debug
    if (process.env.NODE_ENV === "production") {
      console.error("[Sitemap] Error fetching movies:", error);
    }
    // Trả về mảng rỗng thay vì throw error để sitemap vẫn hoạt động
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const now = new Date();

    // Đảm bảo siteUrl hợp lệ và không phải là Vercel preview URL
    const isVercelPreviewUrl = siteUrl.includes("vercel.app") && !siteUrl.includes("movpey");
    const isValidUrl = siteUrl && 
                       !siteUrl.includes("example.com") && 
                       siteUrl.startsWith("https://") &&
                       !isVercelPreviewUrl;
    
    if (!isValidUrl) {
      console.error("[Sitemap] Invalid siteUrl detected:", siteUrl);
      // Luôn dùng production domain nếu phát hiện URL không hợp lệ
      const validSiteUrl = "https://www.movpey.xyz";
      console.log("[Sitemap] Using production domain:", validSiteUrl);
      
      return [
        {
          url: validSiteUrl,
          lastModified: now,
          changeFrequency: "daily" as const,
          priority: 1,
        },
      ];
    }

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

    // Thêm dynamic movie routes với error handling
    let movieRoutes: MetadataRoute.Sitemap = [];
    try {
      const movies = await getMoviesForSitemap();
      movieRoutes = movies.map((movie) => ({
        url: `${siteUrl}/phim/${movie.slug}`,
        lastModified: movie.modified ? new Date(movie.modified) : now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      }));
    } catch (error) {
      // Nếu không lấy được phim, vẫn trả về các routes khác
      console.error("[Sitemap] Error fetching movies:", error);
    }

    return [...staticRoutes, ...genreRoutes, ...countryRoutes, ...movieRoutes];
  } catch (error) {
    // Đảm bảo luôn trả về sitemap hợp lệ ngay cả khi có lỗi
    console.error("[Sitemap] Critical error:", error);
    // Luôn dùng production domain làm fallback, không dùng Vercel preview URL
    const isVercelPreviewUrl = siteUrl && siteUrl.includes("vercel.app") && !siteUrl.includes("movpey");
    const isValidFallback = siteUrl && 
                            !siteUrl.includes("example.com") && 
                            siteUrl.startsWith("https://") &&
                            !isVercelPreviewUrl;
    
    const fallbackUrl = isValidFallback ? siteUrl : "https://www.movpey.xyz";
    
    return [
      {
        url: fallbackUrl,
        lastModified: new Date(),
        changeFrequency: "daily" as const,
        priority: 1,
      },
    ];
  }
}










