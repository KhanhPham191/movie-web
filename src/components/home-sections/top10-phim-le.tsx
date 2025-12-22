import { MovieSectionWithNav } from "@/components/movie-section-with-nav";
import { MovieSectionSkeleton } from "@/components/movie-skeleton";
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

export async function Top10PhimLe() {
  try {
    // Gọi trực tiếp API /v1/api/danh-sach/phim-le với các filter
    // Ưu tiên phim mới nhất (dựa theo thời gian cập nhật / modified)
    // Không khóa theo năm, lấy các phim lẻ mới cập nhật nhất
    const phimLeRaw = await getFilmsByCategoryMultiple(
      CATEGORIES.PHIM_LE, 
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

    if (!phimLeRaw || phimLeRaw.length === 0) {
      return null;
    }

    // Không filter phim chiếu rạp nữa, lấy tất cả phim lẻ từ API
    // Sắp xếp theo modified time (mới nhất trước) để hiển thị phim mới cập nhật nhất
    const phimLeSorted = sortByModifiedDesc(phimLeRaw);
    
    // Lấy tối đa 10 phim đầu (đã được limit từ API)
    const phimLe = phimLeSorted.slice(0, 10);


    // Chỉ hiển thị nếu có ít nhất 1 phim lẻ theo năm phát hành (không fallback)
    if (phimLe.length === 0) {
      return null; // Return null thay vì <></> để Suspense có thể catch
    }

    return (
      <MovieSectionWithNav
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
