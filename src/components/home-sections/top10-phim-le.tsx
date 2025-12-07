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
    // Giảm từ 5 pages xuống 3 pages để tối ưu
    const phimLeRaw = await getFilmsByCategoryMultiple(CATEGORIES.PHIM_LE, 3);
    const phimLeSorted = sortByModifiedDesc(phimLeRaw || []);
    const phimLeFiltered = await filterPhimLeByCurrentYear(phimLeSorted, 10);
    const phimLe = phimLeFiltered.slice(0, 10);

    if (phimLe.length === 0) return <></>;

    return (
      <MovieSection
        title="Top 10 phim lẻ"
        movies={phimLe}
        variant="newRelease"
      />
    );
  } catch (error) {
    console.error("Error fetching Top 10 phim lẻ:", error);
    return <></>;
  }
}
