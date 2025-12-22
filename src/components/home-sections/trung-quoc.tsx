import { MovieSectionWithNav } from "@/components/movie-section-with-nav";
import { getFilmsByCategoryMultiple, CATEGORIES, type FilmItem } from "@/lib/api";

function sortByModifiedDesc(movies: FilmItem[]): FilmItem[] {
  return [...(movies || [])].sort((a, b) => {
    const ta = a?.modified ? new Date(a.modified).getTime() : 0;
    const tb = b?.modified ? new Date(b.modified).getTime() : 0;
    return tb - ta;
  });
}

export async function TrungQuocSection() {
  try {
    // Sử dụng API /v1/api/danh-sach với filter country=trung-quoc
    // Lấy tất cả type_list (phim-bo, phim-le, tv-shows) nhưng filter country=trung-quoc
    // Và loại bỏ phim có category hoạt hình
    
    // Gọi API với country filter - có thể cần gọi nhiều type_list
    // Thử gọi phim-bo và phim-le với country=trung-quoc
    const [phimBo, phimLe] = await Promise.allSettled([
      getFilmsByCategoryMultiple(CATEGORIES.PHIM_BO, 1, {
        // Ưu tiên phim bộ Trung Quốc mới cập nhật nhất
        sort_field: "modified",
        sort_type: "desc",
        country: "trung-quoc",
        limit: 20
      }).catch(() => []),
      getFilmsByCategoryMultiple(CATEGORIES.PHIM_LE, 1, {
        // Ưu tiên phim lẻ Trung Quốc mới cập nhật nhất
        sort_field: "modified",
        sort_type: "desc",
        country: "trung-quoc",
        limit: 20
      }).catch(() => [])
    ]);

    const phimBoList = phimBo.status === 'fulfilled' ? phimBo.value : [];
    const phimLeList = phimLe.status === 'fulfilled' ? phimLe.value : [];
    
    // Combine và loại bỏ duplicate
    const allMovies = [...phimBoList, ...phimLeList];
    const uniqueMovies = Array.from(
      new Map(allMovies.map(m => [m.slug, m])).values()
    );

    // Filter loại bỏ phim có category hoạt hình
    const trungQuocFiltered = uniqueMovies.filter((movie) => {
      if (!movie.category || !Array.isArray(movie.category)) return true;
      // Loại bỏ nếu có category "Hoạt Hình" hoặc "hoat-hinh"
      return !movie.category.some(
        (cat: any) => 
          cat?.slug === 'hoat-hinh' || 
          cat?.name?.toLowerCase().includes('hoạt hình') ||
          cat?.name?.toLowerCase().includes('hoat hinh')
      );
    });

    const desiredChinaCount = 10;
    const trungQuocDisplay: FilmItem[] = sortByModifiedDesc(trungQuocFiltered || []).slice(0, desiredChinaCount);

    if (trungQuocDisplay.length === 0) return <></>;

    return (
      <MovieSectionWithNav
        title="Phim Trung Quốc"
        movies={trungQuocDisplay}
        href="/quoc-gia/trung-quoc"
        variant="series"
        disableTilt={true}
      />
    );
  } catch (error) {
    return <></>;
  }
}









