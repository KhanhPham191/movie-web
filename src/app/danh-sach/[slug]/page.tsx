import { Suspense } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Footer } from "@/components/footer";
import { GenreSection } from "@/components/genre-section";
import { MovieCard } from "@/components/movie-card";
import { MovieSectionSkeleton } from "@/components/movie-skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getFilmsByCategory, getNewlyUpdatedFilms, getDailyUpdatedFilms } from "@/lib/api";

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
    let movies: any[] = [];
    let totalPages = 1;

    if (slug === "phim-moi-cap-nhat" || slug === "phim-cap-nhat-hang-ngay") {
      // Hai trang "phim mới cập nhật" và "cập nhật hàng ngày" hiện đều dùng chung
      // endpoint từ NguonC. Nếu sau này có API merge thêm nguồn khác, có thể
      // thay thế tại đây mà không ảnh hưởng tới UI.
      const response =
        slug === "phim-moi-cap-nhat"
          ? await getNewlyUpdatedFilms(page)
          : await getDailyUpdatedFilms(page);

      // Kiểm tra nếu API trả về lỗi
      if (response.status === "error") {
        return (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              {response.message || "Không thể tải dữ liệu. Vui lòng thử lại sau."}
            </p>
          </div>
        );
      }

      movies = response.items || [];
      totalPages = response.paginate?.total_page || 1;
    } else {
      const response = await getFilmsByCategory(slug, page);
      
      // Kiểm tra nếu API trả về lỗi
      if (response.status === "error") {
        return (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              {response.message || "Danh mục không tồn tại hoặc không thể tải dữ liệu."}
            </p>
          </div>
        );
      }

      movies = response.items || [];
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
        {/* Premium Responsive Grid - Max 5 columns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5 md:gap-6">
          {movies.map((movie, index) => (
            <div key={`${movie.slug}-${index}`} className="animate-fade-in" style={{ animationDelay: `${index * 0.05}s` }}>
              <MovieCard movie={movie} index={index} variant="portrait" />
            </div>
          ))}
        </div>

        {/* Premium Pagination */}
        <div className="mt-12 sm:mt-16 flex flex-col items-center gap-6">
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            {page > 1 && (
              <Link href={`/danh-sach/${slug}?page=${page - 1}`}>
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
                const pageNum = page <= 3 ? i + 1 : page - 2 + i;
                if (pageNum > totalPages || pageNum < 1) return null;
                const isActive = pageNum === page;
                return (
                  <Link key={pageNum} href={`/danh-sach/${slug}?page=${pageNum}`}>
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
              <Link href={`/danh-sach/${slug}?page=${page + 1}`}>
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
            </p>
          </div>
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
    <main className="min-h-screen bg-[#191b24]">

      <div className="pt-16 sm:pt-20 md:pt-24">
        {/* Premium Category Hero Header */}
        <section className="relative bg-gradient-to-b from-[#191b24] via-[#191b24] to-[#191b24] border-b border-[#F6C453]/10 overflow-hidden">
          {/* Premium Background Effects */}
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
                Danh sách phim
              </p>
            </div>
            {/* Premium Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white leading-tight tracking-tight">
              <span className="bg-gradient-to-r from-white via-white to-white/90 bg-clip-text text-transparent">
                {categoryName}
              </span>
            </h1>
            <p className="text-sm sm:text-base text-gray-300 max-w-2xl leading-relaxed">
              Khám phá những bộ phim mới được cập nhật liên tục, đề xuất theo xu hướng xem hiện tại trên Phim7.
            </p>
          </div>
        </section>

        {/* Premium Genre pills row */}
        <div className="relative bg-[#191b24] border-b border-[#F6C453]/5">
          <div className="absolute inset-0 bg-gradient-to-r from-[#F6C453]/3 via-transparent to-[#D3A13A]/3" />
          <div className="relative z-10">
            <GenreSection />
          </div>
        </div>

        {/* Premium Content grid */}
        <section className="relative py-8 sm:py-10 md:py-12">
          {/* Premium Background Effects */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute left-0 top-20 h-96 w-96 rounded-full bg-gradient-to-r from-[#F6C453]/8 via-transparent to-transparent blur-3xl" />
            <div className="absolute right-0 top-1/2 h-80 w-80 rounded-full bg-gradient-to-l from-[#D3A13A]/8 via-transparent to-transparent blur-3xl" />
          </div>
          <div className="container relative z-10 mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
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
    title: `${categoryName} - Xem phim online Vietsub | MovPey`,
    description: `Xem ${categoryName.toLowerCase()} full HD Vietsub, thuyết minh miễn phí trên MovPey.`,
  };
}

