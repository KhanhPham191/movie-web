import type { FilmDetail, FilmItem } from "./api";
import { getImageUrl } from "./api";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://www.movpey.xyz";

function parseRatingValue(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

function parseRatingCount(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return null;
}

/**
 * Generate Movie structured data (JSON-LD) for SEO
 */
export function generateMovieStructuredData(movie: FilmDetail | FilmItem, currentUrl?: string): object {
  const plainDescription = typeof movie.description === "string"
    ? movie.description.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
    : "";

  const movieUrl = currentUrl || `${siteUrl}/phim/${movie.slug}`;
  const rawImage = movie.poster_url || movie.thumb_url;
  const imageUrl = rawImage ? getImageUrl(rawImage, true) : `${siteUrl}/logo.svg`;

  const structuredData: any = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: movie.name,
    description: plainDescription || `Xem phim ${movie.name} online HD Vietsub miễn phí`,
    image: imageUrl,
    url: movieUrl,
    publisher: {
      "@type": "Organization",
      name: "MovPey",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.svg`,
      },
    },
  };

  // Add original name if available
  if (movie.original_name && movie.original_name !== movie.name) {
    structuredData.alternateName = movie.original_name;
  }

  // Add year if available
  if (movie.year) {
    structuredData.datePublished = String(movie.year);
  } else if (movie.created) {
    structuredData.datePublished = new Date(movie.created).getFullYear().toString();
  }

  // Add genre
  if (movie.category && movie.category.length > 0) {
    structuredData.genre = movie.category.map((cat) => cat.name).join(", ");
  }

  // Add rating only when value is valid; avoid fake ratingCount
  const movieRating = parseRatingValue(movie.vote_average ?? movie.imdb ?? movie.tmdb);
  const movieRatingCount = parseRatingCount(movie.vote_count);
  if (movieRating !== null && movieRating > 0 && movieRatingCount !== null) {
    structuredData.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: String(movieRating),
      bestRating: "10",
      worstRating: "1",
      ratingCount: String(movieRatingCount),
    };
  }

  // Add director
  if (movie.director) {
    structuredData.director = {
      "@type": "Person",
      name: movie.director,
    };
  }

  // Add actors
  if (movie.casts) {
    const actors = movie.casts.split(",").map((actor) => actor.trim()).filter(Boolean);
    if (actors.length > 0) {
      structuredData.actor = actors.map((actor) => ({
        "@type": "Person",
        name: actor,
      }));
    }
  }

  // Add country
  if (movie.country && movie.country.length > 0) {
    structuredData.countryOfOrigin = {
      "@type": "Country",
      name: movie.country.map((c) => c.name).join(", "),
    };
  }

  // Add duration if available
  if (movie.time) {
    structuredData.duration = movie.time;
  }

  // Add content rating
  structuredData.contentRating = "T18";

  return structuredData;
}

/**
 * Generate Breadcrumb structured data (JSON-LD) for SEO
 */
export function generateBreadcrumbStructuredData(items: Array<{ name: string; url: string }>): object {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate Video structured data (JSON-LD) for watch pages
 */
export function generateVideoStructuredData(
  movie: FilmDetail | FilmItem,
  episode: { name: string; slug: string },
  currentUrl?: string
): object {
  const plainDescription = typeof movie.description === "string"
    ? movie.description.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
    : "";

  const videoUrl = currentUrl || `${siteUrl}/xem-phim/${movie.slug}/${episode.slug}`;
  const rawThumb = movie.poster_url || movie.thumb_url;
  const thumbnailUrl = rawThumb ? getImageUrl(rawThumb, true) : `${siteUrl}/logo.svg`;
  const movieUrl = `${siteUrl}/phim/${movie.slug}`;

  const structuredData: any = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: `${movie.name} - ${episode.name}`,
    description: plainDescription || `Xem phim ${movie.name} ${episode.name} online HD Vietsub miễn phí`,
    thumbnailUrl: thumbnailUrl,
    contentUrl: videoUrl,
    embedUrl: videoUrl,
    uploadDate: movie.modified || movie.created || new Date().toISOString(),
    datePublished: movie.created || movie.modified || new Date().toISOString(),
    publisher: {
      "@type": "Organization",
      name: "MovPey",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/logo.svg`,
      },
    },
    mainEntity: {
      "@type": "Movie",
      name: movie.name,
      url: movieUrl,
    },
  };

  // Add duration if available
  if (movie.time) {
    structuredData.duration = movie.time;
  }

  // Add genre
  if (movie.category && movie.category.length > 0) {
    structuredData.genre = movie.category.map((cat) => cat.name).join(", ");
  }

  // Add rating only when value is valid
  const videoRating = parseRatingValue(movie.vote_average ?? movie.imdb ?? movie.tmdb);
  const videoRatingCount = parseRatingCount(movie.vote_count);
  if (videoRating !== null && videoRating > 0 && videoRatingCount !== null) {
    structuredData.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: String(videoRating),
      bestRating: "10",
      worstRating: "1",
      ratingCount: String(videoRatingCount),
    };
  }

  return structuredData;
}

/**
 * Generate Website structured data (JSON-LD) for homepage
 */
export function generateWebsiteStructuredData(customSiteUrl?: string): object {
  const baseUrl = customSiteUrl || siteUrl;
  
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "MovPey",
    url: baseUrl,
    description: "MovPey - Phim xịn mỗi ngày. Nền tảng xem phim trực tuyến với hàng nghìn bộ phim hấp dẫn, cập nhật liên tục.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/tim-kiem?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Generate Organization structured data (JSON-LD)
 */
export function generateOrganizationStructuredData(customSiteUrl?: string): object {
  const baseUrl = customSiteUrl || siteUrl;
  
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "MovPey",
    url: baseUrl,
    logo: `${baseUrl}/logo.svg`,
    description: "MovPey - Phim xịn mỗi ngày. Nền tảng xem phim trực tuyến với hàng nghìn bộ phim hấp dẫn.",
  };
}

/**
 * Generate FAQ structured data (JSON-LD)
 */
export function generateFAQStructuredData(faqs: Array<{ question: string; answer: string }>): object {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

