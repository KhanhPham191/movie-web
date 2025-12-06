import { MovieSection } from "@/components/movie-section";
import { getDailyUpdatedFilms, type FilmItem } from "@/lib/api";

export async function DailyUpdated() {
  try {
    const dailyUpdatedRes = await getDailyUpdatedFilms(1);
    const dailyUpdated = dailyUpdatedRes.items || [];

    if (dailyUpdated.length === 0) return <></>;

    return (
      <MovieSection
        title="Cập nhật hôm nay"
        movies={dailyUpdated}
        href="/danh-sach/phim-cap-nhat-hang-ngay"
        variant="portrait"
      />
    );
  } catch (error) {
    console.error("Error fetching daily updated:", error);
    return <></>;
  }
}
