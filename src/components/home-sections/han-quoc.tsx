import { MovieSection } from "@/components/movie-section";
import { getFilmsByCountryMultiple } from "@/lib/api";

export async function HanQuocSection() {
  try {
    // Giảm từ 2 pages xuống 1 page
    const hanQuoc = await getFilmsByCountryMultiple("han-quoc", 1);

    if (hanQuoc.length === 0) return <></>;

    return (
      <MovieSection
        title="Phim Hàn Quốc"
        movies={hanQuoc}
        href="/quoc-gia/han-quoc"
        variant="series"
      />
    );
  } catch (error) {
    return <></>;
  }
}







