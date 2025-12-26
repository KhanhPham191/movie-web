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
    
    // Sử dụng API với filter năm hiện tại và chỉ lấy phim chiếu rạp, sort theo _id desc để lấy phim mới nhất
    // Lấy nhiều page với limit cao hơn để đảm bảo có đủ phim chiếu rạp
    const phimLeRaw = await getFilmsByCategoryMultiple(
      CATEGORIES.PHIM_LE,
      3, // Lấy 3 pages để có đủ phim chiếu rạp
      {
        sort_field: '_id',
        sort_type: 'desc',
        year: currentYear,
        chieurap: true, // Chỉ lấy phim chiếu rạp
        limit: 20 // Tăng limit để có đủ phim
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
