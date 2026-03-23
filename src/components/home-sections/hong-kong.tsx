import { MovieSectionWithNav } from "@/components/movie-section-with-nav";
import { getFilmsByCountryMultiple } from "@/lib/api";
import { isTrailerEpisode } from "@/lib/trailer";

export async function HongKongSection() {
  try {
    // Lấy phim Hồng Kông mới cập nhật nhất (phim bộ + lẻ) trong 1 page
    const hongKong = await getFilmsByCountryMultiple("hong-kong", 1, {
      sort_field: "modified",
      sort_type: "desc",
      limit: 20,
    });

    const hongKongFiltered = hongKong.filter(
      (movie) => !isTrailerEpisode(movie.current_episode)
    );

    if (hongKongFiltered.length === 0) return <></>;

    return (
      <MovieSectionWithNav
        title="Phim Hồng Kông"
        movies={hongKongFiltered}
        href="/quoc-gia/hong-kong"
        variant="series"
        disableTilt={true}
      />
    );
  } catch (error) {
    return <></>;
  }
}









