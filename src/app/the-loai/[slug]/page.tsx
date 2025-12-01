import { Suspense } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { GenreSection } from "@/components/genre-section";
import { MovieCard } from "@/components/movie-card";
import { MovieSectionSkeleton } from "@/components/movie-skeleton";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getFilmsByGenre, GENRES } from "@/lib/api";

interface GenrePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

async function GenreContent({ slug, page }: { slug: string; page: number }) {
  try {
    const response = await getFilmsByGenre(slug, page);
    const movies = response.items || [];
    const totalPages = response.paginate?.total_page || 1;

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
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = page <= 3 ? i + 1 : page - 2 + i;
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

export default async function GenrePage({
  params,
  searchParams,
}: GenrePageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = parseInt(pageParam || "1", 10);

  const genre = GENRES.find((g) => g.slug === slug);
  const genreName = genre?.name || slug;

  return (
    <main className="min-h-screen">
      <Header />

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
  return {
    title: `Phim ${genreName} | Phim7.xyz`,
    description: `Xem phim ${genreName.toLowerCase()} hay nhất tại Phim7.xyz`,
  };
}

