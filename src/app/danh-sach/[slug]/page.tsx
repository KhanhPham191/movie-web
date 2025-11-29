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
import { getFilmsByCategory, getNewlyUpdatedFilms } from "@/lib/api";

const CATEGORY_NAMES: Record<string, string> = {
  "phim-le": "Phim lẻ",
  "phim-bo": "Phim bộ",
  "phim-dang-chieu": "Phim đang chiếu",
  "tv-shows": "TV Shows",
  "phim-moi-cap-nhat": "Phim mới cập nhật",
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
    let response;
    if (slug === "phim-moi-cap-nhat") {
      response = await getNewlyUpdatedFilms(page);
    } else {
      response = await getFilmsByCategory(slug, page);
    }

    const movies = response.items || [];
    const totalPages = response.paginate?.total_page || 1;

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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-6">
          {movies.map((movie, index) => (
            <MovieCard key={`${movie.slug}-${index}`} movie={movie} index={index} />
          ))}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-center gap-2 mt-8">
          {page > 1 && (
            <Link href={`/danh-sach/${slug}?page=${page - 1}`}>
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
                <Link key={pageNum} href={`/danh-sach/${slug}?page=${pageNum}`}>
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
            <Link href={`/danh-sach/${slug}?page=${page + 1}`}>
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
    <main className="min-h-screen">
      <Header />

      <div className="pt-20 md:pt-24">
        <GenreSection />
      </div>

      <div className="py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">
            <span className="gradient-text">{categoryName}</span>
          </h1>

          <Suspense fallback={<MovieSectionSkeleton />}>
            <CategoryContent slug={slug} page={page} />
          </Suspense>
        </div>
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

