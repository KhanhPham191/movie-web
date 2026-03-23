import { MovieSectionWithNav } from "@/components/movie-section-with-nav";
import { getFilmsByCountryMultiple } from "@/lib/api";
import { isTrailerEpisode } from "@/lib/trailer";

export async function HanQuocSection() {
  try {
    // Lấy phim Hàn Quốc mới cập nhật nhất (phim bộ + lẻ) trong 1 page
    const hanQuoc = await getFilmsByCountryMultiple("han-quoc", 1, {
      sort_field: "modified",
      sort_type: "desc",
      limit: 20,
    });

    const hanQuocFiltered = hanQuoc.filter(
      (movie) => !isTrailerEpisode(movie.current_episode)
    );

    if (hanQuocFiltered.length === 0) return <></>;

    return (
      <MovieSectionWithNav
        title="Phim Hàn Quốc"
        movies={hanQuocFiltered}
        href="/quoc-gia/han-quoc"
        variant="series"
        disableTilt={true}
      />
    );
  } catch (error) {
    return <></>;
  }
}









