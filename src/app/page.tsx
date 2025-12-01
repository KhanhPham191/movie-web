import { Suspense } from "react";
import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { MovieSection } from "@/components/movie-section";
import { Footer } from "@/components/footer";
import { MovieSectionSkeleton } from "@/components/movie-skeleton";
import {
  getNewlyUpdatedFilmsMultiple,
  getFilmsByCategoryMultiple,
  getFilmsByGenreMultiple,
  getFilmsByCountryMultiple,
  CATEGORIES,
} from "@/lib/api";

// Fetch data functions - lấy 3 trang cho mỗi danh mục
async function getHomePageData() {
  try {
    const [
      newlyUpdated,
      phimLe,
      phimBo,
      phimDangChieu,
      hanhDong,
      hanQuoc,
      hoatHinh,
      kinhDi,
    ] = await Promise.all([
      getNewlyUpdatedFilmsMultiple(3),
      getFilmsByCategoryMultiple(CATEGORIES.PHIM_LE, 3),
      getFilmsByCategoryMultiple(CATEGORIES.PHIM_BO, 3),
      getFilmsByCategoryMultiple(CATEGORIES.PHIM_DANG_CHIEU, 2),
      getFilmsByGenreMultiple("hanh-dong", 2),
      getFilmsByCountryMultiple("han-quoc", 2),
      getFilmsByGenreMultiple("hoat-hinh", 2),
      getFilmsByGenreMultiple("kinh-di", 2),
    ]);

    return {
      newlyUpdated,
      phimLe,
      phimBo,
      phimDangChieu,
      hanhDong,
      hanQuoc,
      hoatHinh,
      kinhDi,
    };
  } catch (error) {
    console.error("Error fetching home page data:", error);
    return {
      newlyUpdated: [],
      phimLe: [],
      phimBo: [],
      phimDangChieu: [],
      hanhDong: [],
      hanQuoc: [],
      hoatHinh: [],
      kinhDi: [],
    };
  }
}

export default async function Home() {
  const data = await getHomePageData();

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <Header />

      {/* Hero Section with multiple movies for slider */}
      {data.newlyUpdated.length > 0 && (
        <HeroSection movies={data.newlyUpdated} />
      )}

      {/* Movie Sections - Netflix Style */}
      <div className="relative z-10 -mt-32 space-y-2 pb-20">
        <Suspense fallback={<MovieSectionSkeleton />}>
          <MovieSection
            title="Phim mới cập nhật"
            icon="🔥"
            movies={data.newlyUpdated}
            href="/danh-sach/phim-moi-cap-nhat"
          />
        </Suspense>

        <Suspense fallback={<MovieSectionSkeleton />}>
          <MovieSection
            title="Phim chiếu rạp"
            icon="🎬"
            movies={data.phimDangChieu}
            href="/danh-sach/phim-dang-chieu"
          />
        </Suspense>

        <Suspense fallback={<MovieSectionSkeleton />}>
          <MovieSection
            title="Phim lẻ hay"
            icon="⭐"
            movies={data.phimLe}
            href="/danh-sach/phim-le"
          />
        </Suspense>

        <Suspense fallback={<MovieSectionSkeleton />}>
          <MovieSection
            title="Phim bộ đang hot"
            icon="📺"
            movies={data.phimBo}
            href="/danh-sach/phim-bo"
          />
        </Suspense>

        <Suspense fallback={<MovieSectionSkeleton />}>
          <MovieSection
            title="Phim Hàn Quốc"
            icon="🇰🇷"
            movies={data.hanQuoc}
            href="/quoc-gia/han-quoc"
          />
        </Suspense>

        <Suspense fallback={<MovieSectionSkeleton />}>
          <MovieSection
            title="Phim hành động"
            icon="💥"
            movies={data.hanhDong}
            href="/the-loai/hanh-dong"
          />
        </Suspense>

        <Suspense fallback={<MovieSectionSkeleton />}>
          <MovieSection
            title="Phim hoạt hình"
            icon="🎨"
            movies={data.hoatHinh}
            href="/the-loai/hoat-hinh"
          />
        </Suspense>

        <Suspense fallback={<MovieSectionSkeleton />}>
          <MovieSection
            title="Phim kinh dị"
            icon="👻"
            movies={data.kinhDi}
            href="/the-loai/kinh-di"
          />
        </Suspense>
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}
