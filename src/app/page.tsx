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
} from "@/lib/api";

// ISR: Revalidate every 30 seconds for real-time updates
export const revalidate = 30;

// Fetch data
async function getHomePageData() {
  try {
    const [
      newlyUpdated,
      dailyUpdated,
      phimLe,
      phimBo,
      hanQuoc,
      trungQuoc,
      nhatBan,
      hongKong,
      auMy,
      hoatHinh,
      anime,
    ] = await Promise.all([
      getNewlyUpdatedFilmsMultiple(3),
      getDailyUpdatedFilms(1).then(r => r.items || []),
      getFilmsByCategoryMultiple(CATEGORIES.PHIM_LE, 3),
      getFilmsByCategoryMultiple(CATEGORIES.PHIM_BO, 3),
      getFilmsByCountryMultiple("han-quoc", 2),
      getFilmsByCountryMultiple("trung-quoc", 2),
      getFilmsByCountryMultiple("nhat-ban", 2),
      getFilmsByCountryMultiple("hong-kong", 2),
      getFilmsByCountryMultiple("au-my", 2),
      getFilmsByGenreMultiple("hoat-hinh", 2),
      getFilmsByGenreMultiple("anime", 2),
    ]);

    return {
      newlyUpdated,
      dailyUpdated,
      phimLe,
      phimBo,
      hanQuoc,
      trungQuoc,
      nhatBan,
      hongKong,
      auMy,
      hoatHinh,
      anime,
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
    <main className="min-h-screen bg-[#141414]">
      {/* Header */}
      <Header />

      {/* Hero */}
      {data.newlyUpdated.length > 0 && (
        <HeroSection movies={data.newlyUpdated} />
      )}

      {/* Content Rows */}
      <div className="relative z-20 -mt-16 sm:-mt-20 md:-mt-24 lg:-mt-32 space-y-0">
        {/* Category Pills - Sticky below header */}
        <div className="relative">
          <CategoryPills />
        </div>

        {/* New Releases */}
        <Suspense fallback={<MovieSectionSkeleton />}>
          <MovieSection
            title="Mới phát hành"
            movies={data.phimLe}
            href="/danh-sach/phim-le"
            variant="portrait"
          />
        </Suspense>

        {/* Daily Updated */}
        <Suspense fallback={<MovieSectionSkeleton />}>
          <MovieSection
            title="Cập nhật hôm nay"
            movies={data.dailyUpdated}
            href="/danh-sach/phim-cap-nhat-hang-ngay"
            variant="portrait"
          />
        </Suspense>

        {/* Continue Watching (simulated with phim bộ) */}
        <Suspense fallback={<MovieSectionSkeleton />}>
          <MovieSection
            title="Phim bộ đang hot"
            movies={data.phimBo}
            href="/danh-sach/phim-bo"
            variant="portrait"
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

        {/* Chinese Dramas */}
        <Suspense fallback={<MovieSectionSkeleton />}>
          <MovieSection
            title="Phim Trung Quốc"
            movies={data.trungQuoc}
            href="/quoc-gia/trung-quoc"
            variant="portrait"
          />
        </Suspense>


        {/* Hong Kong Movies */}
        <Suspense fallback={<MovieSectionSkeleton />}>
          <MovieSection
            title="Phim Hồng Kông"
            movies={data.hongKong}
            href="/quoc-gia/hong-kong"
            variant="portrait"
          />
        </Suspense>

        {/* US-UK Movies */}
        <Suspense fallback={<MovieSectionSkeleton />}>
          <MovieSection
            title="Phim Âu Mỹ (US-UK)"
            movies={data.auMy}
            href="/quoc-gia/au-my"
            variant="portrait"
          />
        </Suspense>

        {/* Japanese Movies */}
        <Suspense fallback={<MovieSectionSkeleton />}>
          <MovieSection
            title="Phim Nhật Bản"
            movies={data.nhatBan}
            href="/quoc-gia/nhat-ban"
            variant="portrait"
          />
        </Suspense>

        {/* Anime */}
        <Suspense fallback={<MovieSectionSkeleton />}>
          <MovieSection
            title="Phim Anime"
            movies={data.anime.length > 0 ? data.anime : data.hoatHinh}
            href={data.anime.length > 0 ? "/the-loai/anime" : "/the-loai/hoat-hinh"}
            variant="portrait"
          />
        </Suspense>
        </div>

      {/* Footer */}
      <Footer />
      </main>
  );
}
