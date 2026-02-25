import { HeroSection } from "@/components/hero-section";
import {
  getFilmsByCategoryMultiple,
  CATEGORIES,
  type FilmItem,
} from "@/lib/api";

function sortByModifiedDesc(movies: FilmItem[]): FilmItem[] {
  return [...(movies || [])].sort((a, b) => {
    const ta = a?.modified ? new Date(a.modified).getTime() : 0;
    const tb = b?.modified ? new Date(b.modified).getTime() : 0;
    return tb - ta;
  });
}

function getReleaseYear(movie: FilmItem): number | null {
  const rawYear = movie?.year as
    | string
    | number
    | undefined;

  if (typeof rawYear === "number" && rawYear >= 1800 && rawYear < 3000) {
    return rawYear;
  }

  if (typeof rawYear === "string") {
    const parsed = parseInt(rawYear, 10);
    if (!Number.isNaN(parsed) && parsed >= 1800 && parsed < 3000) {
      return parsed;
    }
  }

  return null;
}

export async function HeroSectionWrapper() {
  try {
    const MIN_CINEMA_YEAR = 2025;
    
    // Fetch cinema movies and fallback in PARALLEL to avoid sequential waterfall
    // This reduces worst-case from 14 sequential API calls to ~2 parallel batches
    const [cinemaResult, fallbackResult] = await Promise.allSettled([
      // Primary: cinema movies (1 page, large limit)
      getFilmsByCategoryMultiple(
        CATEGORIES.PHIM_LE,
        1, // Only 1 page instead of 4 — much faster
        {
          sort_field: "modified",
          sort_type: "desc",
          chieurap: true,
          limit: 50, // Large limit to get enough from 1 page
        }
      ),
      // Fallback: regular movies (fetched in parallel, used only if cinema is empty)
      getFilmsByCategoryMultiple(
        CATEGORIES.PHIM_LE,
        1,
        {
          sort_field: "modified",
          sort_type: "desc",
          limit: 30,
        }
      ),
    ]);
    
    // Try cinema movies first
    const cinemaMovies = cinemaResult.status === "fulfilled" ? cinemaResult.value : [];
    let phimLeFiltered = (cinemaMovies || []).filter((movie) => {
      const isCinema =
        movie.chieurap === true ||
        (typeof movie.chieurap === "number" && movie.chieurap === 1);
      const year = getReleaseYear(movie);
      return isCinema && year !== null && year >= MIN_CINEMA_YEAR;
    });
    
    // If no cinema movies, use the fallback (already fetched in parallel)
    if (phimLeFiltered.length === 0) {
      const fallbackMovies = fallbackResult.status === "fulfilled" ? fallbackResult.value : [];
      phimLeFiltered = fallbackMovies || [];
    }
    
    // Sắp xếp theo modified time (mới nhất trước)
    const phimLeSorted = sortByModifiedDesc(phimLeFiltered);
    const phimLe = phimLeSorted.slice(0, 10);
    
    if (phimLe.length === 0) {
      return <div className="h-[60vh] bg-[#191b24]" />;
    }

    return <HeroSection movies={phimLe} />;
  } catch (error) {
    console.error("[HeroSectionWrapper] Error:", error);
    return <div className="h-[60vh] bg-[#191b24]" />;
  }
}
