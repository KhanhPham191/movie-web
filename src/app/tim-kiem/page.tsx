import { Suspense } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MovieCard } from "@/components/movie-card";
import { MovieSectionSkeleton } from "@/components/movie-skeleton";
import { searchFilmsMerged } from "@/lib/api";
import { Search } from "lucide-react";

interface SearchPageProps {
  searchParams: { q?: string };
}

async function SearchResults({ query }: { query: string }) {
  if (!query) {
    return (
      <div className="text-center py-20">
        <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Tìm kiếm phim</h2>
        <p className="text-muted-foreground">
          Nhập từ khóa để tìm kiếm phim bạn muốn xem
        </p>
      </div>
    );
  }

  try {
    const movies = await searchFilmsMerged(query);

    if (movies.length === 0) {
      return (
        <div className="text-center py-20">
          <Search className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            Không tìm thấy kết quả cho &ldquo;{query}&rdquo;
          </h2>
          <p className="text-muted-foreground">
            Hãy thử tìm kiếm với từ khóa khác
          </p>
        </div>
      );
    }

    return (
      <>
        <p className="text-muted-foreground mb-6">
          Tìm thấy {movies.length} kết quả cho &ldquo;{query}&rdquo;
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-6">
          {movies.map((movie, index) => (
            <MovieCard key={movie.id || movie.slug} movie={movie} index={index} />
          ))}
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

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q: query = "" } = searchParams;

  return (
    <main className="min-h-screen">
      <Header />

      <div className="pt-24 md:pt-28 pb-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-6">
            {query ? (
              <>
                Kết quả tìm kiếm: <span className="gradient-text">{query}</span>
              </>
            ) : (
              "Tìm kiếm phim"
            )}
          </h1>

          <Suspense fallback={<MovieSectionSkeleton />}>
            <SearchResults query={query} />
          </Suspense>
        </div>
      </div>

      <Footer />
    </main>
  );
}

