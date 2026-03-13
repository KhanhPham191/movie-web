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
    
    // Chạy tất cả strategies song song thay vì tuần tự để tránh waterfall
    const [strategy1Result, strategy2Result, strategy3Result] = await Promise.allSettled([
      // Strategy 1: Phim chiếu rạp mới nhất, 2 pages (giảm từ 4)
      getFilmsByCategoryMultiple(
        CATEGORIES.PHIM_LE,
        2,
        {
          sort_field: "modified",
          sort_type: "desc",
          chieurap: true,
          limit: 40,
        }
      ),
      // Strategy 2: Phim chiếu rạp, nhiều hơn
      getFilmsByCategoryMultiple(
        CATEGORIES.PHIM_LE,
        1,
        {
          sort_field: "modified",
          sort_type: "desc",
          chieurap: true,
          limit: 50,
        }
      ),
      // Strategy 3: Phim lẻ mới nhất (fallback, không filter chieurap)
      getFilmsByCategoryMultiple(
        CATEGORIES.PHIM_LE,
        1,
        {
          sort_field: 'modified',
          sort_type: 'desc',
          limit: 30
        }
      ),
    ]);
    
    // Lọc kết quả từ strategy 1
    const raw1 = strategy1Result.status === 'fulfilled' ? strategy1Result.value : [];
    let phimLeFiltered = (raw1 || []).filter((movie) => {
      const isCinema =
        movie.chieurap === true ||
        (typeof movie.chieurap === "number" && movie.chieurap === 1);
      const year = getReleaseYear(movie);
      return isCinema && year !== null && year >= MIN_CINEMA_YEAR;
    });
    
    // Nếu strategy 1 trống, thử strategy 2
    if (phimLeFiltered.length === 0) {
      const raw2 = strategy2Result.status === 'fulfilled' ? strategy2Result.value : [];
      phimLeFiltered = (raw2 || []).filter((movie) => {
        const isCinema =
          movie.chieurap === true ||
          (typeof movie.chieurap === "number" && movie.chieurap === 1);
        const year = getReleaseYear(movie);
        return isCinema && year !== null && year >= MIN_CINEMA_YEAR;
      });
    }
    
    // Nếu vẫn trống, dùng strategy 3 (phim lẻ mới nhất)
    if (phimLeFiltered.length === 0) {
      const raw3 = strategy3Result.status === 'fulfilled' ? strategy3Result.value : [];
      phimLeFiltered = raw3 || [];
    }
    
    // Loại bỏ phim Việt Nam
    phimLeFiltered = phimLeFiltered.filter(
      (movie) => !(movie.country || []).some((c) => c.slug === "viet-nam")
    );

    // Sắp xếp theo modified time (mới nhất trước) để hiển thị phim mới cập nhật nhất
    const phimLeSorted = sortByModifiedDesc(phimLeFiltered);
    
    // Lấy tối đa 10 phim đầu (đã được limit từ API, HeroSection sẽ lấy 5 phim đầu)
    const phimLe = phimLeSorted.slice(0, 10);
    
    // Nếu vẫn không có phim, hiển thị placeholder
    if (phimLe.length === 0) {
      return <div className="h-[60vh] bg-[#191b24]" />;
    }

    return <HeroSection movies={phimLe} />;
  } catch (error) {
    console.error("[HeroSectionWrapper] Error:", error);
    return <div className="h-[60vh] bg-[#191b24]" />;
  }
}
