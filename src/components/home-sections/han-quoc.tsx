import { MovieSectionWithNav } from "@/components/movie-section-with-nav";
import { getFilmsByCountryMultiple } from "@/lib/api";

export async function HanQuocSection() {
  try {
    // Lấy phim Hàn Quốc mới cập nhật nhất (phim bộ + lẻ) trong 1 page
    const hanQuoc = await getFilmsByCountryMultiple("han-quoc", 1, {
      sort_field: "modified",
      sort_type: "desc",
      limit: 20,
    });

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









