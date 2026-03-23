import { MovieSectionWithNav } from "@/components/movie-section-with-nav";
import { getFilmsByCountryMultiple } from "@/lib/api";
import { isTrailerEpisode } from "@/lib/trailer";

export async function ThaiLanSection() {
  try {
    // Lấy phim Thái Lan mới cập nhật nhất (phim bộ + lẻ) trong 1 page
    const thaiLan = await getFilmsByCountryMultiple("thai-lan", 1, {
      sort_field: "modified",
      sort_type: "desc",
      limit: 20,
    });

    const thaiLanFiltered = thaiLan.filter(
      (movie) => !isTrailerEpisode(movie.current_episode)
    );

    if (thaiLanFiltered.length === 0) return <></>;

    return (
      <MovieSectionWithNav
        title="Phim Thái Lan"
        movies={thaiLanFiltered}
        href="/quoc-gia/thai-lan"
        variant="series"
        disableTilt={true}
      />
    );
  } catch (error) {
    return <></>;
  }
}









