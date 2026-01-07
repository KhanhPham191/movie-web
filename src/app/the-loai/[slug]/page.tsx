import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Footer } from "@/components/footer";
import { GenreSection } from "@/components/genre-section";
import { MovieCard } from "@/components/movie-card";
import { MovieSectionSkeleton } from "@/components/movie-skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getFilmsByGenre, getFilmsByGenreAll, GENRES } from "@/lib/api";

interface GenrePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

async function GenreContent({ slug, page }: { slug: string; page: number }) {
  try {
    // Tối ưu: Chỉ load trang hiện tại thay vì load tất cả các trang
    // Sử dụng pagination từ API thay vì phân trang lại
    const response = await getFilmsByGenre(slug, page, {
      limit: 20, // Tăng số phim mỗi trang để giảm số lần request
      sort_field: "_id",
      sort_type: "desc",
    });
    
    const movies = response.items || [];
    const totalPages = response.paginate?.total_page || 1;
    const totalItems = response.paginate?.total_items || 0;

    if (movies.length === 0) {
      return (
        <div className="text-center py-20">
          <p className="text-muted-foreground">
            Không có phim nào trong thể loại này
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          {movies.map((movie, index) => (
            <MovieCard key={`${movie.slug}-${index}`} movie={movie} index={index} variant="portrait" />
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <>
            <div className="flex items-center justify-center gap-2 mt-8">
              {page > 1 && (
                <Link href={`/the-loai/${slug}?page=${page - 1}`}>
                  <Button variant="outline" size="sm">
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Trang trước
                  </Button>
                </Link>
              )}
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let pageNum: number;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (page <= 4) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }
                  
                  if (pageNum > totalPages || pageNum < 1) return null;
                  return (
                    <Link key={pageNum} href={`/the-loai/${slug}?page=${pageNum}`}>
                      <Button
                        variant={pageNum === page ? "default" : "outline"}
                        size="sm"
                        className={pageNum === page ? "bg-primary" : ""}
                      >
                        {pageNum}
                      </Button>
                    </Link>
                  );
                })}
              </div>

              {page < totalPages && (
                <Link href={`/the-loai/${slug}?page=${page + 1}`}>
                  <Button variant="outline" size="sm">
                    Trang sau
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              )}
            </div>

            <p className="text-center text-sm text-muted-foreground mt-4">
              Trang {page} / {totalPages} ({totalItems} phim)
            </p>
          </>
        )}
      </>
    );
  } catch (error) {
    // console.error("[GenrePage] Error:", error);
    return (
      <div className="text-center py-20">
        <p className="text-destructive">Có lỗi xảy ra. Vui lòng thử lại sau.</p>
      </div>
    );
  }
}

export default async function GenrePage({
  params,
  searchParams,
}: GenrePageProps) {
  const { slug } = await params;
  // Chuyển hướng slug hoat-hinh sang danh sách để dùng nguồn dữ liệu có sẵn
  if (slug === "hoat-hinh") {
    redirect("/danh-sach/hoat-hinh");
  }
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || "1", 10);

  const genre = GENRES.find((g) => g.slug === slug);
  const genreName = genre?.name || slug;

  return (
    <main className="min-h-screen">

      <div className="pt-20 md:pt-24">
        <GenreSection />
      </div>

      <div className="py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">
            Thể loại: <span className="gradient-text">{genreName}</span>
          </h1>

          <Suspense fallback={<MovieSectionSkeleton />}>
            <GenreContent slug={slug} page={page} />
          </Suspense>
        </div>
      </div>

      <Footer />
    </main>
  );
}

export async function generateMetadata({ params }: GenrePageProps) {
  const { slug } = await params;
  const genre = GENRES.find((g) => g.slug === slug);
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

