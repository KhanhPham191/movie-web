import { Suspense } from "react";
import { Header } from "@/components/header";
import { CategoryPills } from "@/components/category-pills";
import { Footer } from "@/components/footer";
import { MovieSectionSkeleton } from "@/components/movie-skeleton";
import { HeroSectionWrapper } from "@/components/home-sections/hero-section-wrapper";
import { CurrentlyWatchingSection } from "@/components/home-sections/currently-watching";
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

      {/* Content Rows - Premium Layout */}
      <div className="relative z-20 -mt-4 sm:-mt-12 md:-mt-18 lg:-mt-24 pb-20 sm:pb-24">
        {/* Premium Background Effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Animated gradient orbs */}
          <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-gradient-to-r from-[#FF2EBC]/15 via-[#D946EF]/10 to-transparent blur-3xl animate-pulse" />
          <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-gradient-to-l from-[#D946EF]/15 via-[#FF2EBC]/10 to-transparent blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute left-1/2 top-2/3 h-80 w-80 rounded-full bg-gradient-to-r from-[#FF2EBC]/8 to-[#D946EF]/8 blur-3xl" />
          {/* Premium gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#05050a]/50 to-[#05050a]" />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,46,188,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,46,188,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
        </div>

        <div className="relative z-10 space-y-6 sm:space-y-8 lg:space-y-12 animate-fade-in">
          {/* Category Pills - Premium Sticky */}
          <div className="relative pt-4 sm:pt-6 mb-4 sm:mb-6 px-3 sm:px-4 md:px-8 lg:px-12">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#FF2EBC]/5 via-transparent to-[#D946EF]/5 rounded-2xl blur-xl" />
              <div className="relative">
                <CategoryPills />
              </div>
            </div>
          </div>

          {/* Currently Watching - Premium Highlight */}
          <div className="animate-slide-up -mt-2 sm:-mt-4">
            <CurrentlyWatchingSection />
          </div>

          {/* Top 10 phim lẻ - Premium Priority Section */}
          <div className="mt-4 sm:mt-6 md:mt-8 lg:mt-10 animate-slide-up">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#FF2EBC]/5 via-transparent to-[#D946EF]/5 rounded-3xl blur-2xl opacity-50" />
              <div className="relative">
                <Suspense fallback={<MovieSectionSkeleton />}>
                  <Top10PhimLe />
                </Suspense>
              </div>
            </div>
          </div>

          {/* Daily Updated - Premium Section */}
          <div className="animate-slide-up">
            <Suspense fallback={<MovieSectionSkeleton />}>
              <DailyUpdated />
            </Suspense>
          </div>

          {/* Top 10 phim bộ - Premium Section */}
          <div className="animate-slide-up">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-l from-[#D946EF]/5 via-transparent to-[#FF2EBC]/5 rounded-3xl blur-2xl opacity-50" />
              <div className="relative">
                <Suspense fallback={<MovieSectionSkeleton />}>
                  <Top10PhimBo />
                </Suspense>
              </div>
            </div>
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
