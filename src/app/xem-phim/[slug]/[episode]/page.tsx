import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Home, List, Info, Play } from "lucide-react";
import { getFilmDetail, getImageUrl } from "@/lib/api";
import { IframePlayer } from "@/components/player/iframe-player";

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
      <div className="space-y-10 animate-fade-in">
        <div className="relative overflow-hidden rounded-3xl bg-[#050505] glass border border-[#FF6EA0]/10 shadow-[0_24px_80px_rgba(0,0,0,0.85)] animate-scale-in">
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

          <div className="relative z-10 p-4 sm:p-6 lg:p-10 space-y-6 sm:space-y-8 text-white">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-white/70">
              {movie.quality && <Badge className="bg-[#FF6EA0] text-black font-semibold">{movie.quality}</Badge>}
              {movie.current_episode && <span className="text-[#FF6EA0]">{movie.current_episode}</span>}
              {movie.time && <span>{movie.time}</span>}
              {countries[0] && <span>{formatLabel(countries[0])}</span>}
            </div>

            <div className="grid gap-6 lg:gap-10 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1fr)] items-start">
              <div className="space-y-4 sm:space-y-6 animate-slide-up">
                {/* Netflix 2024 Style Video Player */}
                <div className="relative rounded-xl sm:rounded-2xl lg:rounded-[28px] overflow-hidden shadow-[0_20px_60px_-20px_rgba(255,220,120,0.35)] border border-[#FF6EA0]/30 group/player card-hover">
                  <div
                    className="aspect-video bg-black rounded-xl sm:rounded-2xl lg:rounded-[28px] overflow-hidden w-full min-h-[200px] sm:min-h-[230px] md:min-h-[260px]"
                  >
                    <IframePlayer
                      src={currentEpisode.embed}
                      title={`${movie.name} - ${currentEpisode.name}`}
                      allowAds={false}
                      className="h-full w-full"
                    />
                  </div>
                  
                  {/* Episode Info Overlay */}
                  <div className="absolute top-0 left-0 right-0 p-3 sm:p-4 lg:p-6 pointer-events-none bg-gradient-to-b from-black/80 to-transparent">
                    <div className="flex items-center justify-between text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-white/70">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <Badge className="bg-[#FF6EA0] text-black text-[10px] sm:text-xs px-2 py-0.5">{currentServer?.server_name}</Badge>
                        <span className="flex items-center gap-1">
                          <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-[#FF6EA0] text-[#FF6EA0]" />
                          ĐANG PHÁT
                        </span>
                      </div>
                      <span className="text-[#FF6EA0]">
                        {episodeIndex + 1}/{allEpisodes.length}
                      </span>
                    </div>
                  </div>
                </div>

              {/* Episode Navigation - compact prev/next controls */}
              <div className="mt-2 flex items-center justify-between gap-2 sm:gap-4">
                  {prevEpisode && (
                    <Button
                      asChild
                      variant="outline"
                      size="lg"
                    className="min-w-[130px] sm:min-w-[150px] bg-black/60 text-white border-[#FF6EA0]/30 hover:bg-[#FF6EA0]/10 hover:border-[#FF6EA0] backdrop-blur text-xs sm:text-sm"
                    >
                      <Link href={`/xem-phim/${slug}/${prevEpisode.slug}`}>
                      <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                      <span className="truncate">Tập trước</span>
                      </Link>
                    </Button>
                  )}
                  {nextEpisode && (
                    <Button
                      asChild
                      size="lg"
                    className="ml-auto min-w-[130px] sm:min-w-[150px] bg-[#FF6EA0] text-black hover:bg-[#FF6EA0]/90 font-semibold text-xs sm:text-sm"
                    >
                      <Link href={`/xem-phim/${slug}/${nextEpisode.slug}`}>
                      <span className="truncate">Tập tiếp theo</span>
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 ml-1" />
                      </Link>
                    </Button>
                  )}
                </div>

                {/* Action Buttons - Mobile Responsive */}
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <Button size="lg" className="bg-[#FF6EA0] text-black hover:bg-[#FF6EA0]/90 font-semibold flex-1 sm:flex-none text-sm sm:text-base" asChild>
                    <Link href={`/phim/${slug}`}>
                      <Info className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" /> Chi tiết
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" className="border-[#FF6EA0]/30 text-white hover:bg-[#FF6EA0]/10 flex-1 sm:flex-none text-sm sm:text-base" asChild>
                    <Link href="/">
                      <Home className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" /> Trang chủ
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Movie Info Panel - Mobile Optimized */}
              <div className="bg-white/5 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4 border border-[#FF6EA0]/10 glass animate-slide-up">
                <div>
                  <p className="text-[10px] sm:text-sm uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[#FF6EA0]/60">Đang xem</p>
                  <h1 className="text-lg sm:text-2xl lg:text-3xl font-black mt-1 sm:mt-2 line-clamp-2">
                    {movie.name}
                  </h1>
                  <p className="text-[#FF6EA0] text-sm sm:text-base font-semibold mt-0.5 sm:mt-1">{currentEpisode.name}</p>
                </div>

                {cleanDescription && (
                  <p className="text-xs sm:text-sm text-white/70 line-clamp-3 sm:line-clamp-4">
                    {cleanDescription}
                  </p>
                )}

                <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-white/80">
                  {movie.director && (
                    <p className="line-clamp-1">
                      <span className="text-[#FF6EA0]/60">Đạo diễn: </span>
                      {movie.director}
                    </p>
                  )}
                  {movie.casts && (
                    <p className="line-clamp-2">
                      <span className="text-[#FF6EA0]/60">Diễn viên: </span>
                      {movie.casts}
                    </p>
                  )}
                  {categories.length > 0 && (
                    <p className="line-clamp-1">
                      <span className="text-[#FF6EA0]/60">Thể loại: </span>
                      {categories.map((c) => formatLabel(c)).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Episode list - Netflix 2024 Style */}
        <div className="bg-[#0f0f0f] rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 border border-[#FF6EA0]/10 glass animate-slide-up">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-white flex items-center gap-2">
              <List className="w-4 h-4 sm:w-5 sm:h-5 text-[#FF6EA0]" />
              Danh sách tập
            </h2>
          </div>

          <div className="space-y-6 sm:space-y-8">
            {movie.episodes?.map((server) => (
              <div key={server.server_name} className="space-y-2 sm:space-y-3">
                <div className="flex items-center justify-between text-[10px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[#FF6EA0]/70 mb-2">
                  <span className="font-semibold">{server.server_name}</span>
                  <span className="text-[#FF6EA0]/50">{server.items.length} TẬP</span>
                </div>
                <div className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
                  {server.items.map((ep, index) => (
                    <Link
                      key={ep.slug}
                      href={`/xem-phim/${slug}/${ep.slug}`}
                      className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-[11px] sm:text-xs font-semibold transition-all whitespace-nowrap shrink-0 hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(0,0,0,0.65)] ${
                        ep.slug === episodeSlug
                          ? "bg-[#FF6EA0] text-black shadow-[0_0_20px_rgba(255,110,160,0.4)]"
                          : "bg-white/10 text-white hover:bg-[#FF6EA0]/20 hover:text-[#FF6EA0]"
                      }`}
                    >
                      Tập {index + 1}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Description - Netflix 2024 Style */}
        {movie.description && (
          <div className="bg-white/5 rounded-xl sm:rounded-2xl lg:rounded-3xl p-4 sm:p-6 lg:p-8 text-white/80 text-xs sm:text-sm leading-relaxed border border-[#FF6EA0]/10">
            <h3 className="text-base sm:text-lg font-semibold text-[#FF6EA0] mb-2 sm:mb-3">Nội dung phim</h3>
            <div
              className="prose prose-invert prose-sm max-w-none"
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
    <main className="min-h-screen bg-[#05050a]">
      <Header />

      {/* Cinematic background */}
      <div className="relative pt-20 md:pt-24 pb-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-40 h-72 w-72 rounded-full bg-[#FF6EA0]/15 blur-3xl animate-fade-in" />
          <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-[#FFB6D5]/10 blur-3xl animate-fade-in" />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-[#05050a]" />
        </div>

        <div className="relative z-10 container mx-auto px-3 sm:px-4 lg:px-6 max-w-[1600px] space-y-10 lg:space-y-14">
          {/* Breadcrumb / meta row */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-white/60 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 glass">
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-[#FF6EA0] animate-pulse" />
                <span className="uppercase tracking-[0.16em] text-[10px] sm:text-[11px] text-white/80">
                  Đang xem
                </span>
              </span>
              <span className="hidden xs:inline text-white/40">•</span>
              <Link
                href="/"
                className="hidden xs:inline-flex items-center gap-1 text-white/60 hover:text-white transition-colors"
              >
                <Home className="h-3.5 w-3.5" />
                Trang chủ
              </Link>
            </div>
          </div>

          {/* Main content area */}
          <Suspense fallback={<VideoPlayerSkeleton />}>
            <div className="animate-slide-up">
              <VideoPlayer slug={slug} episodeSlug={episode} />
            </div>
          </Suspense>

          {/* Floating bottom gradient to merge with footer */}
          <div className="pointer-events-none h-32 w-full bg-gradient-to-b from-transparent via-[#05050a] to-[#05050a]" />
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

