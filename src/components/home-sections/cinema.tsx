import { MovieSection } from "@/components/movie-section";
import {
  CATEGORIES,
  getFilmsByCategoryMultiple,
  getFilmsByGenreMultiple,
  type FilmItem,
} from "@/lib/api";
import { isTrailerEpisode } from "@/lib/trailer";

const TARGET_COUNT = 10;

/** Gộp 2 nguồn: phim lẻ + thể loại hoạt hình, lọc chieurap, trùng slug chỉ giữ 1. */
const LIST_OPTS = {
  sort_field: "modified",
  sort_type: "desc" as const,
  limit: 48,
};

function sortByModifiedDesc(movies: FilmItem[]): FilmItem[] {
  return [...movies].sort((a, b) => {
    const ta = a?.modified ? new Date(a.modified).getTime() : 0;
    const tb = b?.modified ? new Date(b.modified).getTime() : 0;
    return tb - ta;
  });
}

function dedupeBySlug(movies: FilmItem[]): FilmItem[] {
  const seen = new Set<string>();
  return movies.filter((m) => {
    if (!m.slug || seen.has(m.slug)) return false;
    seen.add(m.slug);
    return true;
  });
}

export async function CinemaSection() {
  const [phimLeRaw, hoatHinhRaw] = await Promise.all([
    getFilmsByCategoryMultiple(CATEGORIES.PHIM_LE, 6, LIST_OPTS).catch(() => []),
    getFilmsByGenreMultiple("hoat-hinh", 5, LIST_OPTS).catch(() => []),
  ]);

  const merged = dedupeBySlug([...(phimLeRaw || []), ...(hoatHinhRaw || [])]);

  const cinemaMovies = sortByModifiedDesc(
    merged.filter(
      (m) => m.chieurap === true && !isTrailerEpisode(m.current_episode)
    )
  ).slice(0, TARGET_COUNT);

  if (cinemaMovies.length === 0) return null;

  return (
    <MovieSection
      title="Phim chiếu rạp"
      movies={cinemaMovies}
      href="/danh-sach/phim-dang-chieu"
      variant="cinema"
    />
  );
}
