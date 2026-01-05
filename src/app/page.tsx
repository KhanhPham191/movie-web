import { Suspense } from "react";
import type { Metadata } from "next";
import { CategoryPills } from "@/components/category-pills";
import { Footer } from "@/components/footer";
import { MovieSectionSkeleton } from "@/components/movie-skeleton";
import { HeroSectionWrapper } from "@/components/home-sections/hero-section-wrapper";
import { CurrentlyWatchingSection } from "@/components/home-sections/currently-watching";
import { Top10PhimLe } from "@/components/home-sections/top10-phim-le";
import { Top10PhimBo } from "@/components/home-sections/top10-phim-bo";
import { HanQuocSection } from "@/components/home-sections/han-quoc";
import { TrungQuocSection } from "@/components/home-sections/trung-quoc";
import { AnimeSection } from "@/components/home-sections/anime";
import { ThaiLanSection } from "@/components/home-sections/thai-lan";
import { HongKongSection } from "@/components/home-sections/hong-kong";
import { TopicTags, DEFAULT_TOPIC_TAGS } from "@/components/topic-tags";
import { generateWebsiteStructuredData, generateOrganizationStructuredData } from "@/lib/structured-data";

// ISR: Revalidate every 5 minutes để giảm số lần gọi API
export const revalidate = 300;

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://movpey.example.com");

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
        url: `${siteUrl}/logo.svg`,
        width: 1200,
        height: 630,
        alt: "MovPey - Phim xịn mỗi ngày",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MovPey - Phim xịn mỗi ngày | Xem phim online HD Vietsub miễn phí",
    description:
      "Xem phim online chất lượng cao, cập nhật liên tục, đầy đủ thể loại với Vietsub/Thuyết minh.",
    images: [`${siteUrl}/logo.svg`],
    creator: "@MovPey",
  },
};

export default async function Home() {
  const websiteStructuredData = generateWebsiteStructuredData(siteUrl);
  const organizationStructuredData = generateOrganizationStructuredData(siteUrl);

  return (
    <main className="min-h-screen bg-[#191b24] relative overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
      />
      {/* Hero - Priority load (full-width) */}
      <div className="w-full max-w-full overflow-hidden">
        <Suspense fallback={<div className="h-[60vh] bg-[#191b24]" />}>
          <HeroSectionWrapper />
        </Suspense>
      </div>

      <div className="mx-auto max-w-[1800px] px-3 sm:px-4 md:px-8 lg:px-12">
        {/* Content Rows - Premium Layout */}
        <div className="relative z-20 -mt-4 sm:-mt-12 md:-mt-18 lg:-mt-24 pb-20 sm:pb-24">
          {/* Premium Background Effects */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            {/* Animated gradient orbs */}
            <div className="absolute right-0 top-1/3 h-96 w-96 rounded-full bg-gradient-to-l from-[#D3A13A]/15 via-[#F6C453]/10 to-transparent blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            <div className="absolute left-1/2 top-2/3 h-80 w-80 rounded-full bg-gradient-to-r from-[#F6C453]/8 to-[#D3A13A]/8 blur-3xl" />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#191b24]/50 to-[#191b24]" />
          </div>

          {/* Giảm khoảng cách dọc giữa các section để đỡ trống hơn nữa */}
          <div className="relative z-10 space-y-2 sm:space-y-3 lg:space-y-4">
            {/* Category Pills - Premium Sticky */}
            <div className="relative pt-4 sm:pt-6 mb-4 sm:mb-6 animate-fade-in">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#F6C453]/5 via-transparent to-[#D3A13A]/5 rounded-2xl blur-xl" />
                <div className="relative">
                  <CategoryPills />
                </div>
              </div>
            </div>

            {/* Topic Tags - Inspired by RoPhim */}
            <div className="px-2 xs:px-3 sm:px-4 md:px-8 lg:px-12 animate-fade-in">
              <TopicTags tags={DEFAULT_TOPIC_TAGS} />
            </div>

            {/* Currently Watching - Premium Highlight */}
            <div className="animate-stagger-1 -mt-1 sm:-mt-2 rounded-xl p-3 sm:p-5 bg-[#191b24]/50 backdrop-blur-sm">
              <CurrentlyWatchingSection />
            </div>

            {/* Top 10 phim lẻ - Premium Priority Section (render without Suspense to avoid layout shift) */}
            <div className="mt-1 sm:mt-2 md:mt-3 lg:mt-4 animate-stagger-2 rounded-xl p-3 sm:p-5 bg-[#191b24]/50 backdrop-blur-sm">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-[#F6C453]/5 via-transparent to-[#D3A13A]/5 rounded-3xl blur-2xl opacity-50" />
                <div className="relative">
                  <Top10PhimLe />
                </div>
              </div>
            </div>

            {/* Top 10 phim bộ - Premium Section (thu nhỏ khoảng trống so với Top 10 phim lẻ) */}
            <div className="animate-stagger-3 -mt-1 sm:-mt-2 rounded-xl p-3 sm:p-5 bg-[#191b24]/50 backdrop-blur-sm">
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
            <div className="animate-stagger-5 rounded-xl p-3 sm:p-5 bg-[#191b24]/50 backdrop-blur-sm">
              <Suspense fallback={<MovieSectionSkeleton />}>
                <HanQuocSection />
              </Suspense>
            </div>

            {/* Chinese Dramas */}
            <div className="animate-stagger-1 rounded-xl p-3 sm:p-5 bg-[#191b24]/50 backdrop-blur-sm">
              <Suspense fallback={<MovieSectionSkeleton />}>
                <TrungQuocSection />
              </Suspense>
            </div>

            {/* Anime (dùng layout carousel premium) */}
            <div className="animate-stagger-2 rounded-xl p-3 sm:p-5 bg-[#191b24]/50 backdrop-blur-sm">
              <Suspense fallback={<MovieSectionSkeleton />}>
                <AnimeSection />
              </Suspense>
            </div>

            {/* Thai Movies */}
            <div className="animate-stagger-3 rounded-xl p-3 sm:p-5 bg-[#191b24]/50 backdrop-blur-sm">
              <Suspense fallback={<MovieSectionSkeleton />}>
                <ThaiLanSection />
              </Suspense>
            </div>

            {/* Hong Kong Movies */}
            <div className="animate-stagger-4 rounded-xl p-3 sm:p-5 bg-[#191b24]/50 backdrop-blur-sm">
              <Suspense fallback={<MovieSectionSkeleton />}>
                <HongKongSection />
              </Suspense>
            </div>

          </div>
        </div>

        {/* Footer */}
        <Footer />
      </div>
    </main>
  );
}
