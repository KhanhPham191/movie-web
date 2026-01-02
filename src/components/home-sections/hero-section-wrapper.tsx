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

export async function HeroSectionWrapper() {
  try {
    // Lấy năm hiện tại để filter
    const currentYear = new Date().getFullYear();
    
    // Strategy 1: Thử lấy phim chiếu rạp của năm hiện tại
    let phimLeRaw = await getFilmsByCategoryMultiple(
      CATEGORIES.PHIM_LE,
      3, // Lấy 3 pages để có đủ phim chiếu rạp
      {
        sort_field: 'modified',
        sort_type: 'desc',
        year: currentYear,
        chieurap: true, // Chỉ lấy phim chiếu rạp
        limit: 20
      }
    );
    
    // Filter chỉ lấy phim có chieurap: true
    let phimLeFiltered = (phimLeRaw || []).filter((movie) => {
      return movie.chieurap === true || (typeof movie.chieurap === 'number' && movie.chieurap === 1);
    });
    
    // Strategy 2: Nếu không có phim chiếu rạp năm hiện tại, lấy phim chiếu rạp mới nhất (không filter năm)
    if (phimLeFiltered.length === 0) {
      phimLeRaw = await getFilmsByCategoryMultiple(
        CATEGORIES.PHIM_LE,
        5, // Lấy nhiều pages hơn
        {
          sort_field: 'modified',
          sort_type: 'desc',
          chieurap: true, // Chỉ lấy phim chiếu rạp, không filter năm
          limit: 30
        }
      );
      
      phimLeFiltered = (phimLeRaw || []).filter((movie) => {
        return movie.chieurap === true || (typeof movie.chieurap === 'number' && movie.chieurap === 1);
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
