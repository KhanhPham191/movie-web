import { HeroSection } from "@/components/hero-section";
import {
  getFilmsByCategoryMultiple,
  CATEGORIES,
  type FilmItem,
} from "@/lib/api";
import { isTrailerEpisode } from "@/lib/trailer";

function sortByModifiedDesc(movies: FilmItem[]): FilmItem[] {
  return [...(movies || [])].sort((a, b) => {
    const ta = a?.modified ? new Date(a.modified).getTime() : 0;
    const tb = b?.modified ? new Date(b.modified).getTime() : 0;
    return tb - ta;
  });
}

function isVietnamMovie(movie: FilmItem): boolean {
  return (movie.country || []).some((c) => c.slug === "viet-nam");
}

export async function HeroSectionWrapper() {
  try {
    /** Cùng nguồn với section Phim chiếu rạp: /v1/api/danh-sach/phim-chieu-rap */
    const raw = await getFilmsByCategoryMultiple(
      CATEGORIES.PHIM_CHIEU_RAP,
      2,
      {
        sort_field: "modified",
        sort_type: "desc",
        limit: 40,
      }
    ).catch(() => []);

    const phimLe = sortByModifiedDesc(
      (raw || []).filter(
        (m) => !isVietnamMovie(m) && !isTrailerEpisode(m.current_episode)
      )
    ).slice(0, 10);

    if (phimLe.length === 0) {
      return <div className="h-[60vh] bg-[#191b24]" />;
    }

    return <HeroSection movies={phimLe} />;
  } catch (error) {
    console.error("[HeroSectionWrapper] Error:", error);
    return <div className="h-[60vh] bg-[#191b24]" />;
  }
}
