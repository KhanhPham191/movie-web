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
      <div className="space-y-4 md:space-y-6">
        {/* Video Player */}
        <div className="-mx-4 md:mx-0">
          <div 
            className="relative w-full bg-black"
            style={{ paddingBottom: "56.25%" }}
          >
            <iframe
              src={currentEpisode.embed}
              className="absolute top-0 left-0 w-full h-full border-0"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-presentation"
              style={{ 
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
              }}
            />
          </div>
        </div>

        {/* Movie Info & Navigation */}
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-lg md:text-2xl font-bold line-clamp-2">
              <span className="gradient-text">{movie.name}</span>
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-muted-foreground">
              <Badge variant="secondary" className="text-xs">{currentServer?.server_name}</Badge>
              <span>•</span>
              <span className="font-medium text-foreground">
                {currentEpisode.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="flex-1 md:flex-none" asChild>
              <Link href="/">
                <Home className="w-4 h-4 mr-1" />
                <span className="hidden sm:inline">Trang chủ</span>
                <span className="sm:hidden">Home</span>
              </Link>
            </Button>
            <Button variant="outline" size="sm" className="flex-1 md:flex-none" asChild>
              <Link href={`/phim/${slug}`}>
                <List className="w-4 h-4 mr-1" />
                Chi tiết
              </Link>
            </Button>
          </div>
        </div>

        {/* Episode Navigation */}
        <div className="flex items-center justify-between gap-2">
          {prevEpisode ? (
            <Button variant="outline" size="sm" className="flex-1 md:flex-none" asChild>
              <Link href={`/xem-phim/${slug}/${prevEpisode.slug}`}>
                <ChevronLeft className="w-4 h-4 mr-1 shrink-0" />
                <span className="truncate">{prevEpisode.name}</span>
              </Link>
            </Button>
          ) : (
            <div className="flex-1 md:flex-none" />
          )}

          {nextEpisode ? (
            <Button
              size="sm"
              className="flex-1 md:flex-none bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              asChild
            >
              <Link href={`/xem-phim/${slug}/${nextEpisode.slug}`}>
                <span className="truncate">{nextEpisode.name}</span>
                <ChevronRight className="w-4 h-4 ml-1 shrink-0" />
              </Link>
            </Button>
          ) : (
            <div className="flex-1 md:flex-none" />
          )}
        </div>

        <Separator />

        {/* All Episodes */}
        <div>
          <h2 className="text-base md:text-lg font-semibold mb-3">Chọn tập phim</h2>
          {movie.episodes?.map((server) => (
            <div key={server.server_name} className="mb-4">
              <h3 className="text-xs md:text-sm text-muted-foreground mb-2">
                {server.server_name}
              </h3>
              <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-1.5">
                {server.items.map((ep) => (
                  <Button
                    key={ep.slug}
                    variant={ep.slug === episodeSlug ? "default" : "outline"}
                    size="sm"
                    className={`text-xs px-2 py-1 h-8 ${
                      ep.slug === episodeSlug
                        ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
                        : "hover:bg-primary hover:text-primary-foreground"
                    }`}
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
            <h2 className="text-base md:text-lg font-semibold mb-2">Nội dung phim</h2>
            <div
              className="text-muted-foreground text-xs md:text-sm leading-relaxed line-clamp-4 md:line-clamp-none"
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

      <div className="pt-16 md:pt-24 pb-12">
        <div className="container mx-auto px-4 md:px-4 max-w-6xl">
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

