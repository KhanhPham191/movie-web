import { Suspense } from "react";
import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { CategoryPills } from "@/components/category-pills";
import { MovieSection } from "@/components/movie-section";
import { Footer } from "@/components/footer";
import { MovieSectionSkeleton } from "@/components/movie-skeleton";
import {
  getNewlyUpdatedFilmsMultiple,
  getFilmsByCategoryMultiple,
  getFilmsByGenreMultiple,
  getFilmsByCountryMultiple,
  getDailyUpdatedFilms,
  CATEGORIES,
  type FilmItem,
} from "@/lib/api";
import { filterChinaNonAnimation, filterPhimLeByCurrentYear } from "@/lib/filters";

// Helper: sắp xếp phim theo thời gian cập nhật mới nhất (field modified)
function sortByModifiedDesc(movies: FilmItem[]): FilmItem[] {
  return [...(movies || [])].sort((a, b) => {
    const ta = a?.modified ? new Date(a.modified).getTime() : 0;
    const tb = b?.modified ? new Date(b.modified).getTime() : 0;
    return tb - ta; // mới trước, cũ sau
  });
}

// ISR: Revalidate every 30 seconds for real-time updates
export const revalidate = 30;

// Fetch data
async function getHomePageData() {
  try {
    const [
      newlyUpdated,
      dailyUpdatedRes,
      phimLeRaw,
      phimBoTopRaw,
      phimBoTinhCam,
      hanQuoc,
      trungQuoc,
      nhatBan,
      hongKong,
      auMy,
      hoatHinh,
      anime,
      thaiLan,
    ] = await Promise.all([
      getNewlyUpdatedFilmsMultiple(3),
      getDailyUpdatedFilms(1),
      getFilmsByCategoryMultiple(CATEGORIES.PHIM_LE, 10), // Tăng lên 10 pages để có đủ phim sau khi filter theo năm
      getFilmsByCategoryMultiple(CATEGORIES.PHIM_BO, 3),
      // Phim bộ đang hot: lấy theo thể loại "tình cảm"
      getFilmsByGenreMultiple("tinh-cam", 3),
      getFilmsByCountryMultiple("han-quoc", 2),
      getFilmsByCountryMultiple("trung-quoc", 2),
      getFilmsByCountryMultiple("nhat-ban", 2),
      getFilmsByCountryMultiple("hong-kong", 2),
      getFilmsByCountryMultiple("au-my", 5), // Tăng lên 5 pages để đảm bảo có đủ phim bộ US-UK sau khi filter
      getFilmsByGenreMultiple("hoat-hinh", 2),
      getFilmsByGenreMultiple("anime", 2),
      getFilmsByCountryMultiple("thai-lan", 2),
    ]);

    // "Cập nhật hôm nay" lấy thẳng từ API, không còn loại trùng với "phim mới cập nhật"
    const dailyUpdated = dailyUpdatedRes.items || [];

    // Top 10 phim lẻ:
    // - Lọc chỉ lấy phim có năm phát hành = năm hiện tại (UTC+7)
    // - Kiểm tra năm phát hành từ category detail (mục số 3)
    // - Sắp xếp theo thời gian cập nhật mới nhất (field modified)
    // - Lấy 10 phim đầu
    // Lưu ý: Sắp xếp trước khi filter để ưu tiên phim mới cập nhật nhất
    const phimLeSorted = sortByModifiedDesc(phimLeRaw || []);
    const phimLeFiltered = await filterPhimLeByCurrentYear(phimLeSorted, 10);
    const phimLe = phimLeFiltered.slice(0, 10);

    // Lọc lại chỉ giữ phim bộ (nhiều tập) cho section "Phim bộ tình cảm"
    const phimBo = (phimBoTinhCam || []).filter(
      (movie) => movie.total_episodes && movie.total_episodes > 1
    );

    // Danh mục test: chỉ giữ phim Trung Quốc nhưng không phải thể loại Hoạt Hình,
    // dựa trên category chi tiết từ /api/film/{slug}
    const trungQuocFiltered = await filterChinaNonAnimation(trungQuoc);

    // Nếu sau khi lọc chi tiết mà danh sách quá ít (vd chỉ còn vài phim),
    // thì bổ sung thêm từ danh sách gốc để hiển thị cho đầy đủ ngoài trang chủ.
    const desiredChinaCount = 12;
    const trungQuocSeen = new Set((trungQuocFiltered || []).map((m) => m.slug));
    const trungQuocDisplay: FilmItem[] = [...(trungQuocFiltered || [])];
    if (trungQuocDisplay.length < desiredChinaCount) {
      for (const movie of trungQuoc || []) {
        if (!movie?.slug) continue;
        if (trungQuocSeen.has(movie.slug)) continue;
        trungQuocDisplay.push(movie);
        trungQuocSeen.add(movie.slug);
        if (trungQuocDisplay.length >= desiredChinaCount) break;
      }
    }

    // Top 10 phim bộ: lấy theo combo 3 Âu Mỹ, 3 Hàn, 2 Trung, 2 Thái (ưu tiên phim bộ, mới cập nhật nhất)
    const top10Series: FilmItem[] = [];

    function pushSeries(source: FilmItem[] | undefined, count: number) {
      if (!source || count <= 0) return;
      const sorted = sortByModifiedDesc(source);
      for (const movie of sorted) {
        if (!movie?.slug) continue;
        if ((movie.total_episodes || 0) < 2) continue; // chỉ lấy phim bộ
        top10Series.push(movie);
        if (top10Series.length >= 10) return;
        if (--count <= 0) return;
      }
    }

    // 3 Âu Mỹ, 3 Hàn, 2 Trung, 2 Thái
    pushSeries(auMy, 3);
    pushSeries(hanQuoc, 3);
    pushSeries(trungQuocDisplay, 2);
    pushSeries(thaiLan, 2);

    // Nếu vì thiếu dữ liệu mà chưa đủ 10, bổ sung từ tất cả nguồn series còn lại
    if (top10Series.length < 10) {
      const fallbackPools: FilmItem[][] = [
        auMy || [],
        hanQuoc || [],
        trungQuocDisplay || [],
        thaiLan || [],
      ];
      for (const pool of fallbackPools) {
        for (const movie of sortByModifiedDesc(pool)) {
          if (!movie?.slug) continue;
          if ((movie.total_episodes || 0) < 2) continue;
          top10Series.push(movie);
          if (top10Series.length >= 10) break;
        }
        if (top10Series.length >= 10) break;
      }
    }

    return {
      newlyUpdated,
      dailyUpdated,
      phimLe,
      phimBo,
      hanQuoc,
      trungQuoc: trungQuocDisplay,
      nhatBan,
      hongKong,
      auMy,
      hoatHinh,
      anime,
      thaiLan,
      top10Series,
    };
  } catch (error) {
    console.error("Error fetching home page data:", error);
    return {
      newlyUpdated: [],
      dailyUpdated: [],
      phimLe: [],
      phimBo: [],
      hanQuoc: [],
      trungQuoc: [],
      nhatBan: [],
      hongKong: [],
      auMy: [],
      hoatHinh: [],
      anime: [],
    };
  }
}

export default async function Home() {
  const data = await getHomePageData();

  return (
    <main className="min-h-screen bg-[#05050a]">
      {/* Header */}
      <Header />

      {/* Hero */}
      {data.phimLe.length > 0 && <HeroSection movies={data.phimLe} />}

      {/* Content Rows */}
      <div className="relative z-20 -mt-4 sm:-mt-12 md:-mt-18 lg:-mt-24 pb-16">
        {/* Soft background gradients behind rows */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-[#fb743E]/10 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-64 w-64 rounded-full bg-[#ff9d6b]/10 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#05050a] to-[#05050a]" />
        </div>

        <div className="relative z-10 space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
          {/* Category Pills - Sticky below header */}
          <div className="relative pt-2 sm:pt-0 mb-3 sm:mb-1 md:mb-0 px-3 sm:px-4 md:px-8 lg:px-12">
            <CategoryPills />
          </div>

          {/* New Releases */}
          <div className="mt-2 sm:mt-4 md:mt-6 lg:mt-8 animate-slide-up">
            <Suspense fallback={<MovieSectionSkeleton />}>
              <MovieSection
                title="Top 10 phim lẻ"
                movies={data.phimLe}
                variant="newRelease"
              />
            </Suspense>
          </div>

          {/* Daily Updated */}
          <div className="animate-slide-up">
            <Suspense fallback={<MovieSectionSkeleton />}>
              <MovieSection
                title="Cập nhật hôm nay"
                movies={data.dailyUpdated}
                href="/danh-sach/phim-cap-nhat-hang-ngay"
                variant="portrait"
              />
            </Suspense>
          </div>

          {/* Top 10 phim bộ (2 Trung, 3 Hàn, 2 Thái, 3 Âu Mỹ - bỏ hoạt hình) */}
          <div className="animate-slide-up">
            <Suspense fallback={<MovieSectionSkeleton />}>
              <MovieSection
                title="Top 10 phim bộ"
                movies={data.top10Series || []}
                variant="newRelease"
              />
            </Suspense>
          </div>

          {/* Korean Dramas */}
          <div className="animate-slide-up">
            <Suspense fallback={<MovieSectionSkeleton />}>
              <MovieSection
                title="Phim Hàn Quốc"
                movies={data.hanQuoc}
                href="/quoc-gia/han-quoc"
                variant="series"
              />
            </Suspense>
          </div>

          {/* Chinese Dramas - bỏ phim hoạt hình (lọc theo detail category) */}
          <div className="animate-slide-up">
            <Suspense fallback={<MovieSectionSkeleton />}>
              <MovieSection
                title="Phim Trung Quốc"
                movies={data.trungQuoc}
                href="/quoc-gia/trung-quoc"
                variant="portrait"
              />
            </Suspense>
          </div>

          {/* US-UK Movies - đưa lên trên, dùng UI dạng series */}
          <div className="animate-slide-up">
            <Suspense fallback={<MovieSectionSkeleton />}>
              <MovieSection
                title="Phim Âu Mỹ (US-UK)"
                movies={data.auMy}
                href="/quoc-gia/au-my"
                variant="cinema"
              />
            </Suspense>
          </div>

          {/* Thai Movies */}
          <div className="animate-slide-up">
            <Suspense fallback={<MovieSectionSkeleton />}>
              <MovieSection
                title="Phim Thái Lan"
                movies={data.thaiLan || []}
                href="/quoc-gia/thai-lan"
                variant="portrait"
              />
            </Suspense>
          </div>

          {/* Hong Kong Movies */}
          <div className="animate-slide-up">
            <Suspense fallback={<MovieSectionSkeleton />}>
              <MovieSection
                title="Phim Hồng Kông"
                movies={data.hongKong}
                href="/quoc-gia/hong-kong"
                variant="portrait"
              />
            </Suspense>
          </div>

          {/* Anime */}
          <div className="animate-slide-up">
            <Suspense fallback={<MovieSectionSkeleton />}>
              <MovieSection
                title="Phim Anime"
                movies={data.anime.length > 0 ? data.anime : data.hoatHinh}
                href={data.anime.length > 0 ? "/the-loai/anime" : "/the-loai/hoat-hinh"}
                variant="portrait"
              />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}
