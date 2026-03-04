import { Skeleton } from "@/components/ui/skeleton";
import { Home } from "lucide-react";
import Link from "next/link";
import { Footer } from "@/components/footer";

export default function WatchLoading() {
  return (
    <main className="min-h-screen bg-[#0c0d14]">
      {/* Cinematic background */}
      <div className="relative pt-16 sm:pt-20 md:pt-24 pb-12 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-60 -top-60 h-96 w-96 rounded-full bg-[#F6C453]/8 blur-[100px] animate-fade-in" />
          <div className="absolute right-[-10%] top-[15%] h-80 w-80 rounded-full bg-[#D3A13A]/6 blur-[80px] animate-fade-in" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-[#0c0d14]/95 to-[#0c0d14]" />
        </div>

        <div className="relative z-10 container mx-auto px-3 sm:px-4 lg:px-6 max-w-[1400px] space-y-4 sm:space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-white/40 animate-fade-in">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-white/40 hover:text-white/70 transition-colors"
            >
              <Home className="h-3 w-3" />
              <span className="hidden sm:inline">Trang chủ</span>
            </Link>
          </div>

          {/* Video Player Skeleton */}
          <div className="animate-slide-up space-y-6 sm:space-y-8">
            <div className="space-y-0 max-w-full text-white">
              {/* Video Player Skeleton */}
              <div className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden bg-black ring-1 ring-white/10">
                <div className="relative aspect-video bg-black w-full flex items-center justify-center">
                  <div className="text-center space-y-5">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto border-[3px] border-white/10 border-t-[#F6C453] rounded-full animate-spin" />
                    <p className="text-xs sm:text-sm text-white/50 font-medium tracking-wide">
                      Đang tải tập phim...
                    </p>
                  </div>
                </div>
              </div>

              {/* Meta skeleton */}
              <div className="mt-4 sm:mt-5 space-y-3 sm:space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <Skeleton className="h-6 sm:h-7 w-40 sm:w-52 rounded-md" />
                    <Skeleton className="h-5 w-12 rounded-md" />
                  </div>
                  <Skeleton className="h-5 w-24 rounded-md" />
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 sm:h-9 w-24 rounded-lg" />
                    <Skeleton className="h-8 sm:h-9 w-24 rounded-lg" />
                  </div>
                  <Skeleton className="h-8 sm:h-9 w-28 rounded-lg" />
                </div>
              </div>
            </div>

            {/* Episode Grid Skeleton */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5">
                <div className="w-0.5 h-4 bg-[#F6C453] rounded-full" />
                <Skeleton className="h-5 w-20 rounded-md" />
              </div>
              <div className="grid grid-cols-[repeat(auto-fit,minmax(78px,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(88px,1fr))] gap-1.5 sm:gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 sm:h-10 rounded-lg" />
                ))}
              </div>
            </div>
          </div>

          <div className="pointer-events-none h-20 w-full bg-gradient-to-b from-transparent to-[#0c0d14]" />
        </div>
      </div>

      <Footer />
    </main>
  );
}
