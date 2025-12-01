import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Home, List, Info } from "lucide-react";
import { getFilmDetail, getImageUrl } from "@/lib/api";
import VideoPlayerClient from "@/components/player/VideoPlayerClient";

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

    const background = getImageUrl(movie.poster_url || movie.thumb_url);
    const cleanDescription = movie.description?.replace(/<[^>]*>/g, "");
    const categories = Array.isArray(movie.category)
      ? movie.category
      : movie.category
        ? [movie.category]
        : [];
    const countries = Array.isArray(movie.country)
      ? movie.country
      : movie.country
        ? [movie.country]
        : [];
    const formatLabel = (value: any) =>
      typeof value === "object" && value !== null
        ? value.name || value.slug || value.id || ""
        : String(value || "");

    return (
      <div className="space-y-10">
        <div className="relative overflow-hidden rounded-3xl bg-[#050505]">
          <div className="absolute inset-0">
            <Image
              src={background}
              alt={movie.name}
              fill
              className="object-cover opacity-50 blur-3xl scale-110"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-[#050505]/80 to-[#050505]" />
          </div>

          <div className="relative z-10 p-6 sm:p-8 lg:p-10 space-y-8 text-white">
            <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-white/70">
              {movie.quality && <Badge className="bg-white/20 text-white">{movie.quality}</Badge>}
              {movie.current_episode && <span>{movie.current_episode}</span>}
              {movie.time && <span>{movie.time}</span>}
              {countries[0] && <span>{formatLabel(countries[0])}</span>}
            </div>

            <div className="grid gap-10 lg:grid-cols-[minmax(0,1.7fr)_1fr] items-start">
              <div className="space-y-6">
                <div className="relative rounded-[28px] overflow-hidden shadow-[0_40px_80px_-40px_rgba(0,0,0,0.9)] border border-white/10 group/player">
                  <div className="aspect-video bg-black rounded-[28px] overflow-hidden">
                    {currentEpisode.embed ? (
                      <VideoPlayerClient
                        embedUrl={currentEpisode.embed}
                        poster={background}
                        title={currentEpisode.name}
                        className="h-full w-full rounded-[28px]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        Không có video để phát
                      </div>
                    )}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-transparent to-black/75 opacity-80 transition-opacity group-hover/player:opacity-50 pointer-events-none" />
                  <div className="absolute inset-0 flex flex-col justify-between p-4 sm:p-6 pointer-events-none">
                    <div className="flex items-center justify-between text-[10px] sm:text-xs uppercase tracking-[0.3em] text-white/70">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-white/20 text-white">{currentServer?.server_name}</Badge>
                        <span>ĐANG PHÁT</span>
                      </div>
                      <span>
                        {episodeIndex + 1}/{allEpisodes.length}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 text-white">
                      <div>
                        <p className="text-xs text-white/70">Tập hiện tại</p>
                        <h3 className="text-2xl sm:text-3xl font-black leading-tight">
                          {currentEpisode.name}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2 pointer-events-auto">
                        {prevEpisode && (
                          <Button
                            asChild
                            variant="outline"
                            className="bg-black/60 text-white border-white/30 hover:bg-white/10 backdrop-blur"
                          >
                            <Link href={`/xem-phim/${slug}/${prevEpisode.slug}`}>
                              <ChevronLeft className="w-4 h-4 mr-1" />
                              {prevEpisode.name}
                            </Link>
                          </Button>
                        )}
                        {nextEpisode && (
                          <Button
                            asChild
                            className="bg-white text-black hover:bg-white/90"
                          >
                            <Link href={`/xem-phim/${slug}/${nextEpisode.slug}`}>
                              Tập tiếp theo
                              <ChevronRight className="w-4 h-4 ml-1" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button size="lg" className="bg-white text-black hover:bg-white/90" asChild>
                    <Link href={`/phim/${slug}`}>
                      <Info className="w-5 h-5 mr-2" /> Chi tiết phim
                    </Link>
                  </Button>
                  <Button size="lg" variant="secondary" asChild>
                    <Link href="/">
                      <Home className="w-5 h-5 mr-2" /> Trang chủ
                    </Link>
                  </Button>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-6 space-y-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.3em] text-white/60">Tập hiện tại</p>
                  <h1 className="text-2xl sm:text-3xl font-black mt-2">
                    {movie.name}
                  </h1>
                  <p className="text-white/80 text-sm mt-1">{currentEpisode.name}</p>
                </div>

                {cleanDescription && (
                  <p className="text-sm text-white/70 line-clamp-4">
                    {cleanDescription}
                  </p>
                )}

                <div className="space-y-2 text-sm text-white/80">
                  {movie.director && (
                    <p>
                      <span className="text-white/60">Đạo diễn: </span>
                      {movie.director}
                    </p>
                  )}
                  {movie.casts && (
                    <p>
                      <span className="text-white/60">Diễn viên: </span>
                      {movie.casts}
                    </p>
                  )}
                  {categories.length > 0 && (
                    <p>
                      <span className="text-white/60">Thể loại: </span>
                      {categories.map((c) => formatLabel(c)).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Episode list */}
        <div className="bg-[#0b0b0b] rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">Danh sách tập</h2>
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-white/50">
              <List className="w-4 h-4" />
              <span>{allEpisodes.length} tập</span>
            </div>
          </div>

          {movie.episodes?.map((server) => (
            <div key={server.server_name} className="space-y-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/50">
                <span>{server.server_name}</span>
                <span>{server.items.length} tập</span>
              </div>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                {server.items.map((ep) => (
                  <Link
                    key={ep.slug}
                    href={`/xem-phim/${slug}/${ep.slug}`}
                    className={`px-4 py-2 rounded-full text-xs font-semibold transition whitespace-nowrap ${
                      ep.slug === episodeSlug
                        ? "bg-white text-black"
                        : "bg-white/10 text-white hover:bg-white/20"
                    }`}
                  >
                    {ep.name}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Description */}
        {movie.description && (
          <div className="bg-white/5 rounded-3xl p-6 sm:p-8 text-white/80 text-sm leading-relaxed">
            <h3 className="text-lg font-semibold text-white mb-3">Nội dung phim</h3>
            <div
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

