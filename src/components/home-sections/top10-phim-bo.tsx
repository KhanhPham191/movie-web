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

// Helper: lấy năm phát hành từ dữ liệu phim
function getReleaseYear(movie: FilmItem): number | null {
  if (movie.year) {
    const yearNum =
      typeof movie.year === "string" ? parseInt(movie.year, 10) : movie.year;
    if (!isNaN(yearNum) && isFinite(yearNum) && yearNum > 1900 && yearNum < 2100) {
      return yearNum;
    }
  }

  if (movie.created) {
    const createdYear = new Date(movie.created).getFullYear();
    if (!isNaN(createdYear) && isFinite(createdYear) && createdYear > 1900 && createdYear < 2100) {
      return createdYear;
    }
  }

  return null;
}

export async function Top10PhimBo() {
  try {
    // Gọi trực tiếp API /v1/api/danh-sach/phim-bo với các filter
    // Chỉ lấy phim bộ từ năm 2025 trở lên, ưu tiên phim mới nhất
    const phimBoRaw = await getFilmsByCategoryMultiple(
      CATEGORIES.PHIM_BO,
      1, // Chỉ lấy 1 page
      {
        // Ưu tiên sort theo thời gian cập nhật từ API nếu có hỗ trợ
        // Sau đó vẫn sort lại theo modified ở phía client cho chắc chắn
        sort_field: "modified",
        sort_type: "desc",
        year: 2025, // filter năm từ API (nếu backend hỗ trợ)
        limit: 50, // lấy nhiều hơn để đủ sau khi lọc >= 2025
      }
    ).catch((error) => {
      return [];
    });

    if (!phimBoRaw || phimBoRaw.length === 0) {
      return null;
    }

    // Filter chỉ lấy phim có năm >= 2025 (dựa vào year/created)
    const phimBoFiltered = phimBoRaw.filter((movie) => {
      const year = getReleaseYear(movie);
      return year !== null && year >= 2025;
    });

    // Sắp xếp theo modified time (mới nhất trước) để hiển thị phim mới cập nhật nhất
    const phimBoSorted = sortByModifiedDesc(phimBoFiltered);
    
    // Lấy tối đa 10 phim đầu (sau khi lọc)
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
