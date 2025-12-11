import { MovieSection } from "@/components/movie-section";
import { getDailyUpdatedFilms, type FilmItem } from "@/lib/api";

export async function DailyUpdated() {
  try {
    
    const dailyUpdatedRes = await getDailyUpdatedFilms(1).catch((error) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { status: "error", message: errorMessage, items: [], paginate: { current_page: 1, total_page: 1, total_items: 0, items_per_page: 20 } };
    });

    // Kiểm tra nếu API trả về lỗi
    if (dailyUpdatedRes.status === "error") {
      return null; // Return null thay vì <></>
    }

    const dailyUpdated = dailyUpdatedRes.items || [];


    if (dailyUpdated.length === 0) {
      return null; // Return null thay vì <></>
    }

    return (
      <MovieSection
        title="Cập nhật hôm nay"
        movies={dailyUpdated}
        href="/danh-sach/phim-cap-nhat-hang-ngay"
        variant="portrait"
      />
    );
  } catch (error) {
    // Throw error để Suspense có thể catch và hiển thị skeleton/error
    throw error;
  }
}
