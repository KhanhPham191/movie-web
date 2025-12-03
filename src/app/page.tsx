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
import {
  filterChinaNonAnimation,
  filterNonAnimationByCountries,
} from "@/lib/filters";

// Helper: sắp xếp phim theo thời gian cập nhật mới nhất (field modified)
function sortByModifiedDesc(movies: FilmItem[]): FilmItem[] {
  return [...(movies || [])].sort((a, b) => {
    const ta = a?.modified ? new Date(a.modified).getTime() : 0;
    const tb = b?.modified ? new Date(b.modified).getTime() : 0;
    return tb - ta; // mới trước, cũ sau
  });
}

// Helper: chọn tối đa `limit` phim không trùng slug, theo thứ tự hiện tại (mới nhất trước)
function pickUniqueBySlug(
  source: FilmItem[],
  limit: number,
  seen: Set<string>,
  output: FilmItem[]
) {
  let added = 0;
  for (const movie of source) {
    if (!movie?.slug) continue;
    if (seen.has(movie.slug)) continue;
    output.push(movie);
    seen.add(movie.slug);
    added++;
    if (added >= limit) break;
  }
}

// ISR: Revalidate every 30 seconds for real-time updates
export const revalidate = 30;

// Fetch data
async function getHomePageData() {
  try {
    const [
      newlyUpdated,
      dailyUpdated,
      phimLe,
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
      getDailyUpdatedFilms(1).then(r => r.items || []),
      getFilmsByCategoryMultiple(CATEGORIES.PHIM_LE, 3),
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

    // Lọc lại chỉ giữ phim bộ (nhiều tập)
    const phimBo = (phimBoTinhCam || []).filter(
      (movie) => movie.total_episodes && movie.total_episodes > 1
    );

    // Danh mục test: chỉ giữ phim Trung Quốc nhưng không phải thể loại Hoạt Hình,
    // dựa trên category chi tiết từ /api/film/{slug}
    const trungQuocFiltered = await filterChinaNonAnimation(trungQuoc);

    // Top 10 phim bộ: 2 Trung, 3 Hàn, 2 Thái, 3 Âu Mỹ (bỏ hoạt hình)
    const [chinaSeries, koreaSeries, thaiSeries, euUsSeries] =
      await Promise.all([
        filterNonAnimationByCountries(
          (trungQuoc || []).filter((m) => (m.total_episodes || 0) > 1),
          ["trung quoc"]
        ),
        filterNonAnimationByCountries(
          (hanQuoc || []).filter((m) => (m.total_episodes || 0) > 1),
          ["han quoc"]
        ),
        filterNonAnimationByCountries(
          (thaiLan || []).filter((m) => (m.total_episodes || 0) > 1),
          ["thai lan"]
        ),
        filterNonAnimationByCountries(
          (auMy || []).filter((m) => (m.total_episodes || 0) > 1),
          ["au my", "my", "anh", "us", "uk", "nuoc anh", "nuoc my"]
        ),
      ]);

    // Ghép top 10, đảm bảo không trùng slug; nếu trùng sẽ lấy phim kế tiếp trong list (gần nhất)
    const seen = new Set<string>();
    const top10Series: FilmItem[] = [];
    pickUniqueBySlug(chinaSeries, 2, seen, top10Series);
    pickUniqueBySlug(koreaSeries, 3, seen, top10Series);
    pickUniqueBySlug(thaiSeries, 2, seen, top10Series);
    
    // Đảm bảo có đủ 3 phim US-UK: lấy từ danh sách đã filter
    const euUsNeeded = 3;
    const euUsSlugs = new Set(euUsSeries.map(m => m.slug));
    const beforeEuUs = top10Series.length;
    pickUniqueBySlug(euUsSeries, euUsNeeded, seen, top10Series);
    const euUsAdded = top10Series.length - beforeEuUs;
    
    // Nếu vẫn chưa đủ 3 phim US-UK, lấy thêm từ danh sách gốc (chỉ filter phim bộ, không filter hoạt hình)
    if (euUsAdded < euUsNeeded) {
      const auMySeriesOnly = (auMy || []).filter((m) => (m.total_episodes || 0) > 1);
      const remainingNeeded = euUsNeeded - euUsAdded;
      pickUniqueBySlug(auMySeriesOnly, remainingNeeded, seen, top10Series);
    }

    // Sắp xếp lại top 10 theo thời gian cập nhật (modified) từ mới nhất đến cũ nhất
    const sortedTop10Series = sortByModifiedDesc(top10Series);

    return {
      newlyUpdated,
      dailyUpdated,
      phimLe,
      phimBo,
      hanQuoc,
      trungQuoc: trungQuocFiltered,
      nhatBan,
      hongKong,
      auMy,
      hoatHinh,
      anime,
      thaiLan,
      top10Series: sortedTop10Series,
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
          <div className="absolute -left-24 top-10 h-64 w-64 rounded-full bg-[#FF6EA0]/10 blur-3xl" />
          <div className="absolute right-0 top-1/3 h-64 w-64 rounded-full bg-[#FFB6D5]/10 blur-3xl" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#05050a] to-[#05050a]" />
        </div>

        <div className="relative z-10 space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in">
          {/* Category Pills - Sticky below header */}
          <div className="relative pt-2 sm:pt-0 mb-3 sm:mb-1 md:mb-0 px-3 sm:px-4 md:px-8 lg:px-12">
            <CategoryPills />
          </div>

          {/* New Releases */}
          <div className="animate-slide-up">
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
