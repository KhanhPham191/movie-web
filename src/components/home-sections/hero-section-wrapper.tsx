import { HeroSection } from "@/components/hero-section";
import {
  getNewlyUpdatedFilmsMultiple,
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
    // Ưu tiên dùng phim mới cập nhật để trigger nhanh
    const phimLeUpdated = await getNewlyUpdatedFilmsMultiple(3).catch((error) => {
      console.error("[HeroSection] Failed to fetch newly updated films:", error);
      return [];
    });

    // Fallback sang category nếu updated rỗng
    const phimLeRaw =
      phimLeUpdated.length > 0
        ? phimLeUpdated
        : await getFilmsByCategoryMultiple(CATEGORIES.PHIM_LE, 3).catch((error) => {
            console.error("[HeroSection] Failed to fetch phim le category:", error);
            return [];
          });

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
