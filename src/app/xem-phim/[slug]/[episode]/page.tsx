import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Home, Info, Play } from "lucide-react";
import { getFilmDetail, getImageUrl } from "@/lib/api";
import { IframePlayer } from "@/components/player/iframe-player";
import { EpisodeSelectorWatch } from "@/components/episode-selector-watch";
import { MovieInfoPanel } from "@/components/movie-info-panel";

interface WatchPageProps {
  params: Promise<{ slug: string; episode: string }>;
  searchParams: Promise<{ server?: string }>;
}

async function VideoPlayer({
  slug,
  episodeSlug,
  serverParam,
}: {
  slug: string;
  episodeSlug: string;
  serverParam?: string;
}) {
  // Helper function để map server_name sang tên hiển thị (giống EpisodeSelector)
  const getServerDisplayName = (serverName: string) => {
    const name = serverName.toLowerCase();
    if (name.includes("vietsub")) return "Vietsub";
    if (name.includes("thuyết") || name.includes("thuyet")) return "Thuyết minh";
    return serverName;
  };

  try {
    const response = await getFilmDetail(slug);
    const movie = response.movie;

    console.log("[VideoPlayer] ===== DEBUG START =====");
    console.log("[VideoPlayer] slug:", slug);
    console.log("[VideoPlayer] episodeSlug from URL:", episodeSlug);
    console.log(
      "[VideoPlayer] servers:",
      Array.isArray(movie?.episodes)
        ? movie.episodes.map((s: any, i: number) => ({
            index: i,
            server_name: s?.server_name,
            itemsCount: Array.isArray(s?.items) ? s.items.length : 0,
          }))
        : "movie.episodes is not an array"
    );

    if (!movie) {
      notFound();
    }

    // Lọc chỉ giữ lại 2 server: Vietsub và Thuyết minh
    let filteredEpisodes = Array.isArray(movie.episodes) ? movie.episodes : [];
    filteredEpisodes = filteredEpisodes.filter((server) => {
      const serverName = server?.server_name || "";
      return (
        /vietsub/i.test(serverName) ||
        /thuyết\s*minh|thuyet\s*minh/i.test(serverName)
      );
    });

    console.log(
      "[VideoPlayer] Filtered servers (Vietsub + Thuyết minh only):",
      filteredEpisodes.map((s: any) => ({
        server_name: s?.server_name,
        itemsCount: Array.isArray(s?.items) ? s.items.length : 0,
      }))
    );

    // Kiểm tra xem có phải phim lẻ không (chỉ có 1 episode)
    const isPhimLe = filteredEpisodes.length > 0 && 
      filteredEpisodes.every((server) => {
        const items = Array.isArray(server?.items) ? server.items : [];
        return items.length === 1;
      });

    // Nếu là phim lẻ, lấy episode đầu tiên từ server mặc định
    if (isPhimLe && filteredEpisodes.length > 0) {
      const defaultServerForPhimLe = filteredEpisodes.find((s) => /vietsub/i.test(s.server_name)) ||
        filteredEpisodes.find((s) => /thuyết\s*minh|thuyet\s*minh/i.test(s.server_name)) ||
        filteredEpisodes[0];
      
      const firstEpisode = defaultServerForPhimLe?.items?.[0];
      
      // Nếu episodeSlug không khớp với tập 1, redirect đến tập 1
      if (firstEpisode && firstEpisode.slug !== episodeSlug) {
        const serverQuery = serverParam ? `?server=${serverParam}` : "";
        redirect(`/xem-phim/${slug}/${firstEpisode.slug}${serverQuery}`);
      }
    }

    let currentEpisode = null as null | { name: string; slug: string; embed: string; m3u8: string };
    let currentServer: (typeof filteredEpisodes)[number] | null = null;
    let episodeIndex = -1;
    let allEpisodes: { name: string; slug: string; embed: string; m3u8: string }[] = [];

    if (filteredEpisodes.length > 0) {
      // Tìm đúng server dựa vào serverParam từ URL (ưu tiên server_name)
      // Nếu có serverParam, chọn server đó. Nếu không, tìm episode theo slug trong tất cả server
      
      let selectedServer: (typeof filteredEpisodes)[number] | null = null;
      let selectedEpisode: { name: string; slug: string; embed: string; m3u8: string } | null = null;
      let selectedIndex = -1;
      
      // Nếu có serverParam từ URL, chọn server đó
      if (serverParam) {
        const normalizedServerParam = serverParam.toLowerCase().replace(/\s+/g, "-");
        selectedServer = filteredEpisodes.find((server) => {
          const serverName = (server?.server_name || "").toLowerCase();
          return (
            serverName.includes("vietsub") && normalizedServerParam.includes("vietsub") ||
            (serverName.includes("thuyết") || serverName.includes("thuyet")) && 
            (normalizedServerParam.includes("thuyet") || normalizedServerParam.includes("thuyết"))
          );
        }) || null;
        
        console.log(
          "[VideoPlayer] Server param from URL:",
          serverParam,
          "Found server:",
          selectedServer?.server_name
        );
      }
      
      // Nếu đã chọn server từ serverParam, tìm episode trong server đó
      if (selectedServer) {
        const items = Array.isArray(selectedServer.items) ? selectedServer.items : [];
        const idx = items.findIndex((ep) => ep.slug === episodeSlug);
        if (idx !== -1) {
          selectedEpisode = items[idx];
          selectedIndex = idx;
          currentServer = selectedServer;
          currentEpisode = selectedEpisode;
          episodeIndex = selectedIndex;
          allEpisodes = items;
          
          console.log(
            "[VideoPlayer] Found episode in selected server:",
            selectedServer.server_name,
            "at index:",
            idx,
            "episode:",
            selectedEpisode.name
          );
        }
      }
      
      // Nếu chưa tìm thấy, tìm episode theo slug trong tất cả server
      if (!selectedEpisode) {
        const serversWithEpisode: Array<{
          server: (typeof filteredEpisodes)[number];
          index: number;
          episode: { name: string; slug: string; embed: string; m3u8: string };
        }> = [];
        
        for (const server of filteredEpisodes) {
          console.log(
            "[VideoPlayer] Checking server:",
            server?.server_name,
            "- total items:",
            Array.isArray(server?.items) ? server.items.length : 0
          );
          const items = Array.isArray(server.items) ? server.items : [];
          const idx = items.findIndex((ep) => ep.slug === episodeSlug);
          if (idx !== -1) {
            console.log(
              "[VideoPlayer] FOUND episode in server:",
              server?.server_name,
              "at index:",
              idx,
              "ep slug:",
              items[idx]?.slug,
              "ep name:",
              items[idx]?.name
            );
            serversWithEpisode.push({
              server,
              index: idx,
              episode: items[idx],
            });
          }
        }
        
        // Nếu tìm thấy ở nhiều server, chọn server đầu tiên (fallback)
        if (serversWithEpisode.length > 0) {
          const selected = serversWithEpisode[0];
          currentEpisode = selected.episode;
          currentServer = selected.server;
          episodeIndex = selected.index;
          allEpisodes = Array.isArray(selected.server.items) ? selected.server.items : [];
          
          console.log(
            "[VideoPlayer] Selected server (fallback):",
            selected.server.server_name,
            "at index:",
            selected.index
          );
        }
      }
    }

    if (!currentEpisode) {
      // Fallback: chọn server mặc định (ưu tiên Vietsub, sau đó Thuyết minh)
      const defaultServer = filteredEpisodes.length > 0
        ? filteredEpisodes.find((s) => /vietsub/i.test(s.server_name)) ||
          filteredEpisodes.find((s) =>
            /thuyết\s*minh|thuyet\s*minh/i.test(s.server_name)
          ) ||
          filteredEpisodes[0]
        : undefined;

      console.log(
        "[VideoPlayer] currentEpisode NOT FOUND, using defaultServer:",
        defaultServer?.server_name,
        "items:",
        Array.isArray(defaultServer?.items) ? defaultServer.items.length : 0
      );

      if (defaultServer?.items?.[0]) {
        currentEpisode = defaultServer.items[0];
        currentServer = defaultServer;
        episodeIndex = 0;
        allEpisodes = defaultServer.items;
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
      episodeIndex < allEpisodes.length - 1
        ? allEpisodes[episodeIndex + 1]
        : null;

    // Ưu tiên thumb.url, sau đó thumb_url, cuối cùng poster_url
    const thumbUrl = (movie as any).thumb?.url || movie.thumb_url;
    const background = getImageUrl(thumbUrl || movie.poster_url);
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
        <div className="relative overflow-hidden rounded-3xl bg-[#050505] glass border border-[#fb743E]/10 shadow-[0_24px_80px_rgba(0,0,0,0.85)] animate-scale-in">
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
              {movie.quality && <Badge className="bg-[#fb743E] text-black font-semibold">{movie.quality}</Badge>}
              {movie.current_episode && <span className="text-[#fb743E]">{movie.current_episode}</span>}
              {movie.time && <span>{movie.time}</span>}
              {countries[0] && <span>{formatLabel(countries[0])}</span>}
            </div>

            <div className="space-y-4 sm:space-y-6 animate-slide-up max-w-full">
              {/* Video Player - iframe only (bỏ Shaka/m3u8, trở lại nguyên thủy) */}
              <div className="relative rounded-xl sm:rounded-2xl lg:rounded-[28px] overflow-hidden shadow-[0_20px_60px_-20px_rgba(255,220,120,0.35)] border border-[#fb743E]/30 group/player card-hover max-w-full">
                <div className="aspect-video bg-black rounded-xl sm:rounded-2xl lg:rounded-[28px] overflow-hidden w-full">
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
                      <Badge className="bg-[#fb743E] text-black text-[10px] sm:text-xs px-2 py-0.5">
                        {currentServer ? getServerDisplayName(currentServer.server_name) : ""}
                      </Badge>
                      <span className="flex items-center gap-1">
                        <Play className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-[#fb743E] text-[#fb743E]" />
                        ĐANG PHÁT
                      </span>
                    </div>
                    <span className="text-[#fb743E]">
                      {allEpisodes.length === 1 ? "FULL" : `${episodeIndex + 1}/${allEpisodes.length}`}
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
                    className="min-w-[130px] sm:min-w-[150px] bg-black/60 text-white border-[#fb743E]/30 hover:bg-[#fb743E]/10 hover:border-[#fb743E] backdrop-blur text-xs sm:text-sm"
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
                    className="ml-auto min-w-[130px] sm:min-w-[150px] bg-[#fb743E] text-black hover:bg-[#fb743E]/90 font-semibold text-xs sm:text-sm"
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
                <Button size="lg" className="bg-[#fb743E] text-black hover:bg-[#fb743E]/90 font-semibold flex-1 sm:flex-none text-sm sm:text-base" asChild>
                  <Link href={`/phim/${slug}`}>
                    <Info className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" /> Chi tiết
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="border-[#fb743E]/30 text-white hover:bg-[#fb743E]/10 flex-1 sm:flex-none text-sm sm:text-base" asChild>
                  <Link href="/">
                    <Home className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" /> Trang chủ
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>


        {/* Movie Info Panel - Gộp chung với tập phim */}
        {currentServer && allEpisodes.length > 0 && filteredEpisodes.length > 0 && (
          <MovieInfoPanel
            movie={movie}
            categories={categories}
            allEpisodes={allEpisodes}
            currentEpisodeIndex={episodeIndex}
            servers={filteredEpisodes}
            movieSlug={slug}
            currentEpisodeSlug={episodeSlug}
            currentServerName={currentServer.server_name}
          />
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

export default async function WatchPage({ params, searchParams }: WatchPageProps) {
  const { slug, episode } = await params;
  const { server } = await searchParams;

  return (
    <main className="min-h-screen bg-[#05050a]">
      <Header />

      {/* Cinematic background */}
      <div className="relative pt-20 md:pt-24 pb-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-40 h-72 w-72 rounded-full bg-[#fb743E]/15 blur-3xl animate-fade-in" />
          <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-[#ff9d6b]/10 blur-3xl animate-fade-in" />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-[#05050a]" />
        </div>

        <div className="relative z-10 container mx-auto px-3 sm:px-4 lg:px-6 max-w-[1600px] space-y-10 lg:space-y-14">
          {/* Breadcrumb / meta row */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-white/60 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 glass">
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-[#fb743E] animate-pulse" />
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
              <VideoPlayer slug={slug} episodeSlug={episode} serverParam={server} />
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

    if (!movie) {
      return {
        title: "Xem phim | Phim7.xyz",
      };
    }

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

