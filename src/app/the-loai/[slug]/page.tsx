import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Footer } from "@/components/footer";
import { GenreSection } from "@/components/genre-section";
import { MovieCard } from "@/components/movie-card";
import { MovieSectionSkeleton } from "@/components/movie-skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Film } from "lucide-react";
import { getFilmsByGenre, getFilmsByGenreAll, GENRES, getAvailableGenres } from "@/lib/api";

interface GenrePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

async function GenreContent({ slug, page }: { slug: string; page: number }) {
  try {
    const response = await getFilmsByGenre(slug, page, {
      limit: 20,
      sort_field: "_id",
      sort_type: "desc",
    });
    
    const movies = response.items || [];
    const totalPages = response.paginate?.total_page || 1;
    const totalItems = response.paginate?.total_items || 0;

    if (movies.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-24 sm:py-32">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-[#F6C453]/10 flex items-center justify-center mb-6">
            <Film className="w-10 h-10 sm:w-12 sm:h-12 text-[#F6C453]/50" />
          </div>
          <p className="text-gray-400 text-base sm:text-lg font-medium">
            Không có phim nào trong thể loại này
          </p>
          <Link href="/" className="mt-4">
            <Button variant="outline" className="border-[#F6C453]/30 hover:border-[#F6C453] hover:bg-[#F6C453]/10 text-white">
              Về trang chủ
            </Button>
          </Link>
        </div>
      );
    }

    return (
      <>
        {/* Movie Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          {movies.map((movie, index) => (
            <MovieCard key={`${movie.slug}-${index}`} movie={movie} index={index} variant="portrait" />
          ))}
        </div>

        {/* Premium Pagination */}
        {totalPages > 1 && (
          <div className="mt-12 sm:mt-16 flex flex-col items-center gap-6">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {page > 1 && (
                <Link href={`/the-loai/${slug}?page=${page - 1}`}>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="relative group/prev rounded-full px-5 py-2 text-sm sm:text-base border-[#F6C453]/40 hover:border-[#F6C453] hover:bg-[#F6C453]/10 backdrop-blur-md transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#F6C453]/5 to-transparent rounded-full opacity-0 group-hover/prev:opacity-100 transition-opacity" />
                    <ChevronLeft className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                    <span className="relative z-10">Trang trước</span>
                  </Button>
                </Link>
              )}

              <div className="flex items-center gap-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }
                  
                  if (pageNum > totalPages || pageNum < 1) return null;
                  const isActive = pageNum === page;
                  return (
                    <Link key={pageNum} href={`/the-loai/${slug}?page=${pageNum}`}>
                      <Button
                        variant={isActive ? "default" : "outline"}
                        size="icon"
                        className={`relative h-10 w-10 sm:h-12 sm:w-12 rounded-full text-sm sm:text-base font-semibold transition-all duration-300 ${
                          isActive 
                            ? "bg-gradient-to-r from-[#F6C453] to-[#D3A13A] text-white shadow-[0_4px_15px_rgba(246,196,83,0.4)] hover:shadow-[0_6px_20px_rgba(246,196,83,0.5)]" 
                            : "bg-transparent border-[#F6C453]/30 hover:border-[#F6C453] hover:bg-[#F6C453]/10 text-white"
                        }`}
                      >
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent rounded-full" />
                        )}
                        <span className="relative z-10">{pageNum}</span>
                      </Button>
                    </Link>
                  );
                })}
              </div>

              {page < totalPages && (
                <Link href={`/the-loai/${slug}?page=${page + 1}`}>
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="relative group/next rounded-full px-5 py-2 text-sm sm:text-base border-[#F6C453]/40 hover:border-[#F6C453] hover:bg-[#F6C453]/10 backdrop-blur-md transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#F6C453]/5 rounded-full opacity-0 group-hover/next:opacity-100 transition-opacity" />
                    <span className="relative z-10">Trang sau</span>
                    <ChevronRight className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                  </Button>
                </Link>
              )}
            </div>

            {/* Premium Page Info */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-[#F6C453]/10 via-transparent to-[#D3A13A]/10 rounded-full blur-xl" />
              <p className="relative z-10 px-6 py-2 text-sm sm:text-base text-gray-300 font-medium bg-black/40 backdrop-blur-md border border-[#F6C453]/20 rounded-full">
                Trang <span className="text-[#F6C453] font-bold">{page}</span> / <span className="text-white">{totalPages}</span>
                <span className="text-gray-500 ml-2">({totalItems} phim)</span>
              </p>
            </div>
          </div>
        )}
      </>
    );
  } catch (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
          <Film className="w-10 h-10 text-red-400/50" />
        </div>
        <p className="text-red-400 font-medium">Có lỗi xảy ra. Vui lòng thử lại sau.</p>
      </div>
    );
  }
}

export default async function GenrePage({
  params,
  searchParams,
}: GenrePageProps) {
  const { slug } = await params;
  if (slug === "hoat-hinh") {
    redirect("/danh-sach/hoat-hinh");
  }
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || "1", 10);

  const availableGenres = await getAvailableGenres();

  const genre = availableGenres.find((g) => g.slug === slug) || GENRES.find((g) => g.slug === slug);
  const genreName = genre?.name || slug;

  return (
    <main className="min-h-screen bg-[#191b24]">

      <div className="pt-16 sm:pt-20 md:pt-24">
        {/* Premium Genre Hero Header */}
        <section className="relative bg-gradient-to-b from-[#191b24] via-[#191b24] to-[#191b24] border-b border-[#F6C453]/10 overflow-hidden">
          {/* Background Effects */}
          <div className="absolute inset-0">
            <div className="absolute left-0 top-0 h-full w-1/3 bg-gradient-to-r from-[#F6C453]/5 via-transparent to-transparent" />
            <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-[#D3A13A]/5 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(246,196,83,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(246,196,83,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />
          </div>
          <div className="container relative z-10 mx-auto px-4 py-8 sm:py-10 md:py-12 flex flex-col gap-4 sm:gap-5">
            {/* Premium Badge */}
            <div className="inline-flex items-center gap-2">
              <div className="w-1.5 h-6 sm:h-8 bg-gradient-to-b from-[#F6C453] to-[#D3A13A] rounded-full" />
              <p className="text-[11px] sm:text-xs font-bold uppercase tracking-[0.3em] text-gradient-premium">
                Thể loại phim
              </p>
            </div>
            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-white via-white to-white/90 bg-clip-text text-transparent">
                {genreName}
              </span>
            </h1>
            <p className="text-sm sm:text-base text-gray-300 max-w-2xl leading-relaxed">
              Khám phá kho phim {genreName.toLowerCase()} với hàng nghìn bộ phim hấp dẫn, cập nhật liên tục trên MovPey.
            </p>
          </div>
        </section>

        {/* Premium Genre pills row */}
        <div className="relative bg-[#191b24] border-b border-[#F6C453]/5">
          <div className="absolute inset-0 bg-gradient-to-r from-[#F6C453]/3 via-transparent to-[#D3A13A]/3" />
          <div className="relative z-10">
            <GenreSection genres={availableGenres} />
          </div>
        </div>

        {/* Content grid */}
        <section className="relative py-8 sm:py-10 md:py-12">
          {/* Background Effects */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-0 top-20 h-96 w-96 rounded-full bg-gradient-to-r from-[#F6C453]/8 via-transparent to-transparent blur-3xl" />
            <div className="absolute right-0 top-1/2 h-80 w-80 rounded-full bg-gradient-to-l from-[#D3A13A]/8 via-transparent to-transparent blur-3xl" />
          </div>
          <div className="container relative z-10 mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
            <Suspense fallback={<MovieSectionSkeleton />}>
              <GenreContent slug={slug} page={page} />
            </Suspense>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}

export async function generateMetadata({ params }: GenrePageProps) {
  const { slug } = await params;
  const availableGenres = await getAvailableGenres();
  const genre = availableGenres.find((g) => g.slug === slug) || GENRES.find((g) => g.slug === slug);
  const genreName = genre?.name || slug;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://movpey.example.com");
  const genreUrl = `${siteUrl}/the-loai/${slug}`;
  
  return {
    title: `Phim ${genreName} - Xem phim ${genreName.toLowerCase()} Vietsub | MovPey`,
    description: `Xem phim ${genreName.toLowerCase()} full HD Vietsub, thuyết minh miễn phí trên MovPey. Cập nhật liên tục với hàng nghìn bộ phim hấp dẫn.`,
    keywords: [
      `phim ${genreName.toLowerCase()}`,
      genreName,
      "xem phim online",
      "phim vietsub",
      "phim thuyết minh",
      "phim hd",
      "phim miễn phí",
    ],
    alternates: {
      canonical: genreUrl,
      languages: {
        "vi": genreUrl,
        "vi-VN": genreUrl,
        "x-default": genreUrl,
      },
    },
    openGraph: {
      title: `Phim ${genreName} - Xem phim ${genreName.toLowerCase()} Vietsub | MovPey`,
      description: `Xem phim ${genreName.toLowerCase()} full HD Vietsub, thuyết minh miễn phí trên MovPey.`,
      url: genreUrl,
      siteName: "MovPey",
      locale: "vi_VN",
      type: "website",
      images: [
        {
          url: `${siteUrl}/logo.svg`,
          width: 1200,
          height: 630,
          alt: `Phim ${genreName} - MovPey`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Phim ${genreName} - Xem phim ${genreName.toLowerCase()} Vietsub | MovPey`,
      description: `Xem phim ${genreName.toLowerCase()} full HD Vietsub, thuyết minh miễn phí trên MovPey.`,
      images: [`${siteUrl}/logo.svg`],
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
}

