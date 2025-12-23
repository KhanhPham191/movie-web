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

// Helper: lấy năm phát hành từ phim
function getReleaseYear(movie: FilmItem): number | null {
  // Ưu tiên lấy từ field year nếu có
  if (movie.year) {
    const yearNum = typeof movie.year === 'string' ? parseInt(movie.year, 10) : movie.year;
    if (!isNaN(yearNum) && isFinite(yearNum) && yearNum > 1900 && yearNum < 2100) {
      return yearNum;
    }
  }
  
  // Fallback: lấy từ created date
  if (movie.created) {
    const date = new Date(movie.created);
    const yearValue = date.getFullYear();
    if (!isNaN(yearValue) && isFinite(yearValue) && yearValue > 1900 && yearValue < 2100) {
      return yearValue;
    }
  }
  
  return null;
}

export async function Top10PhimLe() {
  try {
    // Gọi trực tiếp API /v1/api/danh-sach/phim-le với các filter
    // Chỉ lấy phim từ năm 2025 trở lên
    // Lấy nhiều phim hơn để có đủ sau khi filter theo năm
    const phimLeRaw = await getFilmsByCategoryMultiple(
      CATEGORIES.PHIM_LE, 
      1, // Chỉ lấy 1 page
      {
        // Ưu tiên sort theo thời gian cập nhật từ API nếu có hỗ trợ
        // Sau đó vẫn sort lại theo modified ở phía client cho chắc chắn
        sort_field: "modified",
        sort_type: 'desc',
        year: 2025, // Filter theo năm 2025
        limit: 50 // Lấy nhiều hơn để có đủ sau khi filter >= 2025
      }
    ).catch((error) => {
      return [];
    });

    if (!phimLeRaw || phimLeRaw.length === 0) {
      return null;
    }

    // Filter chỉ lấy phim có năm >= 2025
    const phimLeFiltered = phimLeRaw.filter((movie) => {
      const year = getReleaseYear(movie);
      return year !== null && year >= 2025;
    });

    // Sắp xếp theo modified time (mới nhất trước) để hiển thị phim mới cập nhật nhất
    const phimLeSorted = sortByModifiedDesc(phimLeFiltered);
    
    // Lấy tối đa 10 phim đầu
    const phimLe = phimLeSorted.slice(0, 10);

    // Chỉ hiển thị nếu có ít nhất 1 phim lẻ từ năm 2025 trở lên
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
