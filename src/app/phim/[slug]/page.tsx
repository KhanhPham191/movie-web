import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MovieSection } from "@/components/movie-section";
import { EpisodeSelector } from "@/components/episode-selector";
import { MovieActionsWrapper } from "@/components/movie-actions-wrapper";
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
import { getFilmDetail, getImageUrl, getFilmsByGenre, getFilmsByCategory, CATEGORIES, searchFilmsMerged, type FilmItem } from "@/lib/api";

interface MoviePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ server?: string }>;
}

async function MovieDetail({ slug, serverParam }: { slug: string; serverParam?: string }) {
  try {
    const response = await getFilmDetail(slug);
    
    if (!response || !response.movie) {
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
    

    // backdropUrl: prefer thumb_url (landscape/backdrop), fallback to poster_url
    // posterUrl: prefer poster_url (portrait/poster), fallback to thumb_url
    const backdropUrl = getImageUrl(movie.poster_url);
    const posterUrl = getImageUrl(movie.poster_url || movie.thumb_url);

    // Chọn server mặc định: ưu tiên Vietsub, sau đó Lồng tiếng, sau đó Thuyết minh, cuối cùng là server đầu tiên
    const defaultServer = Array.isArray(movie.episodes)
      ? movie.episodes.find((s) => /vietsub/i.test(s.server_name)) ||
        movie.episodes.find((s) => /lồng\s*tiếng|long\s*tieng/i.test(s.server_name)) ||
        movie.episodes.find((s) => /thuyết\s*minh|thuyet\s*minh/i.test(s.server_name)) ||
        movie.episodes[0]
      : undefined;

    // Tìm các phần khác của cùng series
    const getBaseName = (name: string): string => {
      // Bỏ các pattern như "phần 5", "part 5", "tap 5", "tập 5", "5", "II", "III", etc.
      let baseName = name
        // Xử lý "Phần 5", "phần 5", "Part 5", etc. (có thể ở đầu, giữa hoặc cuối)
        .replace(/\s*(phần|part|tap|tập|episode|ep)\s*\d+/gi, "")
        .replace(/\s*-\s*(phần|part|tap|tập|episode|ep)\s*\d+/gi, "")
        .replace(/\s*:\s*(phần|part|tap|tập|episode|ep)\s*\d+/gi, "")
        // Xử lý số ở cuối
        .replace(/\s*\d+\s*$/, "")
        .replace(/\s*-\s*\d+\s*$/, "")
        .replace(/\s*:\s*\d+\s*$/, "")
        // Xử lý số La Mã và số thường ở cuối
        .replace(/\s*(II|III|IV|V|VI|VII|VIII|IX|X|2|3|4|5|6|7|8|9|10)+$/, "")
        .replace(/\s*-\s*(II|III|IV|V|VI|VII|VIII|IX|X|2|3|4|5|6|7|8|9|10)+$/, "")
        .trim();
      
      // Loại bỏ các ký tự đặc biệt ở cuối
      baseName = baseName.replace(/[:\-–—]\s*$/, "").trim();
      
      return baseName;
    };

    const baseName = getBaseName(movie.name);
    let relatedParts: FilmItem[] = [];
    
    // Chỉ tìm nếu base name khác với tên gốc (có nghĩa là có phần số)
    if (baseName !== movie.name && baseName.length > 3) {
      try {
        const searchResults = await searchFilmsMerged(baseName);
        
        // Lọc các phim có cùng base name và loại bỏ phim hiện tại
        // Sử dụng fuzzy matching để tìm các phim có base name tương tự
        relatedParts = searchResults
          .filter((m) => {
            const mBaseName = getBaseName(m.name);
            // So sánh không phân biệt hoa thường và loại bỏ khoảng trắng thừa
            const normalizedBase = baseName.toLowerCase().trim();
            const normalizedMBase = mBaseName.toLowerCase().trim();
            const matches = normalizedMBase === normalizedBase && m.slug !== movie.slug;
            return matches;
          })
          .slice(0, 10); // Giới hạn 10 phần
        
        // Sắp xếp theo tên để dễ tìm
        relatedParts.sort((a, b) => a.name.localeCompare(b.name, "vi"));
      } catch (error) {
        // Error fetching related parts
      }
    }

    return (
      <>
        {/* Hero Section - Cinematic Sakura Style */}
        <section className="relative h-[260px] xs:h-[300px] sm:h-[65vh] md:h-[80vh] min-h-[240px] xs:min-h-[260px] sm:min-h-[420px] md:min-h-[500px] flex items-end overflow-hidden animate-fade-in">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src={backdropUrl}
              alt={movie.name}
              fill
              className="object-cover object-top scale-105"
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 100vw"
              quality={85}
              unoptimized
            />
            {/* Premium Gradients */}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(25,27,36,0.1)_0%,rgba(25,27,36,0.45)_40%,rgba(25,27,36,0.92)_80%,rgba(25,27,36,1)_100%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(246,196,83,0.2),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(211,161,58,0.15),transparent_60%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(25,27,36,0.55)_0%,rgba(25,27,36,0.18)_30%,rgba(25,27,36,0)_50%)]" />
          </div>

          {/* Content Overlay - ẩn trên mobile, chỉ dùng hero text cho tablet/desktop */}
          <div className="container relative z-20 mx-auto px-4 md:px-12 pb-8 sm:pb-16 md:pb-24 w-full">
            <div className="max-w-2xl space-y-4 sm:space-y-5 animate-slide-up">
              {/* Meta chips - chỉ hiển thị trên tablet/desktop, mobile sẽ có block riêng phía dưới hero */}
              <div className="hidden sm:flex flex-wrap items-center gap-2 text-[10px] sm:text-xs text-white/70">
                {movie.quality && (
                  <span className="rounded-full border border-white/40 bg-[#191b24]/70 px-2 py-0.5 text-[9px] sm:text-[10px]">
                    {movie.quality}
                  </span>
                )}
                {movie.current_episode && (
                  <span className="text-[#F6C453] text-[9px] sm:text-[10px] font-semibold">
                    {movie.current_episode}
                  </span>
                )}
                {movie.time && (
                  <span className="text-white/70 text-[9px] sm:text-[10px]">
                    {movie.time}
                  </span>
                )}
              </div>

              {/* Premium Title */}
              <h1 className="hidden sm:block text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-2 text-shadow-netflix leading-tight tracking-tight">
                <span className="bg-gradient-to-r from-white via-white to-white/90 bg-clip-text text-transparent">
                  {movie.name}
                </span>
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
                {defaultServer?.items?.[0] && (
                  <Link
                    href={`/xem-phim/${movie.slug}/${defaultServer.items[0].slug}`}
                    className="flex-1 sm:flex-initial"
                  >
                    <Button
                      size="lg"
                      className="relative group/btn bg-gradient-to-r from-[#F6C453] to-[#D3A13A] hover:from-[#F6C453]/90 hover:to-[#D3A13A]/90 text-white font-bold text-xs sm:text-sm md:text-base px-4 sm:px-6 md:px-8 h-9 sm:h-11 md:h-12 rounded-full shadow-[0_18px_40px_rgba(246,196,83,0.4)] hover:shadow-[0_24px_50px_rgba(246,196,83,0.5)] transition-all duration-300 w-full sm:w-auto border border-[#F6C453]/30"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                      <Play className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 mr-1.5 sm:mr-2 fill-white" />
                      <span className="relative z-10">Phát ngay</span>
                    </Button>
                  </Link>
                )}
                {/* Movie Actions - Yêu thích, Đánh giá, Thêm vào danh sách */}
                <div className="hidden sm:flex items-center gap-2">
                  <Suspense fallback={null}>
                    <MovieActionsWrapper movie={movie} />
                  </Suspense>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content - Premium Layout */}
        <div className="relative z-10 -mt-16 sm:-mt-20 pt-5 sm:pt-28 pb-16 sm:pb-20 bg-gradient-to-b from-[#191b24] via-[#191b24] to-[#191b24]">
          {/* Premium Background Effects */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-0 top-20 h-96 w-96 rounded-full bg-gradient-to-r from-[#F6C453]/8 via-transparent to-transparent blur-3xl" />
            <div className="absolute right-0 top-1/2 h-80 w-80 rounded-full bg-gradient-to-l from-[#D3A13A]/8 via-transparent to-transparent blur-3xl" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(246,196,83,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(246,196,83,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
          </div>
          <div className="container relative z-10 mx-auto px-3 sm:px-4 md:px-12 space-y-6 sm:space-y-8 lg:space-y-12">
            {/* Mobile title + meta block trong nền đen dưới hero (tránh bị che trên poster) */}
            <div className="sm:hidden mb-3">
              <h1 className="text-base font-bold text-white text-shadow-netflix">
                {movie.name}
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-white/70">
                {movie.quality && (
                  <span className="rounded-full border border-white/30 bg-[#191b24]/70 px-1.5 py-0.5">
                    {movie.quality}
                  </span>
                )}
                {movie.current_episode && (
                  <span className="text-[#F6C453] font-semibold">{movie.current_episode}</span>
                )}
                {movie.time && <span className="text-white/70">{movie.time}</span>}
              </div>
            </div>
            {/* Episodes Section */}
            {Array.isArray(movie.episodes) && movie.episodes.length > 0 && (
              <EpisodeSelector
                servers={movie.episodes}
                movieSlug={movie.slug}
                defaultServer={serverParam}
              />
            )}

            {/* Related Parts Section */}
            {relatedParts.length > 0 && (
              <div className="space-y-2 sm:space-y-3 md:space-y-4 animate-slide-up">
                {/* Header với tiêu đề phim */}
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-semibold text-white">
                      <span className="text-[#F6C453]">Các phần khác</span>
                    </h2>
                    <span className="text-[10px] sm:text-xs text-gray-400">
                      ({relatedParts.length} {relatedParts.length === 1 ? "phần" : "phần"})
                    </span>
                  </div>
                </div>
                
                {/* Grid responsive cho mobile, tablet và desktop */}
                <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
                  {relatedParts.map((part) => (
                    <Link
                      key={part.slug}
                      href={`/phim/${part.slug}`}
                      className="group relative aspect-[2/3] rounded-md sm:rounded-lg md:rounded-xl overflow-hidden bg-[#151515] border border-white/10 hover:border-[#F6C453]/50 transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105 hover:shadow-[0_8px_30px_rgba(246,196,83,0.3)]"
                    >
                      <Image
                        src={getImageUrl(part.thumb_url || part.poster_url)}
                        alt={part.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                        sizes="(max-width: 475px) 50vw, (max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
                      />
                      {/* Gradient overlay - luôn hiển thị một phần trên mobile */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300" />
                      
                      {/* Title overlay - luôn hiển thị trên mobile, hover trên desktop */}
                      <div className="absolute bottom-0 left-0 right-0 p-1.5 sm:p-2 md:p-3 transform translate-y-0 sm:translate-y-full sm:group-hover:translate-y-0 transition-transform duration-300">
                        <h3 className="text-[10px] xs:text-xs sm:text-sm font-semibold text-white line-clamp-2 leading-tight">
                          {part.name}
                        </h3>
                        {part.current_episode && (
                          <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-300 mt-0.5 sm:mt-1 line-clamp-1">
                            {part.current_episode}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Premium About Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-10 items-start animate-slide-up">
              {/* Left Column - Premium Info */}
              <div className="md:col-span-2 space-y-3 sm:space-y-4 card-surface p-4 sm:p-6 lg:p-8 relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#F6C453]/5 via-transparent to-[#D3A13A]/5 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                {/* Cast & Crew */}
                <div className="space-y-3 text-sm">
                  {movie.director && (
                    <div>
                      <span className="text-[#F6C453]/70">Đạo diễn: </span>
                      <span className="text-white font-medium">{movie.director}</span>
                    </div>
                  )}
                  {movie.casts && (
                    <div>
                      <span className="text-[#F6C453]/70">Diễn viên: </span>
                      <span className="text-white font-medium">{movie.casts}</span>
                    </div>
                  )}
                </div>

                {/* Full Description */}
                {movie.description && (
                  <div className="pt-2">
                    <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                      <span className="text-[#F6C453]">Về phim này</span>
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
              </div>

              {/* Right Column - Premium Details */}
              <div className="space-y-3 sm:space-y-4 card-surface p-4 sm:p-6 lg:p-8 text-xs sm:text-sm relative group">
                <div className="absolute inset-0 bg-gradient-to-tl from-[#D3A13A]/5 via-transparent to-[#F6C453]/5 rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative z-10">
                {categories.length > 0 && (
                  <div>
                    <span className="text-[#F6C453]/70 text-sm block mb-1">Thể loại</span>
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
                              className="bg-[#151515] border-[#F6C453]/30 text-white hover:border-[#F6C453] hover:bg-[#F6C453]/15 cursor-pointer transition-all rounded-full"
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
                    <span className="text-[#F6C453]/70 text-sm block mb-1">Quốc gia</span>
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
                              className="bg-[#151515] border-[#F6C453]/30 text-white hover:border-[#F6C453] hover:bg-[#F6C453]/15 cursor-pointer transition-all rounded-full"
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
                    <span className="text-[#F6C453]/70 text-sm block mb-1">Năm phát hành</span>
                    <span className="text-white">
                      {new Date(movie.created).getFullYear()}
                    </span>
                  </div>
                )}

                {movie.time && (
                  <div>
                    <span className="text-[#F6C453]/70 text-sm block mb-1">Thời lượng</span>
                    <span className="text-white">{movie.time}</span>
                  </div>
                )}

                {movie.language && (
                  <div>
                    <span className="text-[#F6C453]/70 text-sm block mb-1">Ngôn ngữ</span>
                    <span className="text-white">{movie.language}</span>
                  </div>
                )}
                </div>
              </div>
            </div>

          </div>
        </div>
      </>
    );
  } catch (error) {
    // If it's a 404 error or "doesn't exist" message, show not found
    if (
      (error as any)?.status === 404 ||
      (error instanceof Error && (
        error.message.includes("doesn't exist") ||
        error.message.includes("not found") ||
        error.message.includes("404")
      ))
    ) {
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
        <section className="relative h-[55vh] sm:h-[70vh] md:h-[85vh] min-h-[350px] sm:min-h-[450px] md:min-h-[500px] flex items-end bg-[#191b24]">
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
      <div className="bg-[#191b24] -mt-32 pt-40">
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

export default async function MoviePage({ params, searchParams }: MoviePageProps) {
  const { slug } = await params;
  const { server } = await searchParams;

  return (
    <main className="min-h-screen bg-[#191b24]">
      <Header />

      <Suspense fallback={<MovieDetailSkeleton />}>
        <MovieDetail slug={slug} serverParam={server} />
      </Suspense>

      <Footer />
    </main>
  );
}

export async function generateMetadata({ params }: MoviePageProps) {
  const { slug } = await params;
  try {
    const response = await getFilmDetail(slug);
    
    // Check if API returned error status
    if (!response || !response.movie) {
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
    // Don't throw error in metadata, just return default
    return {
      title: "Chi tiết phim | Phim7.xyz",
    };
  }
}
