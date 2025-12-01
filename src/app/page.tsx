import { Suspense } from "react";
import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { CategoryPills } from "@/components/category-pills";
import { MovieSection, Top10Section } from "@/components/movie-section";
import { Footer } from "@/components/footer";
import { MovieSectionSkeleton } from "@/components/movie-skeleton";
import {
  getNewlyUpdatedFilmsMultiple,
  getFilmsByCategoryMultiple,
  getFilmsByGenreMultiple,
  getFilmsByCountryMultiple,
  CATEGORIES,
} from "@/lib/api";

// Fetch data
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
      tinhCam,
      haiHuoc,
    ] = await Promise.all([
      getNewlyUpdatedFilmsMultiple(3),
      getFilmsByCategoryMultiple(CATEGORIES.PHIM_LE, 3),
      getFilmsByCategoryMultiple(CATEGORIES.PHIM_BO, 3),
      getFilmsByCategoryMultiple(CATEGORIES.PHIM_DANG_CHIEU, 2),
      getFilmsByGenreMultiple("hanh-dong", 2),
      getFilmsByCountryMultiple("han-quoc", 2),
      getFilmsByGenreMultiple("hoat-hinh", 2),
      getFilmsByGenreMultiple("kinh-di", 2),
      getFilmsByGenreMultiple("tinh-cam", 2),
      getFilmsByGenreMultiple("hai", 2),
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
      tinhCam,
      haiHuoc,
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
      tinhCam: [],
      haiHuoc: [],
    };
  }
}

export default async function Home() {
  const data = await getHomePageData();

  return (
    <main className="min-h-screen bg-[#141414]">
      {/* Header */}
      <Header />

      {/* Hero */}
      {data.newlyUpdated.length > 0 && (
        <HeroSection movies={data.newlyUpdated} />
      )}

      {/* Content Rows */}
      <div className="relative z-10 -mt-24 md:-mt-32 space-y-0">
        {/* Category Pills */}
        <CategoryPills />

        {/* Top 10 Section */}
        <Suspense fallback={<MovieSectionSkeleton />}>
          <Top10Section
            title="Top 10 phim tại Việt Nam hôm nay"
            movies={data.phimDangChieu}
            href="/danh-sach/phim-dang-chieu"
          />
        </Suspense>

        {/* Trending Now */}
        <Suspense fallback={<MovieSectionSkeleton />}>
          <MovieSection
            title="Đang thịnh hành"
            movies={data.newlyUpdated}
            href="/danh-sach/phim-moi-cap-nhat"
          />
        </Suspense>

        {/* Continue Watching (simulated with phim bộ) */}
        <Suspense fallback={<MovieSectionSkeleton />}>
          <MovieSection
            title="Phim bộ đang hot"
            movies={data.phimBo}
            href="/danh-sach/phim-bo"
          />
        </Suspense>

        {/* New Releases */}
        <Suspense fallback={<MovieSectionSkeleton />}>
          <MovieSection
            title="Mới phát hành"
            movies={data.phimLe}
            href="/danh-sach/phim-le"
          />
        </Suspense>

        {/* Korean Dramas */}
        <Suspense fallback={<MovieSectionSkeleton />}>
          <MovieSection
            title="Phim Hàn Quốc"
            movies={data.hanQuoc}
            href="/quoc-gia/han-quoc"
            variant="portrait"
          />
        </Suspense>

        {/* Action */}
        <Suspense fallback={<MovieSectionSkeleton />}>
          <MovieSection
            title="Phim hành động kịch tính"
            movies={data.hanhDong}
            href="/the-loai/hanh-dong"
          />
        </Suspense>

        {/* Animation */}
        <Suspense fallback={<MovieSectionSkeleton />}>
          <MovieSection
            title="Phim hoạt hình"
            movies={data.hoatHinh}
            href="/the-loai/hoat-hinh"
            variant="portrait"
          />
        </Suspense>

        {/* Romance */}
        <Suspense fallback={<MovieSectionSkeleton />}>
          <MovieSection
            title="Phim tình cảm lãng mạn"
            movies={data.tinhCam}
            href="/the-loai/tinh-cam"
          />
        </Suspense>

        {/* Comedy */}
        <Suspense fallback={<MovieSectionSkeleton />}>
          <MovieSection
            title="Phim hài hước"
            movies={data.haiHuoc}
            href="/the-loai/hai"
          />
        </Suspense>

        {/* Horror */}
        <Suspense fallback={<MovieSectionSkeleton />}>
          <MovieSection
            title="Phim kinh dị rùng rợn"
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
