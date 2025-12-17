import { MovieSectionWithNav } from "@/components/movie-section-with-nav";
import { getFilmsByCountryMultiple } from "@/lib/api";

export async function HanQuocSection() {
  try {
    // Giảm từ 2 pages xuống 1 page
    const hanQuoc = await getFilmsByCountryMultiple("han-quoc", 1);

    if (hanQuoc.length === 0) return <></>;

    return (
      <MovieSectionWithNav
        title="Phim Hàn Quốc"
        movies={hanQuoc}
        href="/quoc-gia/han-quoc"
        variant="series"
        disableTilt={true}
      />
    );
  } catch (error) {
    return <></>;
  }
}









