import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { MovieSection } from "@/components/movie-section";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Play,
  Plus,
  ThumbsUp,
  ChevronDown,
} from "lucide-react";
import { getFilmDetail, getImageUrl, getFilmsByGenre, type FilmItem } from "@/lib/api";

interface MoviePageProps {
  params: Promise<{ slug: string }>;
}

async function MovieDetail({ slug }: { slug: string }) {
  try {
    const response = await getFilmDetail(slug);
    const movie = response.movie;

    if (!movie) {
      notFound();
    }

    const backdropUrl = getImageUrl(movie.poster_url || movie.thumb_url);

    // Get similar movies (same category or genre)
    let similarMovies: FilmItem[] = [];
    try {
      if (movie.category && movie.category.length > 0 && movie.category[0].slug) {
        const similarResponse = await getFilmsByGenre(movie.category[0].slug, 1);
        similarMovies = (similarResponse.items || [])
          .filter((m) => m.slug !== slug)
          .slice(0, 20);
      }
    } catch (error) {
      // Silently ignore error - similar movies are optional
      console.debug("Could not fetch similar movies:", error);
    }

    return (
      <>
        {/* Hero Section - Netflix 2024 Style */}
        <section className="relative h-[85vh] min-h-[500px] flex items-end">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src={backdropUrl}
              alt={movie.name}
              fill
              className="object-cover object-center"
              priority
              sizes="100vw"
              unoptimized
            />
            {/* Netflix-style Gradients */}
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,20,20,0)_0%,rgba(20,20,20,0.3)_40%,rgba(20,20,20,0.7)_70%,rgba(20,20,20,0.95)_85%,rgba(20,20,20,1)_100%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(20,20,20,0.8)_0%,rgba(20,20,20,0.4)_30%,rgba(20,20,20,0)_50%)]" />
          </div>

          {/* Content Overlay */}
          <div className="container relative mx-auto px-4 md:px-12 pb-16 md:pb-24">
            <div className="max-w-2xl">
              {/* Title */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black text-white mb-3 drop-shadow-lg">
                {movie.name}
              </h1>

              {/* Original Title */}
              {movie.original_name && movie.original_name !== movie.name && (
                <p className="text-lg md:text-xl text-gray-300 mb-4">
                  {movie.original_name}
                </p>
              )}

              {/* Meta Row */}
              <div className="flex flex-wrap items-center gap-3 mb-4 text-sm md:text-base">
                <span className="text-green-500 font-semibold">98% Phù hợp</span>
                {movie.quality && (
                  <span className="px-2 py-0.5 border border-gray-400 text-xs font-medium">
                    {movie.quality}
                  </span>
                )}
                {movie.current_episode && (
                  <span className="text-gray-300">{movie.current_episode}</span>
                )}
                {movie.time && (
                  <span className="text-gray-400">{movie.time}</span>
                )}
                {movie.country?.[0] && (
                  <span className="text-gray-400">{movie.country[0].name}</span>
                )}
                <span className="px-2 py-0.5 border border-gray-400 text-xs">18+</span>
              </div>

              {/* Genres */}
              {movie.category && movie.category.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 mb-5 text-sm text-gray-300">
                  {movie.category.slice(0, 4).map((cat, i) => (
                    <span key={cat.id}>
                      {cat.name}
                      {i < Math.min(movie.category.length, 4) - 1 && (
                        <span className="mx-2 text-gray-600">•</span>
                      )}
                    </span>
                  ))}
                </div>
              )}

              {/* Description */}
              {movie.description && (
                <p
                  className="text-sm md:text-base text-gray-200 line-clamp-3 md:line-clamp-4 mb-6 max-w-xl"
                  dangerouslySetInnerHTML={{
                    __html: movie.description.replace(/<[^>]*>/g, "").slice(0, 200) + "...",
                  }}
                />
              )}

              {/* Action Buttons - Netflix Style */}
              <div className="flex items-center gap-3">
                {movie.episodes?.[0]?.items?.[0] && (
                  <Link href={`/xem-phim/${movie.slug}/${movie.episodes[0].items[0].slug}`}>
                    <Button
                      size="lg"
                      className="bg-white hover:bg-white/90 text-black font-bold text-sm md:text-base px-6 md:px-8 h-11 md:h-12 rounded-md"
                    >
                      <Play className="w-5 h-5 md:w-6 md:h-6 mr-2 fill-black" />
                      Phát
                    </Button>
                  </Link>
                )}
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-gray-500/70 hover:bg-gray-500/90 text-white font-bold text-sm md:text-base px-6 md:px-8 h-11 md:h-12 rounded-md"
                >
                  <Plus className="w-5 h-5 md:w-6 md:h-6 mr-2" />
                  Danh sách của tôi
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-gray-500/70 hover:bg-gray-500/90 text-white font-bold text-sm md:text-base px-6 md:px-8 h-11 md:h-12 rounded-md"
                >
                  <ThumbsUp className="w-5 h-5 md:w-6 md:h-6 mr-2" />
                  Thích
                </Button>
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-gray-500/70 hover:bg-gray-500/90 text-white font-bold text-sm md:text-base px-6 md:px-8 h-11 md:h-12 rounded-md"
                >
                  <ChevronDown className="w-5 h-5 md:w-6 md:h-6" />
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <div className="relative z-10 bg-[#141414] -mt-32 pt-40">
          <div className="container mx-auto px-4 md:px-12">
            {/* Episodes Section */}
            {movie.episodes && movie.episodes.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xl md:text-2xl font-bold text-white mb-4">
                  Tập phim
                </h2>
                {movie.episodes.map((server) => (
                  <div key={server.server_name} className="mb-8">
                    <h3 className="text-sm text-gray-400 mb-3 font-medium">
                      {server.server_name}
                    </h3>
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-4">
                      {server.items.map((episode) => (
                        <Link
                          key={episode.slug}
                          href={`/xem-phim/${movie.slug}/${episode.slug}`}
                        >
                          <Button
                            variant="outline"
                            className="h-10 px-4 bg-[#2a2a2a] border-gray-700 hover:bg-[#3a3a3a] hover:border-white text-white whitespace-nowrap shrink-0"
                          >
                            {episode.name}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* About Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {/* Left Column - Info */}
              <div className="md:col-span-2 space-y-4">
                {/* Cast & Crew */}
                <div className="space-y-3">
                  {movie.director && (
                    <div>
                      <span className="text-gray-400 text-sm">Đạo diễn: </span>
                      <span className="text-white font-medium">{movie.director}</span>
                    </div>
                  )}
                  {movie.casts && (
                    <div>
                      <span className="text-gray-400 text-sm">Diễn viên: </span>
                      <span className="text-white font-medium">{movie.casts}</span>
                    </div>
                  )}
                </div>

                {/* Full Description */}
                {movie.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Về phim này</h3>
                    <div
                      className="text-gray-300 text-sm leading-relaxed"
                      dangerouslySetInnerHTML={{
                        __html: movie.description,
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Right Column - Details */}
              <div className="space-y-4">
                <div>
                  <span className="text-gray-400 text-sm block mb-1">Thể loại</span>
                  <div className="flex flex-wrap gap-2">
                    {movie.category?.map((cat) => (
                      <Link key={cat.id} href={`/the-loai/${cat.slug}`}>
                        <Badge
                          variant="outline"
                          className="bg-[#2a2a2a] border-gray-700 text-white hover:border-white cursor-pointer"
                        >
                          {cat.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                </div>

                {movie.country && movie.country.length > 0 && (
                  <div>
                    <span className="text-gray-400 text-sm block mb-1">Quốc gia</span>
                    <div className="flex flex-wrap gap-2">
                      {movie.country.map((country) => (
                        <Link key={country.id} href={`/quoc-gia/${country.slug}`}>
                          <Badge
                            variant="outline"
                            className="bg-[#2a2a2a] border-gray-700 text-white hover:border-white cursor-pointer"
                          >
                            {country.name}
                          </Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {movie.created && (
                  <div>
                    <span className="text-gray-400 text-sm block mb-1">Năm phát hành</span>
                    <span className="text-white">{new Date(movie.created).getFullYear()}</span>
                  </div>
                )}

                {movie.time && (
                  <div>
                    <span className="text-gray-400 text-sm block mb-1">Thời lượng</span>
                    <span className="text-white">{movie.time}</span>
                  </div>
                )}

                {movie.language && (
                  <div>
                    <span className="text-gray-400 text-sm block mb-1">Ngôn ngữ</span>
                    <span className="text-white">{movie.language}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Similar Movies */}
            {similarMovies.length > 0 && (
              <div className="mb-12">
                <MovieSection
                  title="Phim tương tự"
                  movies={similarMovies}
                />
              </div>
            )}
          </div>
        </div>
      </>
    );
  } catch {
    return (
      <div className="container mx-auto px-4 pt-32 text-center">
        <p className="text-destructive">Có lỗi xảy ra. Vui lòng thử lại sau.</p>
      </div>
    );
  }
}

function MovieDetailSkeleton() {
  return (
    <>
      {/* Hero Skeleton */}
      <section className="relative h-[85vh] min-h-[500px] flex items-end bg-[#141414]">
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
      <div className="bg-[#141414] -mt-32 pt-40">
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

export default async function MoviePage({ params }: MoviePageProps) {
  const { slug } = await params;

  return (
    <main className="min-h-screen bg-[#141414]">
      <Header />

      <Suspense fallback={<MovieDetailSkeleton />}>
        <MovieDetail slug={slug} />
      </Suspense>

      <Footer />
    </main>
  );
}

export async function generateMetadata({ params }: MoviePageProps) {
  const { slug } = await params;
  try {
    const response = await getFilmDetail(slug);
    const movie = response.movie;
    return {
      title: `${movie.name} | Phim7.xyz`,
      description:
        movie.description?.replace(/<[^>]*>/g, "").slice(0, 160) ||
        `Xem phim ${movie.name} tại Phim7.xyz`,
    };
  } catch {
    return {
      title: "Chi tiết phim | Phim7.xyz",
    };
  }
}
