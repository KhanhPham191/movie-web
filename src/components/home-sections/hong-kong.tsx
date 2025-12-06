import { MovieSection } from "@/components/movie-section";
import { getFilmsByCountryMultiple } from "@/lib/api";

export async function HongKongSection() {
  try {
    // Giảm từ 2 pages xuống 1 page
    const hongKong = await getFilmsByCountryMultiple("hong-kong", 1);

    if (hongKong.length === 0) return <></>;

    return (
      <MovieSection
        title="Phim Hồng Kông"
        movies={hongKong}
        href="/quoc-gia/hong-kong"
        variant="portrait"
      />
    );
  } catch (error) {
    console.error("Error fetching Hồng Kông:", error);
    return <></>;
  }
}
