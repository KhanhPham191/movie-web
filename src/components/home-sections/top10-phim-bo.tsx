import { MovieSectionWithNav } from "@/components/movie-section-with-nav";
import {
  getFilmsByCategoryMultiple,
  CATEGORIES,
  type FilmItem,
} from "@/lib/api";

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
    // Gọi trực tiếp API /v1/api/danh-sach/phim-bo với các filter
    // Ưu tiên phim mới nhất (dựa theo thời gian cập nhật / modified)
    // Không lọc riêng lồng tiếng, lấy tất cả phim bộ mới cập nhật
    const phimBoRaw = await getFilmsByCategoryMultiple(
      CATEGORIES.PHIM_BO,
      1, // Chỉ lấy 1 page
      {
        // Ưu tiên sort theo thời gian cập nhật từ API nếu có hỗ trợ
        // Sau đó vẫn sort lại theo modified ở phía client cho chắc chắn
        sort_field: "modified",
        sort_type: 'desc',
        limit: 10 // Chỉ lấy 10 phim đầu
      }
    ).catch((error) => {
      return [];
    });

    if (!phimBoRaw || phimBoRaw.length === 0) {
      return null;
    }

    // Sắp xếp theo modified time (mới nhất trước) để hiển thị phim mới cập nhật nhất
    const phimBoSorted = sortByModifiedDesc(phimBoRaw);
    
    // Lấy tối đa 10 phim đầu (đã được limit từ API)
    const top10Series = phimBoSorted.slice(0, 10);

    if (top10Series.length === 0) {
      return null; // Return null thay vì <></> để Suspense có thể catch
    }

    return (
      <MovieSectionWithNav
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
