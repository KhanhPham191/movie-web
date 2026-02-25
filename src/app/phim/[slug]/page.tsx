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
import { getFilmDetail, getImageUrl, searchFilmsMerged, getFilmsByGenre } from "@/lib/api";

const BLUR_DATA_URL = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjE1IiBmaWxsPSIjMWExYTJlIi8+PC9zdmc+";
import type { FilmItem } from "@/lib/api";
import { MovieSection } from "@/components/movie-section";
import { MovieSectionWithNav } from "@/components/movie-section-with-nav";
import { isValidTime } from "@/lib/utils";
import {
  generateMovieStructuredData,
  generateBreadcrumbStructuredData,
  generateFAQStructuredData,
} from "@/lib/structured-data";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { MovieComments } from "@/components/movie-comments";

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
    
    // Nếu API trả lỗi hoặc không có movie, chuyển sang trang 404 thay vì throw error
    if (!response || response.status === "error" || !response.movie) {
      notFound();
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

    // Lấy tên + slug thể loại đầu tiên (nếu có) để hiển thị title/SEO & link an toàn
    const firstCategoryName = (() => {
      const first = categories[0] as any;
      if (!first) return "";
      if (typeof first === "object" && first !== null) {
        const name = String(first?.name || "").trim();
        if (name) return name;
        const id = String(first?.id || "").trim();
        return id;
      }
      return String(first || "").trim();
    })();

    const firstCategorySlug = (() => {
      const first = categories[0] as any;
      if (!first || typeof first !== "object") return "";
      return String(first?.slug || "").trim();
    })();
    
    // Lấy phim liên quan cùng thể loại (để tăng internal linking cho SEO)
    let relatedMovies: FilmItem[] = [];
    try {
      if (categories.length > 0) {
        // Lấy phim cùng thể loại đầu tiên, loại trừ phim hiện tại
        const genreSlug = categories[0].slug;
        const relatedResponse = await getFilmsByGenre(genreSlug, 1, {
          limit: 12,
          sort_field: "modified",
          sort_type: "desc",
        });
        
        if (relatedResponse.status === "success" && relatedResponse.items) {
          relatedMovies = relatedResponse.items
            .filter((item) => item.slug !== movie.slug)
            .slice(0, 12);
        }
      }
    } catch {
      // Không chặn trang nếu fetch related movies lỗi
      relatedMovies = [];
    }
    
    // backdropUrl: dùng thumb_url (landscape/backdrop) cho hero section
    // posterUrl: dùng thumb_url cho episode selector
    const backdropUrl = getImageUrl(movie.thumb_url || movie.poster_url);
    const posterUrl = getImageUrl(movie.poster_url);

    // Chọn server mặc định: ưu tiên Vietsub, sau đó Lồng tiếng, sau đó Thuyết minh, cuối cùng là server đầu tiên
    const defaultServer = Array.isArray(movie.episodes)
      ? movie.episodes.find((s) => /vietsub/i.test(s.server_name)) ||
        movie.episodes.find((s) => /lồng\s*tiếng|long\s*tieng/i.test(s.server_name)) ||
        movie.episodes.find((s) => /thuyết\s*minh|thuyet\s*minh/i.test(s.server_name)) ||
        movie.episodes[0]
      : undefined;

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://movpey.example.com");

    const movieStructuredData = generateMovieStructuredData(movie, `${siteUrl}/phim/${movie.slug}`);
    const breadcrumbStructuredData = generateBreadcrumbStructuredData([
      { name: "Trang chủ", url: siteUrl },
      { name: movie.name, url: `${siteUrl}/phim/${movie.slug}` },
    ]);

    const faqItems = [
      movie.description && {
        question: `Nội dung phim ${movie.name} là gì?`,
        answer:
          typeof movie.description === "string"
            ? movie.description.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim()
            : `Xem phim ${movie.name} online HD Vietsub, thuyết minh miễn phí trên MovPey.`,
      },
      movie.time && {
        question: `Phim ${movie.name} dài bao nhiêu phút?`,
        answer: `Phim ${movie.name} có thời lượng ${movie.time}.`,
      },
      movie.casts && {
        question: `Phim ${movie.name} có những diễn viên nào tham gia?`,
        answer: `Phim ${movie.name} có sự tham gia của: ${movie.casts}.`,
      },
      movie.director && {
        question: `Ai là đạo diễn của phim ${movie.name}?`,
        answer: `Đạo diễn của phim ${movie.name} là ${movie.director}.`,
      },
      {
        question: `Xem phim ${movie.name} ở đâu?`,
        answer: `Bạn có thể xem phim ${movie.name} online miễn phí, chất lượng cao trên MovPey tại địa chỉ ${siteUrl}/phim/${movie.slug}.`,
      },
    ].filter(Boolean) as { question: string; answer: string }[];

    const faqStructuredData =
      faqItems.length > 0 ? generateFAQStructuredData(faqItems) : null;

    // Tính năm phát hành dùng chung cho hero + details
    const movieYearRaw = (movie as { year?: number | string }).year;
    const releaseYear =
      movieYearRaw
        ? (typeof movieYearRaw === "number"
            ? movieYearRaw
            : parseInt(String(movieYearRaw), 10))
        : movie.created
          ? new Date(movie.created).getFullYear()
          : null;

    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(movieStructuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
        />
        {faqStructuredData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
          />
        )}
        <FilmDetailTracker movieName={movie.name} movieSlug={movie.slug} />

        {/* Hero + Detail container kiểu iQIYI: poster trái, info phải */}
        <section className="relative overflow-hidden bg-[#050814] pb-10 pt-16 sm:pt-24 lg:pt-28">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src={backdropUrl}
              alt={movie.name}
              fill
              className="object-cover object-top scale-105"
              priority
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 100vw, 100vw"
              quality={75}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
            {/* Dark gradient overlays giống screenshot */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/70 to-[#050814]" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-transparent" />
          </div>

          <div className="relative z-10 container mx-auto px-4 md:px-10 lg:px-16">
            <div className="flex flex-col lg:flex-row items-start gap-8 lg:gap-10 xl:gap-14 lg:items-stretch">
              {/* Poster + nút xem phim */}
              <div className="w-[210px] sm:w-[230px] md:w-[260px] lg:w-[280px] xl:w-[300px] flex-shrink-0 mx-auto lg:mx-0 lg:self-center">
                <div className="relative aspect-[2/3] rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_20px_40px_rgba(0,0,0,0.9)] border border-white/15 bg-black/50">
                  <Image
                    src={posterUrl}
                    alt={movie.name}
                    fill
                    className="object-cover object-center"
                    sizes="260px"
                    quality={75}
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                  />
                </div>

                {defaultServer?.items?.[0] && (
                  <div className="mt-6 md:hidden">
                    <FilmDetailPlayButton
                      href={`/xem-phim/${movie.slug}/${defaultServer.items[0].slug}`}
                      movieName={movie.name}
                      movieSlug={movie.slug}
                      episodeSlug={defaultServer.items[0].slug}
                    />
                  </div>
                )}
              </div>

              {/* Thông tin phim bên phải */}
              <div className="flex-1 text-white">
                {/* Meta line nhỏ phía trên */}
                <div className="flex flex-wrap items-center gap-2 text-[12px] sm:text-sm text-white/70 mb-2 sm:mb-3">
                  {movie.quality && (
                    <span className="rounded-full border border-white/40 bg-white/5 px-2 py-0.5">
                      {movie.quality}
                    </span>
                  )}
                  {movie.current_episode && (
                    <span className="text-[#F6C453] font-semibold">
                      {movie.current_episode}
                    </span>
                  )}
                  {isValidTime(movie.time) && (
                    <span>{movie.time}</span>
                  )}
                  {/* Badge rating IMDb/TMDB đưa lên cùng hàng meta */}
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

                    const formatScore = (score: number | string) => {
                      const num = Number(score);
                      if (Number.isNaN(num)) return score;
                      return Number.isInteger(num) ? num.toString() : num.toFixed(1);
                    };

                    return (
                      <>
                        {hasValidImdb && (
                          <Badge className="bg-yellow-500 text-black font-semibold text-[11px] px-2.5 py-0.5 rounded-full">
                            IMDb {formatScore(movie.imdb as any)}
                          </Badge>
                        )}
                        {hasValidTmdb && (
                          <Badge className="bg-blue-500 text-white font-semibold text-[11px] px-2.5 py-0.5 rounded-full">
                            TMDB {formatScore(movie.tmdb as any)}
                          </Badge>
                        )}
                      </>
                    );
                  })()}
                </div>

                {/* Tiêu đề lớn */}
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-black leading-tight tracking-tight mb-1">
                  <span className="bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent">
                    {movie.name}
                  </span>
                </h1>

                {/* Tên gốc dưới tiêu đề */}
                {movie.original_name && movie.original_name !== movie.name && (
                  <p className="text-sm sm:text-base md:text-lg text-gray-200/90 mb-3 sm:mb-4">
                    {movie.original_name}
                    {releaseYear &&
                      !Number.isNaN(releaseYear) &&
                      releaseYear >= 1900 &&
                      releaseYear <= 2100 && (
                        <span className="ml-2 text-gray-400">({releaseYear})</span>
                      )}
                  </p>
                )}

                {/* Thể loại dạng pill giống iQIYI */}
                {categories.length > 0 && (
                  <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm mb-4 sm:mb-5">
                    {categories.slice(0, 6).map((cat, i) => {
                      const catName =
                        typeof cat === "object" && cat !== null
                          ? (cat as any)?.name || String((cat as any)?.id || "")
                          : String(cat || "");

                      if (!catName) return null;

                      return (
                        <span
                          key={
                            (typeof cat === "object" &&
                              cat !== null &&
                              (cat as any)?.id) ||
                            i
                          }
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1"
                        >
                          {catName}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Mô tả ngắn */}
                {movie.description && (
                  <p
                    className="text-xs sm:text-sm md:text-base text-gray-100/90 max-w-2xl mb-4 sm:mb-6 line-clamp-3 md:line-clamp-4"
                    dangerouslySetInnerHTML={{
                      __html:
                        movie.description.replace(/<[^>]*>/g, "").slice(0, 260) +
                        "...",
                    }}
                  />
                )}

                {/* Hàng meta: đạo diễn, quốc gia, ngôn ngữ */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm text-gray-200/90 mb-5 sm:mb-6 max-w-3xl">
                  <div>
                    <div className="text-white/50 uppercase tracking-wide text-[10px] sm:text-[11px] mb-1">
                      ĐẠO DIỄN
                    </div>
                    <div className="font-medium">
                      {movie.director || "Đang cập nhật"}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/50 uppercase tracking-wide text-[10px] sm:text-[11px] mb-1">
                      QUỐC GIA
                    </div>
                    <div className="font-medium">
                      {countries.length > 0
                        ? countries
                            .map((country) =>
                              typeof country === "object" && country !== null
                                ? (country as any)?.name ||
                                  String((country as any)?.id || "")
                                : String(country || "")
                            )
                            .filter(Boolean)
                            .join(", ")
                        : "Đang cập nhật"}
                    </div>
                  </div>
                  <div>
                    <div className="text-white/50 uppercase tracking-wide text-[10px] sm:text-[11px] mb-1">
                      NGÔN NGỮ
                    </div>
                    <div className="font-medium">
                      {movie.language || "Đang cập nhật"}
                    </div>
                  </div>
                </div>

                {/* Nút hành động phụ / danh sách yêu thích giống thanh action bên phải */}
                {/* Chỉ hiển thị hàng ngang Play + yêu thích/đánh giá trên desktop */}
                {defaultServer?.items?.[0] && (
                  <div className="hidden md:flex flex-wrap items-center gap-3">
                    <FilmDetailPlayButton
                      href={`/xem-phim/${movie.slug}/${defaultServer.items[0].slug}`}
                      movieName={movie.name}
                      movieSlug={movie.slug}
                      episodeSlug={defaultServer.items[0].slug}
                    />
                    <Suspense fallback={null}>
                      <MovieActionsWrapper movie={movie} />
                    </Suspense>
                  </div>
                )}
              </div>
            </div>

            {/* Dải diễn viên đơn giản phía dưới hero (lấy từ movie.casts dạng text) */}
            {movie.casts && (
              <div className="mt-8 border-t border-white/10 pt-5">
                <h3 className="text-sm sm:text-base font-semibold text-white mb-3">
                  Diễn viên
                </h3>
                <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-2">
                  {String(movie.casts)
                    .split(/,|\/|&/g)
                    .map((raw) => raw.trim())
                    .filter(Boolean)
                    .map((name, idx) => (
                      <div
                        key={idx}
                        className="flex-none w-20 sm:w-24 text-center group"
                      >
                        <div className="mx-auto mb-2 h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-gradient-to-br from-white/15 via-white/5 to-transparent flex items-center justify-center text-sm font-semibold text-white/90 border border-white/15 shadow-[0_10px_30px_rgba(0,0,0,0.7)]">
                          {name
                            .split(" ")
                            .filter(Boolean)
                            .slice(-2)
                            .map((part) => part[0])
                            .join("")
                            .toUpperCase()}
                        </div>
                        <div className="text-[10px] sm:text-xs text-gray-100 line-clamp-2">
                          {name}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Main Content - giữ các block hiện có bên dưới hero */}
        <div className="relative z-10 bg-gradient-to-b from-[#050814] via-[#050814] to-[#050814] pt-6 sm:pt-8 pb-16 sm:pb-20">
          {/* Premium Background Effects */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-0 top-20 h-96 w-96 rounded-full bg-gradient-to-r from-[#F6C453]/8 via-transparent to-transparent blur-3xl" />
            <div className="absolute right-0 top-1/2 h-80 w-80 rounded-full bg-gradient-to-l from-[#D3A13A]/8 via-transparent to-transparent blur-3xl" />
          </div>
          <div className="container relative z-10 mx-auto space-y-5 sm:space-y-8 lg:space-y-12">
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

            {/* Related Movies Section - Phim cùng thể loại (SEO Internal Linking) */}
            {Array.isArray(relatedMovies) && relatedMovies.length > 0 && (
              <div className="mx-3 sm:mx-4 md:mx-12">
                <MovieSectionWithNav
                  title={
                    firstCategoryName
                      ? `Phim cùng thể loại: ${firstCategoryName}`
                      : "Phim cùng thể loại"
                  }
                  movies={relatedMovies}
                  href={firstCategorySlug ? `/the-loai/${firstCategorySlug}` : undefined}
                  variant="series"
                  disableTilt={true}
                />
              </div>
            )}

            {/* Content Section - Mô tả dài hơn cho SEO */}
            {movie.description && (
              <div className="mx-3 sm:mx-4 md:mx-12">
                <div className="bg-[#0f1116] rounded-lg p-6 sm:p-8 border border-white/5">
                  <h2 className="text-xl sm:text-2xl font-bold text-white mb-4">
                    Nội dung phim {movie.name}
                  </h2>
                  <div 
                    className="text-gray-300 leading-relaxed prose prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ 
                      __html: typeof movie.description === "string" 
                        ? movie.description 
                        : `<p>Xem phim ${movie.name}${releaseYear ? ` (${releaseYear})` : ''} online HD Vietsub, thuyết minh miễn phí trên MovPey. ${categories.length > 0 ? `Phim thuộc thể loại ${categories.map(c => c.name).join(', ')}.` : ''} ${countries.length > 0 ? `Sản xuất tại ${countries.map(c => c.name).join(', ')}.` : ''}</p>` 
                    }}
                  />
                  {movie.casts && (
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-sm text-gray-400">
                        <strong className="text-white">Diễn viên:</strong> {movie.casts}
                      </p>
                    </div>
                  )}
                  {movie.director && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-400">
                        <strong className="text-white">Đạo diễn:</strong> {movie.director}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Comments Section */}
            <div className="mx-3 sm:mx-4 md:mx-12">
              <MovieComments movieSlug={movie.slug} movieName={movie.name} />
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
        languages: {
          "vi": movieUrl,
          "vi-VN": movieUrl,
          "x-default": movieUrl,
        },
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
