import { MovieSection } from "@/components/movie-section";
import { CATEGORIES, getFilmsByCategoryMultiple } from "@/lib/api";
import { isTrailerEpisode } from "@/lib/trailer";

const TARGET_COUNT = 10;

/** Một request: OPhim /v1/api/danh-sach/phim-chieu-rap */
const LIST_OPTS = {
  sort_field: "modified",
  sort_type: "desc" as const,
  limit: 48,
};

export async function CinemaSection() {
  const raw = await getFilmsByCategoryMultiple(
    CATEGORIES.PHIM_CHIEU_RAP,
    1,
    LIST_OPTS
  ).catch(() => []);

  const cinemaMovies = (raw || [])
    .filter((m) => !isTrailerEpisode(m.current_episode))
    .slice(0, TARGET_COUNT);

  if (cinemaMovies.length === 0) return null;

  return (
    <MovieSection
      title="Phim chiếu rạp"
      movies={cinemaMovies}
      href="/danh-sach/phim-chieu-rap"
      variant="cinema"
    />
  );
}
