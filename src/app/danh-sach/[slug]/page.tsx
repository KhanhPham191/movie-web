import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { GenreSection } from "@/components/genre-section";
import { MovieCard } from "@/components/movie-card";
import { MovieSectionSkeleton } from "@/components/movie-skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  getFilmsByCategory,
  getNewlyUpdatedFilms,
  getDailyUpdatedFilms,
  getDailyUpdatedFilmsCombined,
} from "@/lib/api";

// ISR: Revalidate every 30 seconds for real-time updates
export const revalidate = 30;

const CATEGORY_NAMES: Record<string, string> = {
  "phim-le": "Phim lẻ",
  "phim-bo": "Phim bộ",
  "phim-dang-chieu": "Phim đang chiếu",
  "tv-shows": "TV Shows",
  "phim-moi-cap-nhat": "Phim mới cập nhật",
  "phim-cap-nhat-hang-ngay": "Cập nhật hàng ngày",
};

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

async function CategoryContent({
  slug,
  page,
}: {
  slug: string;
  page: number;
}) {
  try {
    let movies;
    let totalPages;

    let response;
    if (slug === "phim-moi-cap-nhat") {
      response = await getNewlyUpdatedFilms(page);
    } else if (slug === "phim-cap-nhat-hang-ngay") {
      // Trang "Cập nhật hàng ngày": dùng dữ liệu đã merge từ NguonC + iPhim,
      // đồng thời giữ thông tin phân trang từ NguonC.
      const [dailyCombined, dailyNguonc] = await Promise.all([
        getDailyUpdatedFilmsCombined(page),
        getDailyUpdatedFilms(page),
      ]);

      movies = dailyCombined || [];
      totalPages = dailyNguonc.paginate?.total_page || 1;
    } else {
      response = await getFilmsByCategory(slug, page);
    }

    if (!movies) {
      movies = response.items || [];
    }
    if (!totalPages) {
      totalPages = response.paginate?.total_page || 1;
    }

    if (movies.length === 0) {
      return (
        <div className="text-center py-20">
          <p className="text-muted-foreground">
            Không có phim nào trong danh mục này
          </p>
        </div>
      );
    }

    return (
      <>
        {/* Netflix-style responsive grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
          {movies.map((movie, index) => (
            <MovieCard key={`${movie.slug}-${index}`} movie={movie} index={index} variant="portrait" />
          ))}
        </div>

        {/* Pagination - centered, mobile friendly */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex items-center justify-center gap-2">
            {page > 1 && (
              <Link href={`/danh-sach/${slug}?page=${page - 1}`}>
                <Button variant="outline" size="sm" className="rounded-full px-4 py-1 text-xs sm:text-sm">
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Trang trước
                </Button>
              </Link>
            )}

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = page <= 3 ? i + 1 : page - 2 + i;
                if (pageNum > totalPages || pageNum < 1) return null;
                return (
                  <Link key={pageNum} href={`/danh-sach/${slug}?page=${pageNum}`}>
                    <Button
                      variant={pageNum === page ? "default" : "outline"}
                      size="icon"
                      className={`h-8 w-8 rounded-full text-xs sm:text-sm ${
                        pageNum === page ? "bg-primary text-black" : "bg-transparent"
                      }`}
                    >
                      {pageNum}
                    </Button>
                  </Link>
                );
              })}
            </div>

            {page < totalPages && (
              <Link href={`/danh-sach/${slug}?page=${page + 1}`}>
                <Button variant="outline" size="sm" className="rounded-full px-4 py-1 text-xs sm:text-sm">
                  Trang sau
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            )}
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground">
            Trang {page} / {totalPages}
          </p>
        </div>
      </>
    );
  } catch {
    return (
      <div className="text-center py-20">
        <p className="text-destructive">Có lỗi xảy ra. Vui lòng thử lại sau.</p>
      </div>
    );
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: CategoryPageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || "1", 10);

  const categoryName = CATEGORY_NAMES[slug];
  if (!categoryName) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-[#0f0f0f]">
      <Header />

      <div className="pt-16 sm:pt-20 md:pt-24">
        {/* Netflix-style category hero header */}
        <section className="bg-gradient-to-b from-black/70 via-[#141414] to-[#141414] border-b border-white/10">
          <div className="container mx-auto px-4 py-5 sm:py-7 md:py-8 flex flex-col gap-3 sm:gap-4">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.25em] text-[#fb743E]">
              Danh sách phim
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white">
              {categoryName}
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 max-w-2xl">
              Khám phá những bộ phim mới được cập nhật liên tục, đề xuất theo xu hướng xem hiện tại trên Phim7.
            </p>
          </div>
        </section>

        {/* Genre pills row */}
        <div className="bg-[#0f0f0f]">
          <GenreSection />
        </div>

        {/* Content grid */}
        <section className="py-6 sm:py-8">
          <div className="container mx-auto px-2 sm:px-4">
            <Suspense fallback={<MovieSectionSkeleton />}>
              <CategoryContent slug={slug} page={page} />
            </Suspense>
          </div>
        </section>
      </div>

      <Footer />
    </main>
  );
}

export async function generateMetadata({ params }: CategoryPageProps) {
  const { slug } = await params;
  const categoryName = CATEGORY_NAMES[slug] || "Danh sách phim";
  return {
    title: `${categoryName} | Phim7.xyz`,
    description: `Xem ${categoryName.toLowerCase()} hay nhất tại Phim7.xyz`,
  };
}

