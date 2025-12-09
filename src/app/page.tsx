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
    <main className="min-h-screen bg-[#0D0D0D] relative overflow-hidden">
      {/* Header */}
      <Header />

      {/* Hero - Priority load */}
      <Suspense fallback={<div className="h-[60vh] bg-[#0D0D0D]" />}>
        <HeroSectionWrapper />
      </Suspense>

      {/* Content Rows - Premium Layout */}
      <div className="relative z-20 -mt-4 sm:-mt-12 md:-mt-18 lg:-mt-24 pb-20 sm:pb-24">
        {/* Premium Background Effects */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Animated gradient orbs */}
          <div className="absolute -left-32 top-20 h-96 w-96 rounded-full bg-gradient-to-r from-[#F6C453]/15 via-[#D3A13A]/10 to-transparent blur-3xl animate-pulse" />
          <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-gradient-to-l from-[#D3A13A]/15 via-[#F6C453]/10 to-transparent blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute left-1/2 top-2/3 h-80 w-80 rounded-full bg-gradient-to-r from-[#F6C453]/8 to-[#D3A13A]/8 blur-3xl" />
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0D0D0D]/50 to-[#0D0D0D]" />
        </div>

        <div className="relative z-10 space-y-6 sm:space-y-8 lg:space-y-12">
          {/* Category Pills - Premium Sticky */}
          <div className="relative pt-4 sm:pt-6 mb-4 sm:mb-6 px-3 sm:px-4 md:px-8 lg:px-12 animate-fade-in">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#F6C453]/5 via-transparent to-[#D3A13A]/5 rounded-2xl blur-xl" />
              <div className="relative">
                <CategoryPills />
              </div>
            </div>
          </div>

          {/* Currently Watching - Premium Highlight */}
          <div className="animate-stagger-1 -mt-2 sm:-mt-4">
            <CurrentlyWatchingSection />
          </div>

          {/* Top 10 phim lẻ - Premium Priority Section */}
          <div className="mt-4 sm:mt-6 md:mt-8 lg:mt-10 animate-stagger-2">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-[#F6C453]/5 via-transparent to-[#D3A13A]/5 rounded-3xl blur-2xl opacity-50" />
              <div className="relative">
                <Suspense fallback={<MovieSectionSkeleton />}>
                  <Top10PhimLe />
                </Suspense>
              </div>
            </div>
          </div>

          {/* Daily Updated - Premium Section */}
          <div className="animate-stagger-3">
            <Suspense fallback={<MovieSectionSkeleton />}>
              <DailyUpdated />
            </Suspense>
          </div>

          {/* Top 10 phim bộ - Premium Section */}
          <div className="animate-stagger-4">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-l from-[#D3A13A]/5 via-transparent to-[#F6C453]/5 rounded-3xl blur-2xl opacity-50" />
              <div className="relative">
                <Suspense fallback={<MovieSectionSkeleton />}>
                  <Top10PhimBo />
                </Suspense>
              </div>
            </div>
          </div>

          {/* Korean Dramas */}
          <div className="animate-stagger-5">
            <Suspense fallback={<MovieSectionSkeleton />}>
              <HanQuocSection />
            </Suspense>
          </div>

          {/* Chinese Dramas */}
          <div className="animate-stagger-1">
            <Suspense fallback={<MovieSectionSkeleton />}>
              <TrungQuocSection />
            </Suspense>
          </div>

          {/* US-UK Movies */}
          <div className="animate-stagger-2">
            <Suspense fallback={<MovieSectionSkeleton />}>
              <AuMySection />
            </Suspense>
          </div>

          {/* Thai Movies */}
          <div className="animate-stagger-3">
            <Suspense fallback={<MovieSectionSkeleton />}>
              <ThaiLanSection />
            </Suspense>
          </div>

          {/* Hong Kong Movies */}
          <div className="animate-stagger-4">
            <Suspense fallback={<MovieSectionSkeleton />}>
              <HongKongSection />
            </Suspense>
          </div>

          {/* Anime */}
          <div className="animate-stagger-5">
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
