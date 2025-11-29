import { Suspense } from "react";
import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { GenreSection } from "@/components/genre-section";
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
    const [newlyUpdated, phimLe, phimBo, phimDangChieu, hanhDong, hanQuoc] =
      await Promise.all([
        getNewlyUpdatedFilmsMultiple(3),
        getFilmsByCategoryMultiple(CATEGORIES.PHIM_LE, 3),
        getFilmsByCategoryMultiple(CATEGORIES.PHIM_BO, 3),
        getFilmsByCategoryMultiple(CATEGORIES.PHIM_DANG_CHIEU, 2),
        getFilmsByGenreMultiple("hanh-dong", 2),
        getFilmsByCountryMultiple("han-quoc", 2),
      ]);

    return {
      newlyUpdated,
      phimLe,
      phimBo,
      phimDangChieu,
      hanhDong,
      hanQuoc,
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
    };
  }
}

export default async function Home() {
  const data = await getHomePageData();

  // Get featured movie from newly updated
  const featuredMovie = data.newlyUpdated[0];

  return (
    <main className="min-h-screen">
      {/* Header */}
      <Header />

      {/* Hero Section */}
      {featuredMovie && <HeroSection movie={featuredMovie} />}

      {/* Genre Filter */}
      <GenreSection />

      {/* Movie Sections */}
      <div className="space-y-2">
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
            title="Phim lẻ"
            icon="🎬"
            movies={data.phimLe}
            href="/danh-sach/phim-le"
          />
        </Suspense>

        <Suspense fallback={<MovieSectionSkeleton />}>
          <MovieSection
            title="Phim bộ"
            icon="📺"
            movies={data.phimBo}
            href="/danh-sach/phim-bo"
          />
        </Suspense>

        <Suspense fallback={<MovieSectionSkeleton />}>
          <MovieSection
            title="Phim đang chiếu"
            icon="🎥"
            movies={data.phimDangChieu}
            href="/danh-sach/phim-dang-chieu"
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
            title="Phim Hàn Quốc"
            icon="🇰🇷"
            movies={data.hanQuoc}
            href="/quoc-gia/han-quoc"
          />
        </Suspense>
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}
