import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, Home, Info, Play } from "lucide-react";
import { getFilmDetail, getImageUrl, searchFilmsMerged, type FilmItem } from "@/lib/api";
import { isValidTime } from "@/lib/utils";
import { NetflixPlayer } from "@/components/player/netflix-player";
import { EpisodeSelectorWatch } from "@/components/episode-selector-watch";
import { MovieInfoPanel } from "@/components/movie-info-panel";
import { WatchProgressTracker } from "@/components/watch-progress-tracker";

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
    // Bỏ các pattern như "#1", "#2", " #1", " #2", etc.
    let cleanName = serverName.replace(/\s*#\d+\s*/g, "").trim();
    
    if (name.includes("vietsub")) return "Vietsub";
    if (name.includes("lồng") || name.includes("long")) return "Lồng tiếng";
    if (name.includes("thuyết") || name.includes("thuyet")) return "Thuyết minh";
    return cleanName;
  };

  try {
    const response = await getFilmDetail(slug);
    const movie = response.movie;


    if (!movie) {
      notFound();
    }

    // Tìm các phần khác của cùng series
    const getBaseName = (name: string): string => {
      // Bỏ các pattern như "phần 2", "phần 3", "phần 5", "part 5", "tap 5", "tập 5", "5", "II", "III", etc.
      let baseName = name
        // Xử lý "Phần 2", "phần 3", "Part 5", etc. (có thể ở đầu, giữa hoặc cuối)
        // Pattern: "phần" + số (1-99)
        .replace(/\s*(phần|part|tap|tập|episode|ep)\s*\d+/gi, "")
        .replace(/\s*-\s*(phần|part|tap|tập|episode|ep)\s*\d+/gi, "")
        .replace(/\s*:\s*(phần|part|tap|tập|episode|ep)\s*\d+/gi, "")
        // Xử lý số ở cuối (1-99)
        .replace(/\s*\d+\s*$/, "")
        .replace(/\s*-\s*\d+\s*$/, "")
        .replace(/\s*:\s*\d+\s*$/, "")
        // Xử lý số La Mã và số thường ở cuối
        .replace(/\s*(II|III|IV|V|VI|VII|VIII|IX|X|2|3|4|5|6|7|8|9|10)+$/, "")
        .replace(/\s*-\s*(II|III|IV|V|VI|VII|VIII|IX|X|2|3|4|5|6|7|8|9|10)+$/, "")
        .trim();
      
      // Loại bỏ các ký tự đặc biệt ở cuối
      baseName = baseName.replace(/[:\-–—]\s*$/, "").trim();
      
      return baseName;
    };

    const baseName = getBaseName(movie.name);
    let relatedParts: FilmItem[] = [];
    
    // Chỉ tìm nếu base name khác với tên gốc (có nghĩa là có phần số)
    if (baseName !== movie.name && baseName.length > 3) {
      try {
        const searchResults = await searchFilmsMerged(baseName);
        
        // Lọc các phim có cùng base name và loại bỏ phim hiện tại
        // Sử dụng fuzzy matching để tìm các phim có base name tương tự
        relatedParts = searchResults
          .filter((m) => {
            const mBaseName = getBaseName(m.name);
            // So sánh không phân biệt hoa thường và loại bỏ khoảng trắng thừa
            const normalizedBase = baseName.toLowerCase().trim();
            const normalizedMBase = mBaseName.toLowerCase().trim();
            const matches = normalizedMBase === normalizedBase && m.slug !== movie.slug;
            return matches;
          })
          .slice(0, 10); // Giới hạn 10 phần
        
        // Sắp xếp theo tên để dễ tìm
        relatedParts.sort((a, b) => a.name.localeCompare(b.name, "vi"));
      } catch (error) {
        // Error fetching related parts
      }
    }

    // Lọc giữ lại 3 server: Vietsub, Thuyết minh và Lồng tiếng
    let filteredEpisodes = Array.isArray(movie.episodes) ? movie.episodes : [];
    filteredEpisodes = filteredEpisodes.filter((server) => {
      const serverName = server?.server_name || "";
      return (
        /vietsub/i.test(serverName) ||
        /thuyết\s*minh|thuyet\s*minh/i.test(serverName) ||
        /lồng\s*tiếng|long\s*tieng/i.test(serverName)
      );
    });


    // Kiểm tra xem có phải phim lẻ không (chỉ có 1 episode)
    const isPhimLe = filteredEpisodes.length > 0 && 
      filteredEpisodes.every((server) => {
        const items = Array.isArray(server?.items) ? server.items : [];
        return items.length === 1;
      });

    // Nếu là phim lẻ, lấy episode đầu tiên từ server mặc định
    if (isPhimLe && filteredEpisodes.length > 0) {
      const defaultServerForPhimLe = filteredEpisodes.find((s) => /vietsub/i.test(s.server_name)) ||
        filteredEpisodes.find((s) => /lồng\s*tiếng|long\s*tieng/i.test(s.server_name)) ||
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
            ((serverName.includes("lồng") || serverName.includes("long")) &&
             (normalizedServerParam.includes("long") || normalizedServerParam.includes("lồng"))) ||
            ((serverName.includes("thuyết") || serverName.includes("thuyet")) && 
             (normalizedServerParam.includes("thuyet") || normalizedServerParam.includes("thuyết")))
          );
        }) || null;
        
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
          const items = Array.isArray(server.items) ? server.items : [];
          const idx = items.findIndex((ep) => ep.slug === episodeSlug);
          if (idx !== -1) {
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
          
        }
      }
    }

    if (!currentEpisode) {
      // Fallback: chọn server mặc định (ưu tiên Vietsub, sau đó Lồng tiếng, cuối cùng Thuyết minh)
      const defaultServer = filteredEpisodes.length > 0
        ? filteredEpisodes.find((s) => /vietsub/i.test(s.server_name)) ||
          filteredEpisodes.find((s) => /lồng\s*tiếng|long\s*tieng/i.test(s.server_name)) ||
          filteredEpisodes.find((s) =>
            /thuyết\s*minh|thuyet\s*minh/i.test(s.server_name)
          ) ||
          filteredEpisodes[0]
        : undefined;


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

    // Dùng thumb_url cho trang xem phim
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
      <div className="space-y-10">
        {/* Watch Progress Tracker - Lưu tiến độ xem */}
        <div className="animate-fade-in">
          <WatchProgressTracker
            movie={movie}
            episodeSlug={currentEpisode.slug}
            episodeName={currentEpisode.name}
          />
        </div>
        
        {/* Khối player + meta đơn giản, bỏ nền blur phía sau */}
        <div className="space-y-4 sm:space-y-6 max-w-full text-white">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-[10px] sm:text-xs text-white/70">
            {movie.quality && (
              <Badge className="bg-[#F6C453] text-black font-semibold">
                {movie.quality}
              </Badge>
            )}
            {movie.current_episode && (
              <span className="text-[#F6C453]">{movie.current_episode}</span>
            )}
            {isValidTime(movie.time) && <span>{movie.time}</span>}
            {countries[0] && <span>{formatLabel(countries[0])}</span>}
          </div>

          {/* Netflix-style Video Player */}
          <div className="relative mx-auto w-full md:w-full lg:w-[92%] xl:w-[88%] 2xl:w-[85%] rounded-xl sm:rounded-2xl lg:rounded-[28px] overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.65)] border border-white/10">
            <div className="relative aspect-[16/9] bg-black w-full">
              {currentEpisode.m3u8 ? (
                <NetflixPlayer
                  src={currentEpisode.m3u8}
                  poster={background}
                  className="h-full w-full"
                  title={`${movie.name} - ${currentEpisode.name}`}
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-black text-white">
                  <p className="text-sm text-white/70">Không có nguồn video m3u8</p>
                </div>
              )}
            </div>
          </div>

          {/* Episode Navigation */}
          <div
            className="mt-2 flex items-center justify-between gap-2 sm:gap-4"
          >
            {prevEpisode && (
              <Button
                asChild
                variant="outline"
                size="lg"
                className="relative group/prev min-w-[130px] sm:min-w-[150px] bg-[#191b24] text-white border-white/15 hover:bg-white/5 hover:border-[#F6C453] text-xs sm:text-sm transition-all duration-300"
              >
                <Link href={`/xem-phim/${slug}/${prevEpisode.slug}`}>
                  <ChevronLeft className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 mr-1" />
                  <span className="relative z-10 truncate">Tập trước</span>
                </Link>
              </Button>
            )}
            {nextEpisode && (
              <Button
                asChild
                size="lg"
                className="relative group/next ml-auto min-w-[130px] sm:min-w-[150px] bg-gradient-to-r from-[#F6C453] to-[#D3A13A] hover:from-[#F6C453]/90 hover:to-[#D3A13A]/90 text-white font-semibold text-xs sm:text-sm shadow-[0_8px_25px_rgba(246,196,83,0.4)] hover:shadow-[0_12px_35px_rgba(246,196,83,0.5)] transition-all duration-300"
              >
                <Link href={`/xem-phim/${slug}/${nextEpisode.slug}`}>
                  <span className="relative z-10 truncate">
                    Tập tiếp theo
                  </span>
                  <ChevronRight className="relative z-10 w-4 h-4 sm:w-5 sm:h-5 ml-1" />
                </Link>
              </Button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <Button
              size="lg"
              className="relative bg-gradient-to-r from-[#F6C453] to-[#D3A13A] hover:from-[#F6C453]/90 hover:to-[#D3A13A]/90 text-white font-semibold flex-1 sm:flex-none text-sm sm:text-base shadow-[0_8px_25px_rgba(246,196,83,0.3)] hover:shadow-[0_12px_35px_rgba(246,196,83,0.4)] transition-all duration-300"
              asChild
            >
              <Link href={`/phim/${slug}`}>
                <Info className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                <span>Chi tiết</span>
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-[#F6C453]/40 text-white hover:bg-[#F6C453]/10 hover:border-[#F6C453] flex-1 sm:flex-none text-sm sm:text-base transition-all duration-300"
              asChild
            >
              <Link href="/">
                <Home className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
                <span>Trang chủ</span>
              </Link>
            </Button>
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

        {/* Premium Related Parts Section */}
        {relatedParts.length > 0 && (
          <div className="space-y-4 sm:space-y-5 md:space-y-6 animate-slide-up">
            {/* Premium Header */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-8 sm:h-10 bg-gradient-to-b from-[#F6C453] to-[#D3A13A] rounded-full" />
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
                  <span className="text-gradient-premium">Các phần khác</span>
                </h2>
                <span className="px-3 py-1 bg-[#F6C453]/10 border border-[#F6C453]/30 rounded-full text-[10px] sm:text-xs text-[#F6C453] font-semibold">
                  {relatedParts.length} {relatedParts.length === 1 ? "phần" : "phần"}
                </span>
              </div>
            </div>
            
            {/* Grid responsive cho mobile, tablet và desktop */}
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
              {relatedParts.map((part) => (
                <Link
                  key={part.slug}
                  href={`/phim/${part.slug}`}
                  className="group relative aspect-[2/3] rounded-md sm:rounded-lg md:rounded-xl overflow-hidden bg-[#151515] border border-white/10 hover:border-[#F6C453]/60 transition-all duration-300 hover:scale-[1.02] sm:hover:scale-105 hover:shadow-[0_12px_40px_rgba(246,196,83,0.4)]"
                >
                  <Image
                    src={getImageUrl(part.thumb_url || part.poster_url)}
                    alt={part.name}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    sizes="(max-width: 475px) 50vw, (max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
                  />
                  {/* Gradient overlay - luôn hiển thị một phần trên mobile */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300" />
                  
                  {/* Title overlay - luôn hiển thị trên mobile, hover trên desktop */}
                  <div className="absolute bottom-0 left-0 right-0 p-1.5 sm:p-2 md:p-3 transform translate-y-0 sm:translate-y-full sm:group-hover:translate-y-0 transition-transform duration-300">
                    <h3 className="text-[10px] xs:text-xs sm:text-sm font-semibold text-white line-clamp-2 leading-tight">
                      {part.name}
                    </h3>
                    {part.current_episode && (
                      <p className="text-[9px] xs:text-[10px] sm:text-xs text-gray-300 mt-0.5 sm:mt-1 line-clamp-1">
                        {part.current_episode}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
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

export default async function WatchPage({ params, searchParams }: WatchPageProps) {
  const { slug, episode } = await params;
  const { server } = await searchParams;

  return (
    <main className="min-h-screen bg-[#191b24]">
      {/* Cinematic background */}
      <div className="relative pt-20 md:pt-24 pb-16 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-40 -top-40 h-72 w-72 rounded-full bg-[#F6C453]/15 blur-3xl animate-fade-in" />
          <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-[#D3A13A]/10 blur-3xl animate-fade-in" />
          <div className="absolute inset-0 bg-gradient-to-b from-black via-black/90 to-[#191b24]" />
        </div>

        <div className="relative z-10 container mx-auto px-3 sm:px-4 lg:px-6 max-w-[1600px] space-y-10 lg:space-y-14">
          {/* Breadcrumb / meta row */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-white/60 animate-fade-in">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-white/5 px-3 py-1 glass">
                <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-[#F6C453] animate-pulse" />
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
          <div className="pointer-events-none h-32 w-full bg-gradient-to-b from-transparent via-[#191b24] to-[#191b24]" />
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
        title: "Xem phim | MovPey",
        description: "Xem phim online chất lượng cao, Vietsub, thuyết minh trên MovPey.",
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

    const baseTitle = `Xem ${movie.name}${episodeName}`;
    return {
      title: `Xem ${movie.name}${episodeName} | Phim7.xyz`,
      description: `Xem phim ${movie.name}${episodeName} online full HD Vietsub, thuyết minh miễn phí trên MovPey.`,
    };
  } catch {
    return {
      title: "Xem phim | MovPey",
      description: "Xem phim online Vietsub, thuyết minh chất lượng cao trên MovPey.",
    };
  }
}

