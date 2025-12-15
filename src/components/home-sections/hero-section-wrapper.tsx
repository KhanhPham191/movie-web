import { HeroSection } from "@/components/hero-section";
import {
  getFilmsByCategoryMultiple,
  CATEGORIES,
  type FilmItem,
} from "@/lib/api";
import { filterPhimLeByCurrentYear } from "@/lib/filters";

function sortByModifiedDesc(movies: FilmItem[]): FilmItem[] {
  return [...(movies || [])].sort((a, b) => {
    const ta = a?.modified ? new Date(a.modified).getTime() : 0;
    const tb = b?.modified ? new Date(b.modified).getTime() : 0;
    return tb - ta;
  });
}

export async function HeroSectionWrapper() {
  try {
    // Tăng từ 3 pages lên 5 pages để có nhiều phim lẻ hơn sau khi filter
    const phimLeRaw = await getFilmsByCategoryMultiple(CATEGORIES.PHIM_LE, 5);
    const phimLeSorted = sortByModifiedDesc(phimLeRaw || []);
    
    // Filter để lấy phim lẻ theo năm phát hành hiện tại, target 10 phim (HeroSection cần 5 phim)
    const phimLeFiltered = await filterPhimLeByCurrentYear(phimLeSorted, 10);
    
    // Lấy 10 phim đầu (HeroSection sẽ lấy 5 phim đầu)
    const phimLe = phimLeFiltered.slice(0, 10);
    
    // Chỉ hiển thị nếu có ít nhất 1 phim lẻ theo năm phát hành (không fallback)
    if (phimLe.length === 0) {
      return <div className="h-[60vh] bg-[#191b24]" />;
    }

    return <HeroSection movies={phimLe} />;
  } catch (error) {
    return <div className="h-[60vh] bg-[#191b24]" />;
  }
}
