import { MovieSection } from "@/components/movie-section";
import { getFilmsByCountryMultiple } from "@/lib/api";

export async function AuMySection() {
  try {
    // Giảm từ 2 pages xuống 1 page để tối ưu
    const auMy = await getFilmsByCountryMultiple("au-my", 1);

    if (auMy.length === 0) return <></>;

    return (
      <MovieSection
        title="Phim Âu Mỹ (US-UK)"
        movies={auMy}
        href="/quoc-gia/au-my"
        variant="cinema"
      />
    );
  } catch (error) {
    return <></>;
  }
}




