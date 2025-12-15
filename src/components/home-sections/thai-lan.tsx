import { MovieSection } from "@/components/movie-section";
import { getFilmsByCountryMultiple } from "@/lib/api";

export async function ThaiLanSection() {
  try {
    // Giảm từ 2 pages xuống 1 page
    const thaiLan = await getFilmsByCountryMultiple("thai-lan", 1);

    if (thaiLan.length === 0) return <></>;

    return (
      <MovieSection
        title="Phim Thái Lan"
        movies={thaiLan}
        href="/quoc-gia/thai-lan"
        variant="portrait"
      />
    );
  } catch (error) {
    return <></>;
  }
}







