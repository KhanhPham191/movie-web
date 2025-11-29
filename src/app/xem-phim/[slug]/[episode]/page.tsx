import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, ChevronRight, Home, List } from "lucide-react";
import { getFilmDetail } from "@/lib/api";

interface WatchPageProps {
  params: Promise<{ slug: string; episode: string }>;
}

async function VideoPlayer({
  slug,
  episodeSlug,
}: {
  slug: string;
  episodeSlug: string;
}) {
  try {
    const response = await getFilmDetail(slug);
    const movie = response.movie;

    if (!movie) {
      notFound();
    }

    // Find the current episode
    let currentEpisode = null;
    let currentServer = null;
    let episodeIndex = -1;
    let allEpisodes: { name: string; slug: string; embed: string; m3u8: string }[] = [];

    for (const server of movie.episodes || []) {
      allEpisodes = server.items;
      const idx = server.items.findIndex((ep) => ep.slug === episodeSlug);
      if (idx !== -1) {
        currentEpisode = server.items[idx];
        currentServer = server;
        episodeIndex = idx;
        break;
      }
    }

    if (!currentEpisode) {
      // Try first episode
      if (movie.episodes?.[0]?.items?.[0]) {
        currentEpisode = movie.episodes[0].items[0];
        currentServer = movie.episodes[0];
        episodeIndex = 0;
        allEpisodes = movie.episodes[0].items;
      } else {
        return (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Không tìm thấy tập phim</p>
          </div>
        );
      }
    }

    const prevEpisode = episodeIndex > 0 ? allEpisodes[episodeIndex - 1] : null;
    const nextEpisode =
      episodeIndex < allEpisodes.length - 1 ? allEpisodes[episodeIndex + 1] : null;

    return (
      <div className="space-y-6">
        {/* Video Player */}
        <Card className="overflow-hidden bg-black">
          <div className="relative aspect-video">
            <iframe
              src={currentEpisode.embed}
              className="absolute inset-0 w-full h-full"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            />
          </div>
        </Card>

        {/* Movie Info & Navigation */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold">
              <span className="gradient-text">{movie.name}</span>
            </h1>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Badge variant="secondary">{currentServer?.server_name}</Badge>
              <span>-</span>
              <span className="font-medium text-foreground">
                {currentEpisode.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/">
                <Home className="w-4 h-4 mr-1" />
                Trang chủ
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/phim/${slug}`}>
                <List className="w-4 h-4 mr-1" />
                Chi tiết
              </Link>
            </Button>
          </div>
        </div>

        {/* Episode Navigation */}
        <div className="flex items-center justify-between gap-4">
          {prevEpisode ? (
            <Button variant="outline" asChild>
              <Link href={`/xem-phim/${slug}/${prevEpisode.slug}`}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                {prevEpisode.name}
              </Link>
            </Button>
          ) : (
            <div />
          )}

          {nextEpisode ? (
            <Button
              className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white"
              asChild
            >
              <Link href={`/xem-phim/${slug}/${nextEpisode.slug}`}>
                {nextEpisode.name}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          ) : (
            <div />
          )}
        </div>

        <Separator />

        {/* All Episodes */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Chọn tập phim</h2>
          {movie.episodes?.map((server) => (
            <div key={server.server_name} className="mb-4">
              <h3 className="text-sm text-muted-foreground mb-3">
                {server.server_name}
              </h3>
              <div className="flex flex-wrap gap-2">
                {server.items.map((ep) => (
                  <Button
                    key={ep.slug}
                    variant={ep.slug === episodeSlug ? "default" : "outline"}
                    size="sm"
                    className={
                      ep.slug === episodeSlug
                        ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white"
                        : "hover:bg-primary hover:text-primary-foreground"
                    }
                    asChild
                  >
                    <Link href={`/xem-phim/${slug}/${ep.slug}`}>{ep.name}</Link>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <Separator />

        {/* Description */}
        {movie.description && (
          <div>
            <h2 className="text-lg font-semibold mb-3">Nội dung phim</h2>
            <div
              className="text-muted-foreground text-sm leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: movie.description,
              }}
            />
          </div>
        )}
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

function VideoPlayerSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="aspect-video rounded-lg" />
      <div className="flex justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-8 w-32" />
      </div>
      <div className="flex justify-between">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { slug, episode } = await params;

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="pt-20 md:pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-6xl">
          <Suspense fallback={<VideoPlayerSkeleton />}>
            <VideoPlayer slug={slug} episodeSlug={episode} />
          </Suspense>
        </div>
      </div>

      <Footer />
    </main>
  );
}

export async function generateMetadata({ params }: WatchPageProps) {
  const { slug, episode } = await params;
  try {
    const response = await getFilmDetail(slug);
    const movie = response.movie;

    let episodeName = "";
    for (const server of movie.episodes || []) {
      const ep = server.items.find((e) => e.slug === episode);
      if (ep) {
        episodeName = ` - ${ep.name}`;
        break;
      }
    }

    return {
      title: `Xem ${movie.name}${episodeName} | Phim7.xyz`,
      description: `Xem phim ${movie.name} tập ${episodeName} tại Phim7.xyz`,
    };
  } catch {
    return {
      title: "Xem phim | Phim7.xyz",
    };
  }
}

