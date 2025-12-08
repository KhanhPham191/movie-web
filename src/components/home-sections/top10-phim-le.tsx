import { MovieSection } from "@/components/movie-section";
import { MovieSectionSkeleton } from "@/components/movie-skeleton";
import {
  getFilmsByCategoryMultiple,
  CATEGORIES,
  type FilmItem,
} from "@/lib/api";
import { filterPhimLeByCurrentYear } from "@/lib/filters";

// Helper: sắp xếp phim theo thời gian cập nhật mới nhất
function sortByModifiedDesc(movies: FilmItem[]): FilmItem[] {
  return [...(movies || [])].sort((a, b) => {
    const ta = a?.modified ? new Date(a.modified).getTime() : 0;
    const tb = b?.modified ? new Date(b.modified).getTime() : 0;
    return tb - ta;
  });
}

export async function Top10PhimLe() {
  try {
    console.log("[Top10PhimLe] Starting to fetch data...");
    
    const phimLeRaw = await getFilmsByCategoryMultiple(CATEGORIES.PHIM_LE, 3).catch((error) => {
      console.error("[Top10PhimLe] Failed to fetch phim le:", error);
      return [];
    });

    console.log("[Top10PhimLe] Fetched phimLeRaw length:", phimLeRaw?.length || 0);

    const phimLeSorted = sortByModifiedDesc(phimLeRaw || []);
    const phimLeFiltered = await filterPhimLeByCurrentYear(phimLeSorted, 10);
    const phimLe = phimLeFiltered.slice(0, 10);

    console.log("[Top10PhimLe] Final phimLe length:", phimLe.length);

    if (phimLe.length === 0) {
      console.warn("[Top10PhimLe] No movies found, returning null");
      return null; // Return null thay vì <></> để Suspense có thể catch
    }

    return (
      <MovieSection
        title="Top 10 phim lẻ"
        movies={phimLe}
        variant="newRelease"
      />
    );
  } catch (error) {
    console.error("[Top10PhimLe] Unexpected error:", error);
    // Throw error để Suspense có thể catch và hiển thị skeleton/error
    throw error;
  }
}
