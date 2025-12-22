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
    
    // Sử dụng API với filter năm hiện tại, sort theo _id desc để lấy phim mới nhất
    // Chỉ lấy 1 page với limit 10
    const phimLeRaw = await getFilmsByCategoryMultiple(
      CATEGORIES.PHIM_LE,
      1, // Chỉ lấy 1 page
      {
        sort_field: '_id',
        sort_type: 'desc',
        year: currentYear,
        limit: 10 // Chỉ lấy 10 phim đầu
      }
    );
    
    // Sắp xếp theo modified time (mới nhất trước) để hiển thị phim mới cập nhật nhất
    const phimLeSorted = sortByModifiedDesc(phimLeRaw || []);
    
    // Lấy tối đa 10 phim đầu (đã được limit từ API, HeroSection sẽ lấy 5 phim đầu)
    const phimLe = phimLeSorted.slice(0, 10);
    
    // Chỉ hiển thị nếu có ít nhất 1 phim lẻ theo năm phát hành (không fallback)
    if (phimLe.length === 0) {
      return <div className="h-[60vh] bg-[#191b24]" />;
    }

    return <HeroSection movies={phimLe} />;
  } catch (error) {
    return <div className="h-[60vh] bg-[#191b24]" />;
  }
}
