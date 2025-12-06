import { Suspense } from "react";
import { Header } from "@/components/header";
import { CategoryPills } from "@/components/category-pills";
import { Footer } from "@/components/footer";
import { MovieSectionSkeleton } from "@/components/movie-skeleton";
import { HeroSectionWrapper } from "@/components/home-sections/hero-section-wrapper";
import { Top10PhimLe } from "@/components/home-sections/top10-phim-le";
import { DailyUpdated } from "@/components/home-sections/daily-updated";
import { Top10PhimBo } from "@/components/home-sections/top10-phim-bo";
import { HanQuocSection } from "@/components/home-sections/han-quoc";
import { TrungQuocSection } from "@/components/home-sections/trung-quoc";
import { AuMySection } from "@/components/home-sections/au-my";
import { ThaiLanSection } from "@/components/home-sections/thai-lan";
import { HongKongSection } from "@/components/home-sections/hong-kong";
import { AnimeSection } from "@/components/home-sections/anime";

// ISR: Revalidate every 5 minutes để giảm số lần gọi API
export const revalidate = 300;

export default async function Home() {

  return (
    <main className="min-h-screen bg-[#05050a]">
      {/* Header */}
      <Header />

      {/* Hero - Priority load */}
      <Suspense fallback={<div className="h-[60vh] bg-[#05050a]" />}>
        <HeroSectionWrapper />
      </Suspense>

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

          {/* Top 10 phim lẻ - Priority section */}
          <div className="mt-2 sm:mt-4 md:mt-6 lg:mt-8 animate-slide-up">
            <Suspense fallback={<MovieSectionSkeleton />}>
              <Top10PhimLe />
            </Suspense>
          </div>

          {/* Daily Updated - Priority section */}
          <div className="animate-slide-up">
            <Suspense fallback={<MovieSectionSkeleton />}>
              <DailyUpdated />
            </Suspense>
          </div>

          {/* Top 10 phim bộ */}
          <div className="animate-slide-up">
            <Suspense fallback={<MovieSectionSkeleton />}>
              <Top10PhimBo />
            </Suspense>
          </div>

          {/* Korean Dramas */}
          <div className="animate-slide-up">
            <Suspense fallback={<MovieSectionSkeleton />}>
              <HanQuocSection />
            </Suspense>
          </div>

          {/* Chinese Dramas */}
          <div className="animate-slide-up">
            <Suspense fallback={<MovieSectionSkeleton />}>
              <TrungQuocSection />
            </Suspense>
          </div>

          {/* US-UK Movies */}
          <div className="animate-slide-up">
            <Suspense fallback={<MovieSectionSkeleton />}>
              <AuMySection />
            </Suspense>
          </div>

          {/* Thai Movies */}
          <div className="animate-slide-up">
            <Suspense fallback={<MovieSectionSkeleton />}>
              <ThaiLanSection />
            </Suspense>
          </div>

          {/* Hong Kong Movies */}
          <div className="animate-slide-up">
            <Suspense fallback={<MovieSectionSkeleton />}>
              <HongKongSection />
            </Suspense>
          </div>

          {/* Anime */}
          <div className="animate-slide-up">
            <Suspense fallback={<MovieSectionSkeleton />}>
              <AnimeSection />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </main>
  );
}
