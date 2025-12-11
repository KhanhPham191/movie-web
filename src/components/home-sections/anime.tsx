import { MovieSection } from "@/components/movie-section";
import { getFilmsByGenreMultiple } from "@/lib/api";

export async function AnimeSection() {
  try {
    // Giảm từ 2 pages xuống 1 page
    const [anime, hoatHinh] = await Promise.all([
      getFilmsByGenreMultiple("anime", 1),
      getFilmsByGenreMultiple("hoat-hinh", 1),
    ]);

    const movies = anime.length > 0 ? anime : hoatHinh;
    const href = anime.length > 0 ? "/the-loai/anime" : "/the-loai/hoat-hinh";

    if (movies.length === 0) return <></>;

    return (
      <MovieSection
        title="Phim Anime"
        movies={movies}
        href={href}
        variant="portrait"
      />
    );
  } catch (error) {
    return <></>;
  }
}




