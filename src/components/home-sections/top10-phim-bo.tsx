import { MovieSection } from "@/components/movie-section";
import {
  getFilmsByCountryMultiple,
  type FilmItem,
} from "@/lib/api";
import { filterChinaNonAnimation } from "@/lib/filters";

// Helper: sắp xếp phim theo thời gian cập nhật mới nhất
function sortByModifiedDesc(movies: FilmItem[]): FilmItem[] {
  return [...(movies || [])].sort((a, b) => {
    const ta = a?.modified ? new Date(a.modified).getTime() : 0;
    const tb = b?.modified ? new Date(b.modified).getTime() : 0;
    return tb - ta;
  });
}

export async function Top10PhimBo() {
  try {
    // Giảm số pages để tối ưu: 1 page mỗi country
    const [hanQuoc, trungQuoc, thaiLan, auMy] = await Promise.all([
      getFilmsByCountryMultiple("han-quoc", 1),
      getFilmsByCountryMultiple("trung-quoc", 1),
      getFilmsByCountryMultiple("thai-lan", 1),
      getFilmsByCountryMultiple("au-my", 2),
    ]);

    // Lọc Trung Quốc
    const trungQuocFiltered = await filterChinaNonAnimation(trungQuoc);
    const trungQuocDisplay: FilmItem[] = sortByModifiedDesc(trungQuocFiltered || []).slice(0, 10);

    // Top 10 phim bộ
    const top10Series: FilmItem[] = [];

    function pushSeries(source: FilmItem[] | undefined, count: number) {
      if (!source || count <= 0) return;
      const sorted = sortByModifiedDesc(source);
      for (const movie of sorted) {
        if (!movie?.slug) continue;
        if ((movie.total_episodes || 0) < 2) continue;
        top10Series.push(movie);
        if (top10Series.length >= 10) return;
        if (--count <= 0) return;
      }
    }

    pushSeries(auMy, 3);
    pushSeries(hanQuoc, 3);
    pushSeries(trungQuocDisplay, 2);
    pushSeries(thaiLan, 2);

    // Fallback nếu thiếu
    if (top10Series.length < 10) {
      const fallbackPools: FilmItem[][] = [
        auMy || [],
        hanQuoc || [],
        trungQuocDisplay || [],
        thaiLan || [],
      ];
      for (const pool of fallbackPools) {
        for (const movie of sortByModifiedDesc(pool)) {
          if (!movie?.slug) continue;
          if ((movie.total_episodes || 0) < 2) continue;
          top10Series.push(movie);
          if (top10Series.length >= 10) break;
        }
        if (top10Series.length >= 10) break;
      }
    }

    if (top10Series.length === 0) return <></>;

    return (
      <MovieSection
        title="Top 10 phim bộ"
        movies={top10Series}
        variant="newRelease"
      />
    );
  } catch (error) {
    console.error("Error fetching Top 10 phim bộ:", error);
    return <></>;
  }
}
