import { Suspense } from "react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { GenreSection } from "@/components/genre-section";
import { MovieCard } from "@/components/movie-card";
import { MovieSectionSkeleton } from "@/components/movie-skeleton";
import { getFilmsByGenre, GENRES } from "@/lib/api";

interface GenrePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

async function GenreContent({ slug, page }: { slug: string; page: number }) {
  try {
    const response = await getFilmsByGenre(slug, page);
    const movies = response.items || [];

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
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-6">
        {movies.map((movie, index) => (
          <MovieCard key={movie.id || movie.slug} movie={movie} index={index} />
        ))}
      </div>
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
    title: `Phim ${genreName} | CineVerse`,
    description: `Xem phim ${genreName.toLowerCase()} hay nhất tại CineVerse`,
  };
}

