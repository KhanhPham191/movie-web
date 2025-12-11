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
    
    // Tăng từ 3 pages lên 5 pages để có nhiều phim lẻ hơn sau khi filter
    const phimLeRaw = await getFilmsByCategoryMultiple(CATEGORIES.PHIM_LE, 5).catch((error) => {
      return [];
    });


    if (!phimLeRaw || phimLeRaw.length === 0) {
      return null;
    }

    const phimLeSorted = sortByModifiedDesc(phimLeRaw);
    
    // Filter để lấy phim lẻ theo năm phát hành hiện tại, target 15 phim để có buffer
    const phimLeFiltered = await filterPhimLeByCurrentYear(phimLeSorted, 15);
    
    // Lấy 10 phim đầu (hoặc tất cả nếu ít hơn 10)
    const phimLe = phimLeFiltered.slice(0, 10);


    // Chỉ hiển thị nếu có ít nhất 1 phim lẻ theo năm phát hành (không fallback)
    if (phimLe.length === 0) {
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
    // Throw error để Suspense có thể catch và hiển thị skeleton/error
    throw error;
  }
}
