import { MovieSection } from "@/components/movie-section";
import { getFilmsByCountryMultiple } from "@/lib/api";

export async function AuMySection() {
  try {
    // Giảm từ 5 pages xuống 2 pages
    const auMy = await getFilmsByCountryMultiple("au-my", 2);

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
    console.error("Error fetching Âu Mỹ:", error);
    return <></>;
  }
}
