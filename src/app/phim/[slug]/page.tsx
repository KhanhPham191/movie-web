import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MovieSection } from "@/components/movie-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Play,
  Plus,
  ThumbsUp,
  ChevronDown,
  Volume2,
  VolumeX,
  Info,
} from "lucide-react";
import { getFilmDetail, getImageUrl, getFilmsByGenre, getFilmsByCategory, CATEGORIES } from "@/lib/api";

interface MoviePageProps {
  params: Promise<{ slug: string }>;
}

async function MovieDetail({ slug }: { slug: string }) {
  try {
    console.log("[MovieDetail] Fetching movie with slug:", slug);
    const response = await getFilmDetail(slug);
    console.log("[MovieDetail] API Response status:", response?.status);
    
    if (!response || !response.movie) {
      console.error("[MovieDetail] Missing response or movie data:", response);
      throw new Error("Không lấy được dữ liệu chi tiết phim từ API.");
    }
    
    const movie = response.movie;
    
    // Normalize category and country to arrays
    const categories = Array.isArray(movie.category) 
      ? movie.category 
      : movie.category 
        ? [movie.category] 
        : [];
    const countries = Array.isArray(movie.country) 
      ? movie.country 
      : movie.country 
        ? [movie.country] 
        : [];
    
    console.log("[MovieDetail] Movie data:", {
      name: movie.name,
      slug: movie.slug,
      hasEpisodes: !!movie.episodes,
      episodeCount: movie.episodes?.length || 0,
      hasCategory: categories.length > 0,
      categoryCount: categories.length,
      categoryType: Array.isArray(movie.category) ? "array" : typeof movie.category,
      countryType: Array.isArray(movie.country) ? "array" : typeof movie.country,
    });

    // Prefer poster_url for better quality in hero section
    const backdropUrl = getImageUrl(movie.poster_url || movie.poster_url);
    const posterUrl = getImageUrl(movie.poster_url || movie.poster_url);

    return (
      <>
        {/* Hero Section - Cinematic Sakura Style */}
        <section className="relative h-[55vh] sm:h-[70vh] md:h-[85vh] min-h-[350px] sm:min-h-[450px] md:min-h-[500px] flex items-end overflow-hidden animate-fade-in">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src={backdropUrl}
              alt={movie.name}
              fill
              className="object-cover object-center scale-105"
              priority
              sizes="100vw"
              quality={90}
              unoptimized
            />
            {/* Gradients */}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,10,0.1)_0%,rgba(5,5,10,0.4)_40%,rgba(5,5,10,0.9)_80%,rgba(5,5,10,1)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,110,160,0.25),transparent_55%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(255,182,213,0.18),transparent_55%)]" />
          </div>

          {/* Content Overlay - ẩn trên mobile, chỉ dùng hero text cho tablet/desktop */}
          <div className="container relative z-20 mx-auto px-4 md:px-12 pb-8 sm:pb-16 md:pb-24 w-full">
            <div className="max-w-2xl space-y-4 sm:space-y-5 animate-slide-up">
              {/* Meta chips - chỉ hiển thị trên tablet/desktop, mobile sẽ có block riêng phía dưới hero */}
              <div className="hidden sm:flex flex-wrap items-center gap-2 text-[10px] sm:text-xs text-white/70">
                {movie.quality && (
                  <span className="rounded-full border border-white/40 bg-black/40 px-2 py-0.5 text-[9px] sm:text-[10px]">
                    {movie.quality}
                  </span>
                )}
                {movie.current_episode && (
                  <span className="text-[#ff9d6b] text-[9px] sm:text-[10px]">
                    {movie.current_episode}
                  </span>
                )}
                {movie.time && (
                  <span className="text-white/70 text-[9px] sm:text-[10px]">
                    {movie.time}
                  </span>
                )}
              </div>

              {/* Title */}
              <h1 className="hidden sm:block text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-2 text-shadow-netflix">
                {movie.name}
              </h1>

              {/* Original Title */}
              {movie.original_name && movie.original_name !== movie.name && (
                <p className="text-sm sm:text-lg md:text-xl text-gray-200/90 mb-1.5 sm:mb-3 line-clamp-1 hidden sm:block">
                  {movie.original_name}
                </p>
              )}

              {/* Genres */}
              {categories.length > 0 && (
                <div className="hidden sm:flex flex-wrap items-center gap-1.5 text-sm text-gray-200/90">
                  {categories.slice(0, 4).map((cat, i) => {
                    const catName =
                      typeof cat === "object" && cat !== null
                        ? cat?.name || String(cat?.id || "")
                        : String(cat || "");

                    if (!catName) return null;

                    return (
                      <span key={(typeof cat === "object" && cat !== null && (cat as any)?.id) || i}>
                        {catName}
                        {i < Math.min(categories.length, 4) - 1 && (
                          <span className="mx-2 text-gray-500">•</span>
                        )}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* Description */}
              {movie.description && (
                <p
                  className="hidden sm:block text-sm md:text-base text-gray-100/90 line-clamp-3 md:line-clamp-4 max-w-xl"
                  dangerouslySetInnerHTML={{
                    __html: movie.description.replace(/<[^>]*>/g, "").slice(0, 220) + "...",
                  }}
                />
              )}

              {/* Action Buttons - chỉ hiển thị trên tablet/desktop, mobile dùng nút ở section Tập phim */}
              <div className="hidden sm:flex items-center gap-2 sm:gap-3 pt-1 relative z-30">
                {movie.episodes?.[0]?.items?.[0] && (
                  <Link
                    href={`/xem-phim/${movie.slug}/${movie.episodes[0].items[0].slug}`}
                    className="flex-1 sm:flex-initial"
                  >
                    <Button
                      size="lg"
                      className="bg-white hover:bg-white/90 text-black font-bold text-xs sm:text-sm md:text-base px-4 sm:px-6 md:px-8 h-9 sm:h-11 md:h-12 rounded-full shadow-[0_18px_40px_rgba(0,0,0,0.85)] w-full sm:w-auto"
                    >
                      <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1.5 sm:mr-2 fill-black" />
                      Phát ngay
                    </Button>
                  </Link>
                )}
                <Button
                  size="lg"
                  variant="secondary"
                  className="hidden sm:inline-flex bg-black/60 hover:bg-black/80 text-white font-semibold text-xs sm:text-sm md:text-base px-3 sm:px-5 md:px-6 h-9 sm:h-11 md:h-12 rounded-full border border-white/20"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1.5 sm:mr-2" />
                  Danh sách
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="hidden sm:inline-flex bg-black/60 hover:bg-black/80 text-white font-semibold text-xs sm:text-sm md:text-base px-3 sm:px-5 md:px-6 h-9 sm:h-11 md:h-12 rounded-full border border-white/20"
                >
                  <ThumbsUp className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1.5 sm:mr-2" />
                  Thích
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-black/60 hover:bg-black/80 text-white font-semibold text-sm md:text-base px-4 md:px-5 h-9 sm:h-11 md:h-12 rounded-full border border-white/25"
                >
                  <ChevronDown className="w-5 h-5 md:w-6 md:h-6" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="relative z-10 -mt-20 sm:-mt-20 pt-20 sm:pt-28 pb-16 bg-gradient-to-b from-[#05050a] via-[#05050a] to-[#05050a]">
          <div className="container mx-auto px-4 md:px-12 space-y-8 lg:space-y-12">
            {/* Mobile title + meta block trong nền đen dưới hero (tránh bị che trên poster) */}
            <div className="sm:hidden mb-2">
              <h1 className="text-lg font-bold text-white text-shadow-netflix">
                {movie.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-white/70">
                {movie.quality && (
                  <span className="rounded-full border border-white/30 bg-black/40 px-2 py-0.5">
                    {movie.quality}
                  </span>
                )}
                {movie.current_episode && (
                  <span className="text-[#ff9d6b]">{movie.current_episode}</span>
                )}
                {movie.time && <span className="text-white/70">{movie.time}</span>}
              </div>
            </div>
            {/* Episodes Section */}
            {Array.isArray(movie.episodes) && movie.episodes.length > 0 && (
              <div className="rounded-3xl bg-white/5 glass border border-[#fb743E]/15 p-4 sm:p-6 lg:p-8 shadow-[0_24px_80px_rgba(0,0,0,0.85)] animate-slide-up">
                <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold text-white flex items-center gap-2">
                      <span className="text-[#fb743E]">Tập phim</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-white/60 mt-1">
                      Chọn tập để xem ngay với player chất lượng cao.
                    </p>
                  </div>
                </div>

                {movie.episodes.map((server) => {
                  const items = Array.isArray(server.items) ? server.items : [];
                  return (
                  <div key={server.server_name || `server-${Math.random()}`} className="mb-6 last:mb-0">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-xs sm:text-sm text-[#fb743E] font-semibold uppercase tracking-[0.18em]">
                        {server.server_name}
                      </h3>
                      <span className="text-[11px] text-white/50">
                        {items.length} tập
                      </span>
                    </div>
                    {/* Episode buttons in wrapped rows (tối ưu cho mobile, không cần scroll ngang) */}
                    <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-6 md:grid-cols-7 lg:grid-cols-8 gap-2 sm:gap-2.5">
                      {items.map((episode, index) => (
                        <Link
                          key={episode.slug}
                          href={`/xem-phim/${movie.slug}/${episode.slug}`}
                        >
                          <Button
                            variant="outline"
                            className="w-full h-9 sm:h-10 rounded-full bg-[#151515]/90 border-[#fb743E]/25 text-white text-xs sm:text-sm font-semibold transition-all hover:!bg-[#fb743E] hover:!text-white hover:!border-[#fb743E] hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(0,0,0,0.8)] focus-visible:!ring-[#fb743E]/50"
                          >
                            Tập {index + 1}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  </div>
                )})}
              </div>
            )}

            {/* About Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10 items-start animate-slide-up">
              {/* Left Column - Info */}
              <div className="md:col-span-2 space-y-4 rounded-2xl bg-white/5 glass border border-white/10 p-4 sm:p-6 lg:p-7">
                {/* Cast & Crew */}
                <div className="space-y-3 text-sm">
                  {movie.director && (
                    <div>
                      <span className="text-[#fb743E]/70">Đạo diễn: </span>
                      <span className="text-white font-medium">{movie.director}</span>
                    </div>
                  )}
                  {movie.casts && (
                    <div>
                      <span className="text-[#fb743E]/70">Diễn viên: </span>
                      <span className="text-white font-medium">{movie.casts}</span>
                    </div>
                  )}
                </div>

                {/* Full Description */}
                {movie.description && (
                  <div className="pt-2">
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      <span className="text-[#fb743E]">Về phim này</span>
                    </h3>
                    <div
                      className="text-gray-200 text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: movie.description,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Right Column - Details */}
              <div className="space-y-4 rounded-2xl bg-white/5 glass border border-white/10 p-4 sm:p-6 lg:p-7 text-sm">
                {categories.length > 0 && (
                  <div>
                    <span className="text-[#fb743E]/70 text-sm block mb-1">Thể loại</span>
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat, index) => {
                        const catId =
                          typeof cat === "object" && cat !== null ? (cat as any)?.id || index : index;
                        const catSlug =
                          typeof cat === "object" && cat !== null
                            ? (cat as any)?.slug || ""
                            : typeof cat === "string"
                            ? cat
                            : "";
                        const catName =
                          typeof cat === "object" && cat !== null
                            ? (cat as any)?.name || String((cat as any)?.id || "") || "Unknown"
                            : String(cat || "Unknown");

                        if (!catSlug) return null;

                        return (
                          <Link key={catId} href={`/the-loai/${catSlug}`}>
                            <Badge
                              variant="outline"
                              className="bg-[#151515] border-[#fb743E]/30 text-white hover:border-[#fb743E] hover:bg-[#fb743E]/15 cursor-pointer transition-all rounded-full"
                            >
                              {catName}
                            </Badge>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {countries.length > 0 && (
                  <div>
                    <span className="text-[#fb743E]/70 text-sm block mb-1">Quốc gia</span>
                    <div className="flex flex-wrap gap-2">
                      {countries.map((country, index) => {
                        const countryId =
                          typeof country === "object" && country !== null
                            ? (country as any)?.id || index
                            : index;
                        const countrySlug =
                          typeof country === "object" && country !== null
                            ? (country as any)?.slug || ""
                            : typeof country === "string"
                            ? country
                            : "";
                        const countryName =
                          typeof country === "object" && country !== null
                            ? (country as any)?.name ||
                              String((country as any)?.id || "") ||
                              "Unknown"
                            : String(country || "Unknown");

                        if (!countrySlug) return null;

                        return (
                          <Link key={countryId} href={`/quoc-gia/${countrySlug}`}>
                            <Badge
                              variant="outline"
                              className="bg-[#151515] border-[#fb743E]/30 text-white hover:border-[#fb743E] hover:bg-[#fb743E]/15 cursor-pointer transition-all rounded-full"
                            >
                              {countryName}
                            </Badge>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}

                {movie.created && (
                  <div>
                    <span className="text-[#fb743E]/70 text-sm block mb-1">Năm phát hành</span>
                    <span className="text-white">
                      {new Date(movie.created).getFullYear()}
                    </span>
                  </div>
                )}

                {movie.time && (
                  <div>
                    <span className="text-[#fb743E]/70 text-sm block mb-1">Thời lượng</span>
                    <span className="text-white">{movie.time}</span>
                  </div>
                )}

                {movie.language && (
                  <div>
                    <span className="text-[#fb743E]/70 text-sm block mb-1">Ngôn ngữ</span>
                    <span className="text-white">{movie.language}</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </>
    );
  } catch (error) {
    console.error("[MovieDetail] Error rendering movie detail:", error);
    console.error("[MovieDetail] Error details:", {
      message: error instanceof Error ? error.message : String(error),
      status: (error as any)?.status,
      slug: slug,
    });
    
    // If it's a 404 error or "doesn't exist" message, show not found
    if (
      (error as any)?.status === 404 ||
      (error instanceof Error && (
        error.message.includes("doesn't exist") ||
        error.message.includes("not found") ||
        error.message.includes("404")
      ))
    ) {
      console.log("[MovieDetail] Treating as 404, calling notFound()");
      notFound();
    }
    
    return (
      <div className="container mx-auto px-4 pt-32 text-center space-y-4">
        <p className="text-destructive text-lg font-semibold">Có lỗi xảy ra. Vui lòng thử lại sau.</p>
        {process.env.NODE_ENV === "development" && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-500 rounded text-left text-sm text-red-300 max-w-2xl mx-auto">
            <p className="font-mono">
              <strong>Error:</strong> {error instanceof Error ? error.message : String(error)}
            </p>
            {error instanceof Error && error.stack && (
              <pre className="mt-2 text-xs overflow-auto">{error.stack}</pre>
            )}
          </div>
        )}
      </div>
    );
  }
}

function MovieDetailSkeleton() {
  return (
    <>
      {/* Hero Skeleton */}
      <section className="relative h-[55vh] sm:h-[70vh] md:h-[85vh] min-h-[350px] sm:min-h-[450px] md:min-h-[500px] flex items-end bg-[#0f0f0f]">
        <div className="container mx-auto px-4 md:px-12 pb-24">
          <div className="max-w-2xl space-y-4">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-12 w-32" />
              <Skeleton className="h-12 w-32" />
            </div>
          </div>
        </div>
      </section>

      {/* Content Skeleton */}
      <div className="bg-[#0f0f0f] -mt-32 pt-40">
        <div className="container mx-auto px-4 md:px-12">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="flex gap-2 mb-12">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-20 shrink-0" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { slug } = await params;

  return (
    <main className="min-h-screen bg-[#0f0f0f]">
      <Header />

      <Suspense fallback={<MovieDetailSkeleton />}>
        <MovieDetail slug={slug} />
      </Suspense>

      <Footer />
    </main>
  );
}

export async function generateMetadata({ params }: MoviePageProps) {
  const { slug } = await params;
  try {
    console.log("[generateMetadata] Fetching metadata for slug:", slug);
    const response = await getFilmDetail(slug);
    
    // Check if API returned error status
    if (!response || !response.movie) {
      console.error("[generateMetadata] No movie found for slug:", slug);
      return {
        title: "Chi tiết phim | Phim7.xyz",
      };
    }
    
    const movie = response.movie;
    
    return {
      title: `${movie.name} | Phim7.xyz`,
      description:
        movie.description?.replace(/<[^>]*>/g, "").slice(0, 160) ||
        `Xem phim ${movie.name} tại Phim7.xyz`,
    };
  } catch (error) {
    console.error("[generateMetadata] Error generating metadata:", error);
    // Don't throw error in metadata, just return default
    return {
      title: "Chi tiết phim | Phim7.xyz",
    };
  }
}
