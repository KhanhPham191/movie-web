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
    
    // Sử dụng Promise.allSettled để không fail khi một promise fail
    const results = await Promise.allSettled([
      getFilmsByCountryMultiple("han-quoc", 1).catch((err) => {
        return [];
      }),
      getFilmsByCountryMultiple("trung-quoc", 1).catch((err) => {
        return [];
      }),
      getFilmsByCountryMultiple("thai-lan", 1).catch((err) => {
        return [];
      }),
      getFilmsByCountryMultiple("au-my", 2).catch((err) => {
        return [];
      }),
    ]);

    // Xử lý kết quả từ Promise.allSettled
    const hanQuoc = results[0].status === "fulfilled" ? results[0].value : [];
    const trungQuoc = results[1].status === "fulfilled" ? results[1].value : [];
    const thaiLan = results[2].status === "fulfilled" ? results[2].value : [];
    const auMy = results[3].status === "fulfilled" ? results[3].value : [];

    // Lọc Trung Quốc
    const trungQuocFiltered = await filterChinaNonAnimation(trungQuoc || []);
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


    if (top10Series.length === 0) {
      return null; // Return null thay vì <></> để Suspense có thể catch
    }

    return (
      <MovieSection
        title="Top 10 phim bộ"
        movies={top10Series}
        variant="newRelease"
      />
    );
  } catch (error) {
    // Throw error để Suspense có thể catch và hiển thị skeleton/error
    throw error;
  }
}
