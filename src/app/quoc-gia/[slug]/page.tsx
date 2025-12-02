import { Suspense } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { GenreSection } from "@/components/genre-section";
import { MovieCard } from "@/components/movie-card";
import { MovieSectionSkeleton } from "@/components/movie-skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getFilmsByCountry, getFilmsByCountryMultiple, COUNTRIES } from "@/lib/api";
import { filterChinaNonAnimation } from "@/lib/filters";

interface CountryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

async function CountryContent({ slug, page }: { slug: string; page: number }) {
  try {
    const ITEMS_PER_PAGE = 10;
    
    // Nếu là trang Trung Quốc: lấy nhiều pages, filter bỏ hoạt hình, sau đó phân trang lại
    if (slug === "trung-quoc") {
      // Lấy nhiều pages từ API (30 pages để có đủ phim)
      const allMovies = await getFilmsByCountryMultiple(slug, 30);
      
      // Filter bỏ hoạt hình
      const filteredMovies = await filterChinaNonAnimation(allMovies);
      
      // Phân trang lại: 10 phim/trang
      const totalPages = Math.ceil(filteredMovies.length / ITEMS_PER_PAGE);
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const movies = filteredMovies.slice(startIndex, endIndex);

      if (movies.length === 0) {
        return (
          <div className="text-center py-20">
            <p className="text-muted-foreground">
              Không có phim nào từ quốc gia này
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
                  <Link href={`/quoc-gia/${slug}?page=${page - 1}`}>
                    <Button variant="outline" size="sm">
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Trang trước
                    </Button>
                  </Link>
                )}
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = page <= 3 ? i + 1 : Math.max(1, Math.min(page - 2 + i, totalPages));
                    if (pageNum > totalPages || pageNum < 1) return null;
                    return (
                      <Link key={pageNum} href={`/quoc-gia/${slug}?page=${pageNum}`}>
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
                  <Link href={`/quoc-gia/${slug}?page=${page + 1}`}>
                    <Button variant="outline" size="sm">
                      Trang sau
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>

              <p className="text-center text-sm text-muted-foreground mt-4">
                Trang {page} / {totalPages} ({filteredMovies.length} phim)
              </p>
            </>
          )}
        </>
      );
    }

    // Các quốc gia khác: giữ nguyên logic cũ
    const response = await getFilmsByCountry(slug, page);
    let movies = response.items || [];
    const totalPages = response.paginate?.total_page || 1;

    if (movies.length === 0) {
      return (
        <div className="text-center py-20">
          <p className="text-muted-foreground">
            Không có phim nào từ quốc gia này
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
        <div className="flex items-center justify-center gap-2 mt-8">
          {page > 1 && (
            <Link href={`/quoc-gia/${slug}?page=${page - 1}`}>
              <Button variant="outline" size="sm">
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
                <Link key={pageNum} href={`/quoc-gia/${slug}?page=${pageNum}`}>
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
            <Link href={`/quoc-gia/${slug}?page=${page + 1}`}>
              <Button variant="outline" size="sm">
                Trang sau
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-4">
          Trang {page} / {totalPages}
        </p>
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

export default async function CountryPage({
  params,
  searchParams,
}: CountryPageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || "1", 10);

  const country = COUNTRIES.find((c) => c.slug === slug);
  const countryName = country?.name || slug;

  return (
    <main className="min-h-screen">
      <Header />

      <div className="pt-20 md:pt-24">
        <GenreSection />
      </div>

      <div className="py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">
            Phim <span className="gradient-text">{countryName}</span>
          </h1>

          <Suspense fallback={<MovieSectionSkeleton />}>
            <CountryContent slug={slug} page={page} />
          </Suspense>
        </div>
      </div>

      <Footer />
    </main>
  );
}

export async function generateMetadata({ params }: CountryPageProps) {
  const { slug } = await params;
  const country = COUNTRIES.find((c) => c.slug === slug);
  const countryName = country?.name || slug;
  return {
    title: `Phim ${countryName} | Phim7.xyz`,
    description: `Xem phim ${countryName} hay nhất tại Phim7.xyz`,
  };
}

