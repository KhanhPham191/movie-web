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
    
    // Strategy 1: Lấy phim chiếu rạp mới nhất, filter năm >= 2025
    let phimLeRaw = await getFilmsByCategoryMultiple(
      CATEGORIES.PHIM_LE,
      4, // Lấy nhiều page để đủ phim chiếu rạp các năm gần đây
      {
        sort_field: "modified",
        sort_type: "desc",
        chieurap: true,
        limit: 40,
      }
    );
    
    // Filter chỉ lấy phim chiếu rạp và năm >= 2025
    let phimLeFiltered = (phimLeRaw || []).filter((movie) => {
      const isCinema =
        movie.chieurap === true ||
        (typeof movie.chieurap === "number" && movie.chieurap === 1);
      const year = getReleaseYear(movie);
      return isCinema && year !== null && year >= MIN_CINEMA_YEAR;
    });
    
    // Strategy 2: Nếu chưa có, lấy thêm phim chiếu rạp không filter năm rồi lọc >= 2025
    if (phimLeFiltered.length === 0) {
      phimLeRaw = await getFilmsByCategoryMultiple(
        CATEGORIES.PHIM_LE,
        5,
        {
          sort_field: "modified",
          sort_type: "desc",
          chieurap: true,
          limit: 50,
        }
      );
      
      phimLeFiltered = (phimLeRaw || []).filter((movie) => {
        const isCinema =
          movie.chieurap === true ||
          (typeof movie.chieurap === "number" && movie.chieurap === 1);
        const year = getReleaseYear(movie);
        return isCinema && year !== null && year >= MIN_CINEMA_YEAR;
      });
    }
    
    // Strategy 3: Nếu vẫn không có phim chiếu rạp, lấy phim lẻ mới nhất (không filter chieurap)
    if (phimLeFiltered.length === 0) {
      phimLeRaw = await getFilmsByCategoryMultiple(
        CATEGORIES.PHIM_LE,
        5, // Lấy nhiều pages hơn
        {
          sort_field: 'modified',
          sort_type: 'desc',
          limit: 30
        }
      );
      
      phimLeFiltered = phimLeRaw || [];
    }
    
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
