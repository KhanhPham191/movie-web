import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/footer";
import { EpisodeSelector } from "@/components/episode-selector";
import { MovieActionsWrapper } from "@/components/movie-actions-wrapper";
import { FilmDetailTracker } from "@/components/film-detail-tracker";
import { FilmDetailPlayButton } from "@/components/film-detail-play-button";
import { FilmDetailCategoryLink } from "@/components/film-detail-category-link";
import { FilmDetailCountryLink } from "@/components/film-detail-country-link";
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
import { getFilmDetail, getImageUrl, searchFilmsMerged } from "@/lib/api";
import type { FilmItem } from "@/lib/api";
import { MovieSection } from "@/components/movie-section";
import { isValidTime } from "@/lib/utils";
import { generateMovieStructuredData } from "@/lib/structured-data";
import { Breadcrumbs } from "@/components/breadcrumbs";

// Lấy số "phần" của series từ slug/tên phim (phan-1, (Phần 1), Season 1, ...)
function getSeriesPartNumber(item: { slug: string; name: string; original_name: string }): number | null {
  // Ưu tiên đọc từ slug: tai-xe-an-danh-phan-3
  const slugMatch = item.slug.match(/-phan-(\d+)$/i);
  if (slugMatch) {
    const n = parseInt(slugMatch[1], 10);
    if (!Number.isNaN(n)) return n;
  }

  // Thử đọc từ tên hiển thị: Tài Xế Ẩn Danh (Phần 3)
  const nameMatch = item.name.match(/\(Phần\s*(\d+)\)/i);
  if (nameMatch) {
    const n = parseInt(nameMatch[1], 10);
    if (!Number.isNaN(n)) return n;
  }

  // Thử đọc từ original_name: Taxi Driver Season 3
  const originalMatch = item.original_name?.match(/Season\s*(\d+)/i);
  if (originalMatch) {
    const n = parseInt(originalMatch[1], 10);
    if (!Number.isNaN(n)) return n;
  }

  return null;
}

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

    // Tìm các phần khác trong cùng series (nếu có)
    // Ưu tiên gom theo base slug: tai-xe-an-danh-phan-1, tai-xe-an-danh-phan-2, ...
    let seriesParts: FilmItem[] = [];
    const baseSlug = movie.slug.replace(/-phan-\d+$/i, "");
    const baseName = movie.name.replace(/\s*\(Phần\s*\d+\)\s*$/i, "");
    const baseOriginalName = movie.original_name
      ? movie.original_name.replace(/\s*\(Season\s*\d+\)\s*$/i, "")
      : "";
    const searchKeyword = baseOriginalName || baseName || movie.name;
    try {
      if (searchKeyword) {
        const searchResults = await searchFilmsMerged(searchKeyword);
        const filtered = searchResults.filter((item) => {
          const itemBaseSlug = item.slug.replace(/-phan-\d+$/i, "");
          return item.slug !== movie.slug && itemBaseSlug === baseSlug;
        });

        // Sắp xếp theo thứ tự phần 1, 2, 3,...
        const withPart = filtered
          .map((item) => ({
            item,
            part: getSeriesPartNumber(item),
          }))
          .filter((x) => x.part !== null) as { item: FilmItem; part: number }[];

        withPart.sort((a, b) => a.part - b.part);
        seriesParts = withPart.map((x) => x.item);
      }
    } catch {
      // Không chặn trang nếu search lỗi
      seriesParts = [];
    }
    
    // Normalize category và country về dạng mảng
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
    
    // backdropUrl: dùng thumb_url (landscape/backdrop) cho hero section
    // posterUrl: dùng thumb_url cho episode selector
    const backdropUrl = getImageUrl(movie.thumb_url || movie.poster_url);
    const posterUrl = getImageUrl(movie.thumb_url || movie.poster_url);

    // Chọn server mặc định: ưu tiên Vietsub, sau đó Lồng tiếng, sau đó Thuyết minh, cuối cùng là server đầu tiên
    const defaultServer = Array.isArray(movie.episodes)
      ? movie.episodes.find((s) => /vietsub/i.test(s.server_name)) ||
        movie.episodes.find((s) => /lồng\s*tiếng|long\s*tieng/i.test(s.server_name)) ||
        movie.episodes.find((s) => /thuyết\s*minh|thuyet\s*minh/i.test(s.server_name)) ||
        movie.episodes[0]
      : undefined;

    return (
      <>
        <FilmDetailTracker movieName={movie.name} movieSlug={movie.slug} />
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
                {isValidTime(movie.time) && (
                  <span className="text-white/70 text-[9px] sm:text-[10px]">
                    {movie.time}
                  </span>
                )}
                {typeof movie.vote_average === 'number' && !isNaN(movie.vote_average) && movie.vote_average > 0 && (
                  <span className="rounded-full border border-[#F6C453]/50 bg-[#F6C453]/20 px-2 py-0.5 text-[9px] sm:text-[10px] font-semibold text-[#F6C453] flex items-center gap-1">
                    <span>⭐</span>
                    <span>{movie.vote_average.toFixed(1)}</span>
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
                  <FilmDetailPlayButton
                    href={`/xem-phim/${movie.slug}/${defaultServer.items[0].slug}`}
                    movieName={movie.name}
                    movieSlug={movie.slug}
                    episodeSlug={defaultServer.items[0].slug}
                  />
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
          </div>
          <div className="container relative z-10 mx-auto space-y-6 sm:space-y-8 lg:space-y-12">
            {/* Mobile title + meta block trong nền đen dưới hero (tránh bị che trên poster) */}
            <div className="sm:hidden mb-3 mx-3 sm:mx-4 md:mx-12">
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
                {isValidTime(movie.time) && <span className="text-white/70">{movie.time}</span>}
                {movie.vote_average && typeof movie.vote_average === 'number' && !isNaN(movie.vote_average) && movie.vote_average > 0 && (
                  <span className="rounded-full border border-[#F6C453]/50 bg-[#F6C453]/20 px-1.5 py-0.5 font-semibold text-[#F6C453] flex items-center gap-1">
                    <span>⭐</span>
                    <span>{movie.vote_average.toFixed(1)}</span>
                  </span>
                )}
              </div>
            </div>
            {/* Episodes Section */}
            {Array.isArray(movie.episodes) && movie.episodes.length > 0 && (
              <div className="mx-3 sm:mx-4 md:mx-12">
                <EpisodeSelector
                  servers={movie.episodes}
                  movieSlug={movie.slug}
                  defaultServer={serverParam}
                  movieName={movie.name}
                  posterUrl={movie.thumb_url || movie.poster_url}
                />
              </div>
            )}

            {/* Premium About Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-10 items-start animate-slide-up mx-3 sm:mx-4 md:mx-12">
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
                          <FilmDetailCategoryLink
                            key={catId}
                            href={`/the-loai/${catSlug}`}
                            categoryName={catName}
                            categorySlug={catSlug}
                            movieName={movie.name}
                            movieSlug={movie.slug}
                          />
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
                          <FilmDetailCountryLink
                            key={countryId}
                            href={`/quoc-gia/${countrySlug}`}
                            countryName={countryName}
                            countrySlug={countrySlug}
                            movieName={movie.name}
                            movieSlug={movie.slug}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {(() => {
                  // Ưu tiên lấy từ field year (nếu API trả về), fallback về created nếu không có
                  const movieYear = (movie as { year?: number | string }).year;
                  const releaseYear = movieYear
                    ? (typeof movieYear === "number" ? movieYear : parseInt(String(movieYear), 10))
                    : movie.created
                      ? new Date(movie.created).getFullYear()
                      : null;
                  
                  return releaseYear && !isNaN(releaseYear) && releaseYear >= 1900 && releaseYear <= 2100 ? (
                    <div>
                      <span className="text-[#F6C453]/70 text-sm block mb-1">Năm phát hành</span>
                      <span className="text-white">
                        {releaseYear}
                      </span>
                    </div>
                  ) : null;
                })()}

                {isValidTime(movie.time) && (
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

                {(() => {
                  const imdbNumber = Number(movie.imdb);
                  const tmdbNumber = Number(movie.tmdb);

                  const hasValidImdb =
                    movie.imdb != null &&
                    String(movie.imdb).trim() !== "" &&
                    !Number.isNaN(imdbNumber) &&
                    imdbNumber > 0;

                  const hasValidTmdb =
                    movie.tmdb != null &&
                    String(movie.tmdb).trim() !== "" &&
                    !Number.isNaN(tmdbNumber) &&
                    tmdbNumber > 0;

                  if (!hasValidImdb && !hasValidTmdb) return null;

                  return (
                    <div>
                      <span className="text-[#F6C453]/70 text-sm block mb-1">Đánh giá</span>
                      <div className="flex flex-wrap gap-2">
                        {hasValidImdb && (
                          <Badge className="bg-yellow-500 text-black font-semibold text-xs px-2 py-1">
                            IMDb {movie.imdb}
                          </Badge>
                        )}
                        {hasValidTmdb && (
                          <Badge className="bg-blue-500 text-white font-semibold text-xs px-2 py-1">
                            TMDB {movie.tmdb}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })()}
                </div>
              </div>
            </div>

            {/* Series Section - Các phần khác trong series */}
            {Array.isArray(seriesParts) && seriesParts.length > 0 && (
              <div className="mx-3 sm:mx-4 md:mx-12">
                <MovieSection
                  title="Các phần khác trong series"
                  movies={seriesParts}
                  variant="series"
                />
              </div>
            )}

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
      <Suspense fallback={<MovieDetailSkeleton />}>
        <MovieDetail slug={slug} serverParam={server} />
      </Suspense>

      <Footer />
    </main>
  );
}

export async function generateMetadata({ params }: MoviePageProps) {
  const { slug } = await params;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://movpey.example.com");
  
  try {
    const response = await getFilmDetail(slug);
    
    // Check if API returned error status
    if (!response || !response.movie) {
      return {
        title: "Chi tiết phim | MovPey",
        description: "Xem chi tiết phim, nội dung, diễn viên và thông tin đầy đủ trên MovPey.",
      };
    }
    
    const movie = response.movie;
    const plainDescription =
      movie.description?.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim() ?? "";
    
    const description = plainDescription.slice(0, 160) ||
      `Xem phim ${movie.name}${movie.year ? ` (${movie.year})` : ''} online HD Vietsub, thuyết minh miễn phí. ${movie.category?.map(c => c.name).join(', ') || ''}. Xem ngay trên MovPey!`;
    
    const title = `${movie.name}${movie.year ? ` (${movie.year})` : ''} - Thông tin, nội dung phim | MovPey`;
    const movieUrl = `${siteUrl}/phim/${slug}`;
    const imageUrl = getImageUrl(movie.poster_url || movie.thumb_url, true);

    return {
      title,
      description,
      keywords: [
        movie.name,
        ...(movie.category?.map(c => c.name) || []),
        ...(movie.country?.map(c => c.name) || []),
        "xem phim online",
        "phim vietsub",
        "phim thuyết minh",
        "phim hd",
        "phim miễn phí",
      ],
      openGraph: {
        title: `${movie.name} | MovPey`,
        description: description,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: movie.name,
          },
        ],
        type: "video.movie",
        url: movieUrl,
        siteName: "MovPey",
        locale: "vi_VN",
      },
      twitter: {
        card: "summary_large_image",
        title: `${movie.name} | MovPey`,
        description: description,
        images: [imageUrl],
      },
      alternates: {
        canonical: movieUrl,
      },
    };
  } catch (error) {
    // Don't throw error in metadata, just return default
    return {
      title: "Chi tiết phim | MovPey",
      description: "Xem chi tiết phim, nội dung và thông tin diễn viên trên MovPey.",
    };
  }
}
