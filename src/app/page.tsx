import { Suspense } from "react";
import type { Metadata } from "next";
import { Footer } from "@/components/footer";
import { HomeCatalogGrid } from "@/components/home-catalog-grid";
import { MovieSectionSkeleton } from "@/components/movie-skeleton";
import { HeroSectionWrapper } from "@/components/home-sections/hero-section-wrapper";
import { TrendingSection } from "@/components/home-sections/trending";
import { CinemaSection } from "@/components/home-sections/cinema";
import { CurrentlyWatchingSection } from "@/components/home-sections/currently-watching";
import { Top10PhimLe } from "@/components/home-sections/top10-phim-le";
import { Top10PhimBo } from "@/components/home-sections/top10-phim-bo";
import { HanQuocSection } from "@/components/home-sections/han-quoc";
import { TrungQuocSection } from "@/components/home-sections/trung-quoc";
import { AnimeSection } from "@/components/home-sections/anime";
import { ThaiLanSection } from "@/components/home-sections/thai-lan";
import { HongKongSection } from "@/components/home-sections/hong-kong";
import { ScrollReveal } from "@/components/scroll-reveal";


// ISR: Revalidate every 5 minutes để giảm số lần gọi API
export const revalidate = 300;

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://www.movpey.xyz";

export const metadata: Metadata = {
  title: "MovPey - Phim xịn mỗi ngày | Xem phim online HD Vietsub miễn phí",
  description:
    "MovPey - Phim xịn mỗi ngày. Xem phim online HD Vietsub, thuyết minh miễn phí. Phim lẻ, phim bộ, phim Hàn Quốc, Trung Quốc, Âu Mỹ, Anime chất lượng cao. Cập nhật liên tục hàng ngày.",
  keywords: [
    "xem phim",
    "phim lẻ",
    "phim bộ",
    "phim vietsub",
    "xem phim online",
    "phim hd",
    "phim miễn phí",
    "phim hay",
    "phim mới",
    "phim Hàn Quốc",
    "phim Trung Quốc",
    "phim Âu Mỹ",
    "phim Thái Lan",
    "phim Hong Kong",
    "anime",
    "phim thuyết minh",
    "phim lồng tiếng",
    "xem phim không quảng cáo",
    "phim chất lượng cao",
    "phim full hd",
    "phim 4k",
    "phim online miễn phí",
    "xem phim trực tuyến",
    "phim truyền hình",
    "phim điện ảnh",
    "phim chiếu rạp",
    "phim bom tấn",
  ],
  alternates: {
    canonical: siteUrl,
    languages: {
      "vi": siteUrl,
      "vi-VN": siteUrl,
      "x-default": siteUrl,
    },
  },
  openGraph: {
    title: "MovPey - Phim xịn mỗi ngày | Xem phim online HD Vietsub miễn phí",
    description:
      "Xem phim online chất lượng cao, cập nhật liên tục, đầy đủ thể loại với Vietsub/Thuyết minh. Phim lẻ, phim bộ, phim Hàn Quốc, Trung Quốc, Âu Mỹ, Anime HD miễn phí.",
    url: siteUrl,
    siteName: "MovPey",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: `${siteUrl}/opengraph-image`,
        width: 1200,
        height: 630,
        alt: "MovPey - Phim xịn mỗi ngày",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MovPey - Phim xịn mỗi ngày | Xem phim online HD Vietsub miễn phí",
    description:
      "Xem phim online chất lượng cao, cập nhật liên tục, đầy đủ thể loại với Vietsub/Thuyết minh.",
    images: [`${siteUrl}/opengraph-image`],
    creator: "@MovPey",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function Home() {
  return (
    <main className="min-h-screen bg-[#151823] relative overflow-x-hidden">
      {/* Hero - Priority load (full-width) */}
      <div className="w-full max-w-full overflow-hidden">
        <Suspense fallback={<div className="h-[60vh] bg-[#191b24]" />}>
          <HeroSectionWrapper />
        </Suspense>
      </div>

      <div className="mx-auto max-w-[1800px] px-3 sm:px-4 md:px-8 lg:px-12">
        {/* Content Rows - Premium Layout */}
        <div className="relative z-20 -mt-4 sm:-mt-10 md:-mt-16 lg:-mt-20 pb-20 sm:pb-24">
          {/* Premium Background Effects - Hidden on mobile for performance */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden hidden sm:block">
            {/* Gradient orbs */}
            <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-gradient-to-l from-[#D3A13A]/15 via-[#F6C453]/10 to-transparent blur-3xl" />
            <div className="absolute left-1/2 top-2/3 h-80 w-80 rounded-full bg-gradient-to-r from-[#F6C453]/8 to-[#D3A13A]/8 blur-3xl" />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#191b24]/50 to-[#191b24]" />
          </div>

          {/* Giảm khoảng cách dọc giữa các section để đỡ trống hơn nữa */}
          <div className="relative z-10 space-y-3 sm:space-y-4 lg:space-y-5 pt-9 sm:pt-14 md:pt-18 lg:pt-22">
            <ScrollReveal variant="fade-up" duration={700} desktopDisabled>
              <div className="rounded-xl p-1 sm:p-2">
                <HomeCatalogGrid />
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fade-up" duration={700} desktopDisabled>
              <div className="rounded-xl p-3 sm:p-5 bg-[#191b24]/50 md:backdrop-blur-sm">
                <Suspense fallback={<MovieSectionSkeleton />}>
                  <TrendingSection />
                </Suspense>
              </div>
            </ScrollReveal>

            <ScrollReveal variant="fade-up" duration={700} desktopDisabled>
              <div className="rounded-xl p-3 sm:p-5 bg-[#191b24]/50 md:backdrop-blur-sm">
                <Suspense fallback={<MovieSectionSkeleton />}>
                  <CinemaSection />
                </Suspense>
              </div>
            </ScrollReveal>

            {/* Currently Watching - Render ngay (above fold) */}
            <div className="-mt-1 sm:-mt-2 rounded-xl p-3 sm:p-5 bg-[#191b24]/50 md:backdrop-blur-sm">
              <CurrentlyWatchingSection />
            </div>

            {/* Top 10 phim lẻ - Render ngay (above fold trên mobile) */}
            <div className="mt-1 sm:mt-2 md:mt-3 lg:mt-4 rounded-xl p-3 sm:p-5 bg-[#191b24]/50 md:backdrop-blur-sm">
              <div className="relative">
                <div className="hidden sm:block absolute -inset-4 bg-gradient-to-r from-[#F6C453]/5 via-transparent to-[#D3A13A]/5 rounded-3xl blur-2xl opacity-50" />
                <div className="relative">
                  <Suspense fallback={<MovieSectionSkeleton />}>
                    <Top10PhimLe />
                  </Suspense>
                </div>
              </div>
            </div>

            {/* Top 10 phim bộ */}
            <ScrollReveal variant="fade-up" duration={700} desktopDisabled>
              <div className="-mt-1 sm:-mt-2 rounded-xl p-3 sm:p-5 bg-[#191b24]/50 md:backdrop-blur-sm">
                <div className="relative">
                  <div className="hidden sm:block absolute -inset-4 bg-gradient-to-l from-[#D3A13A]/5 via-transparent to-[#F6C453]/5 rounded-3xl blur-2xl opacity-50" />
                  <div className="relative">
                    <Suspense fallback={<MovieSectionSkeleton />}>
                      <Top10PhimBo />
                    </Suspense>
                  </div>
                </div>
              </div>
            </ScrollReveal>

            {/* Korean Dramas */}
            <ScrollReveal variant="fade-up" duration={700} desktopDisabled>
              <div className="rounded-xl p-3 sm:p-5 bg-[#191b24]/50 md:backdrop-blur-sm">
                <Suspense fallback={<MovieSectionSkeleton />}>
                  <HanQuocSection />
                </Suspense>
              </div>
            </ScrollReveal>

            {/* Anime — trước Phim Trung Quốc */}
            <ScrollReveal variant="fade-up" duration={700} desktopDisabled>
              <div className="rounded-xl p-3 sm:p-5 bg-[#191b24]/50 md:backdrop-blur-sm">
                <Suspense fallback={<MovieSectionSkeleton />}>
                  <AnimeSection />
                </Suspense>
              </div>
            </ScrollReveal>

            {/* Chinese Dramas */}
            <ScrollReveal variant="fade-up" duration={700} desktopDisabled>
              <div className="rounded-xl p-3 sm:p-5 bg-[#191b24]/50 md:backdrop-blur-sm">
                <Suspense fallback={<MovieSectionSkeleton />}>
                  <TrungQuocSection />
                </Suspense>
              </div>
            </ScrollReveal>

            {/* Thai Movies */}
            <ScrollReveal variant="fade-up" duration={700} desktopDisabled>
              <div className="rounded-xl p-3 sm:p-5 bg-[#191b24]/50 md:backdrop-blur-sm">
                <Suspense fallback={<MovieSectionSkeleton />}>
                  <ThaiLanSection />
                </Suspense>
              </div>
            </ScrollReveal>

            {/* Hong Kong Movies */}
            <ScrollReveal variant="fade-up" duration={700} desktopDisabled>
              <div className="rounded-xl p-3 sm:p-5 bg-[#191b24]/50 md:backdrop-blur-sm">
                <Suspense fallback={<MovieSectionSkeleton />}>
                  <HongKongSection />
                </Suspense>
              </div>
            </ScrollReveal>

          </div>
        </div>

        {/* Footer */}
        <ScrollReveal variant="fade" duration={800} desktopDisabled>
          <Footer />
        </ScrollReveal>
      </div>
    </main>
  );
}
