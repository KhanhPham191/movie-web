import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Play,
  Clock,
  Globe,
  Calendar,
  User,
  Film,
  ChevronRight,
} from "lucide-react";
import { getFilmDetail, getImageUrl } from "@/lib/api";

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

    return (
      <>
        {/* Hero Background */}
        <div className="absolute inset-0 h-[60vh]">
          <Image
            src={movie.poster_url}
            alt={movie.name}
            fill
            className="object-cover object-top"
            priority
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/80 to-background" />
        </div>

        {/* Content */}
        <div className="container relative mx-auto px-4 pt-32 md:pt-40">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Poster */}
            <div className="lg:col-span-1">
              <Card className="overflow-hidden sticky top-24">
                <div className="relative aspect-[2/3]">
                  <Image
                    src={movie.thumb_url}
                    alt={movie.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {movie.quality && (
                    <Badge className="absolute top-3 left-3 bg-gradient-to-r from-amber-500 to-orange-600 text-white border-0">
                      {movie.quality}
                    </Badge>
                  )}
                </div>
              </Card>
            </div>

            {/* Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Title */}
              <div>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-2">
                  <span className="gradient-text">{movie.name}</span>
                </h1>
                {movie.original_name && movie.original_name !== movie.name && (
                  <p className="text-xl text-muted-foreground">
                    {movie.original_name}
                  </p>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {movie.current_episode && (
                  <Badge className="bg-blue-500/90 text-white border-0 px-3 py-1">
                    {movie.current_episode}
                  </Badge>
                )}
                {movie.language && (
                  <Badge variant="outline" className="px-3 py-1">
                    {movie.language}
                  </Badge>
                )}
              </div>

              {/* Meta Info */}
              <div className="flex flex-wrap gap-6 text-sm">
                {movie.time && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>{movie.time}</span>
                  </div>
                )}
                {movie.country?.[0] && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="w-4 h-4 text-primary" />
                    <span>{movie.country[0].name}</span>
                  </div>
                )}
                {movie.created && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 text-primary" />
                    <span>{new Date(movie.created).getFullYear()}</span>
                  </div>
                )}
              </div>

              {/* Categories */}
              {movie.category && movie.category.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {movie.category.map((cat) => (
                    <Link key={cat.id} href={`/the-loai/${cat.slug}`}>
                      <Badge
                        variant="secondary"
                        className="px-3 py-1 hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                      >
                        {cat.name}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}

              <Separator />

              {/* Director & Cast */}
              <div className="space-y-3">
                {movie.director && (
                  <div className="flex items-start gap-2">
                    <User className="w-4 h-4 mt-1 text-primary shrink-0" />
                    <div>
                      <span className="text-muted-foreground">Đạo diễn: </span>
                      <span className="font-medium">{movie.director}</span>
                    </div>
                  </div>
                )}
                {movie.casts && (
                  <div className="flex items-start gap-2">
                    <Film className="w-4 h-4 mt-1 text-primary shrink-0" />
                    <div>
                      <span className="text-muted-foreground">Diễn viên: </span>
                      <span className="font-medium">{movie.casts}</span>
                    </div>
                  </div>
                )}
              </div>

              <Separator />

              {/* Description */}
              {movie.description && (
                <div>
                  <h2 className="text-lg font-semibold mb-3">Nội dung phim</h2>
                  <div
                    className="text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: movie.description,
                    }}
                  />
                </div>
              )}

              <Separator />

              {/* Episodes */}
              {movie.episodes && movie.episodes.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">Danh sách tập</h2>
                  {movie.episodes.map((server) => (
                    <div key={server.server_name} className="mb-6">
                      <h3 className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
                        <Play className="w-4 h-4" />
                        {server.server_name}
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {server.items.map((episode) => (
                          <Button
                            key={episode.slug}
                            variant="outline"
                            size="sm"
                            className="hover:bg-primary hover:text-primary-foreground"
                            asChild
                          >
                            <Link
                              href={`/xem-phim/${movie.slug}/${episode.slug}`}
                            >
                              {episode.name}
                            </Link>
                          </Button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Watch Button */}
              {movie.episodes?.[0]?.items?.[0] && (
                <div className="pt-4">
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/30"
                    asChild
                  >
                    <Link
                      href={`/xem-phim/${movie.slug}/${movie.episodes[0].items[0].slug}`}
                    >
                      <Play className="w-5 h-5 mr-2 fill-white" />
                      Xem phim ngay
                      <ChevronRight className="w-5 h-5 ml-1" />
                    </Link>
                  </Button>
                </div>
              )}
            </div>
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
    <div className="container mx-auto px-4 pt-32">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Skeleton className="aspect-[2/3] rounded-lg" />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-20" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function MoviePage({ params }: MoviePageProps) {
  const { slug } = await params;

  return (
    <main className="min-h-screen relative">
      <Header />

      <Suspense fallback={<MovieDetailSkeleton />}>
        <MovieDetail slug={slug} />
      </Suspense>

      <div className="pt-16">
        <Footer />
      </div>
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

