import { MovieSectionWithNav } from "@/components/movie-section-with-nav";
import { getFilmsByCountryMultiple } from "@/lib/api";

export async function ThaiLanSection() {
  try {
    // Giảm từ 2 pages xuống 1 page
    const thaiLan = await getFilmsByCountryMultiple("thai-lan", 1);

    if (thaiLan.length === 0) return <></>;

    return (
      <MovieSectionWithNav
        title="Phim Thái Lan"
        movies={thaiLan}
        href="/quoc-gia/thai-lan"
        variant="series"
        disableTilt={true}
      />
    );
  } catch (error) {
    return <></>;
  }
}









