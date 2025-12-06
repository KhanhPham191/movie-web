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
    // Giảm từ 10 pages xuống 5 pages cho hero
    const phimLeRaw = await getFilmsByCategoryMultiple(CATEGORIES.PHIM_LE, 5);
    const phimLeSorted = sortByModifiedDesc(phimLeRaw || []);
    const phimLeFiltered = await filterPhimLeByCurrentYear(phimLeSorted, 10);
    const phimLe = phimLeFiltered.slice(0, 10);

    if (phimLe.length === 0) return <div className="h-[60vh] bg-[#05050a]" />;

    return <HeroSection movies={phimLe} />;
  } catch (error) {
    console.error("Error fetching Hero section:", error);
    return <div className="h-[60vh] bg-[#05050a]" />;
  }
}
