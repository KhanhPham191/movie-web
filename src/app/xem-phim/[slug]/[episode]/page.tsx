import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Footer } from "@/components/footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Home } from "lucide-react";
import { getFilmDetail, getImageUrl, searchFilmsMerged, type FilmItem } from "@/lib/api";
import { isValidTime } from "@/lib/utils";
import { generateVideoStructuredData, generateBreadcrumbStructuredData } from "@/lib/structured-data";
import { NetflixPlayer } from "@/components/player/netflix-player";
import { EpisodeSelectorWatch } from "@/components/episode-selector-watch";
import { MovieInfoPanel } from "@/components/movie-info-panel";
import { MovieVersionsSelector } from "@/components/movie-versions-selector";
import { WatchProgressTracker } from "@/components/watch-progress-tracker";
import { WatchFilmTracker } from "@/components/watch-film-tracker";
import { WatchFilmEpisodeNav } from "@/components/watch-film-episode-nav";
import { WatchFilmButtons } from "@/components/watch-film-buttons";
import { RelatedPartLink } from "@/components/related-part-link";
import { VideoProgressProvider } from "@/contexts/video-progress-context";

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

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://movpey.example.com");
    const videoStructuredData = generateVideoStructuredData(
      movie,
      currentEpisode,
      `${siteUrl}/xem-phim/${slug}/${episodeSlug}`
    );

    const breadcrumbStructuredData = generateBreadcrumbStructuredData([
      { name: "Trang chủ", url: siteUrl },
      { name: movie.name, url: `${siteUrl}/phim/${slug}` },
      { name: `${movie.name} - ${currentEpisode.name}`, url: `${siteUrl}/xem-phim/${slug}/${episodeSlug}` },
    ]);

    return (
      <VideoProgressProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoStructuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
        />
        <div className="space-y-6 sm:space-y-8">
          {/* Watch Film Tracker - Track page view */}
          <WatchFilmTracker
            movieName={movie.name}
            movieSlug={movie.slug}
            episodeName={currentEpisode.name}
            episodeSlug={currentEpisode.slug}
          />
          {/* Watch Progress Tracker - Lưu tiến độ xem */}
          <div className="animate-fade-in">
            <WatchProgressTracker
              movie={movie}
              episodeSlug={currentEpisode.slug}
              episodeName={currentEpisode.name}
            />
          </div>

          {/* Player Section - Cinema Layout */}
          <div className="space-y-0 max-w-full text-white">

          {/* Video Player - Full Width Cinema */}
          <div className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5),0_24px_80px_rgba(0,0,0,0.6)] bg-black ring-1 ring-white/10 before:absolute before:inset-0 before:rounded-xl sm:before:rounded-2xl before:ring-1 before:ring-inset before:ring-white/[0.06] before:pointer-events-none before:z-10">
            {/* Aspect ratio: 16:9 */}
            <div className="relative aspect-video bg-black w-full">
              {currentEpisode.m3u8 ? (
                <NetflixPlayer
                  src={currentEpisode.m3u8}
                  title={`${movie.name} - ${currentEpisode.name}`}
                  className="h-full w-full"
                  autoPlay={true}
                  muted={false}
                  movieName={movie.name}
                  movieSlug={movie.slug}
                  episodeSlug={currentEpisode.slug}
                />
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center bg-gradient-to-br from-black via-gray-900/95 to-black text-white p-8">
                  <div className="text-center space-y-5">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto border-[3px] border-white/10 border-t-[#F6C453] rounded-full animate-spin" />
                    <p className="text-xs sm:text-sm text-white/50 font-medium tracking-wide">Đang tải video...</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Below Player Bar - Meta + Nav + Actions in one integrated strip */}
          <div className="mt-4 sm:mt-5 space-y-3 sm:space-y-4">
            {/* Title & Meta Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                <h1 className="text-base sm:text-lg md:text-xl font-bold text-white truncate leading-tight">{movie.name}</h1>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {movie.quality && (
                    <span className="px-2 py-0.5 bg-[#F6C453]/12 text-[#F6C453] text-[10px] sm:text-xs font-semibold rounded-md border border-[#F6C453]/15">
                      {movie.quality}
                    </span>
                  )}
                  {movie.current_episode && (
                    <span className="text-[10px] sm:text-xs text-white/45 font-medium">{movie.current_episode}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] sm:text-xs text-white/40 font-medium">
                {isValidTime(movie.time) && <span>{movie.time}</span>}
                {isValidTime(movie.time) && countries[0] && <span className="text-white/15">•</span>}
                {countries[0] && <span>{formatLabel(countries[0])}</span>}
              </div>
            </div>

            {/* Episode Nav + Actions Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-4">
              {/* Episode Navigation */}
              <WatchFilmEpisodeNav
                movieName={movie.name}
                movieSlug={movie.slug}
                currentEpisodeSlug={currentEpisode.slug}
                prevEpisode={prevEpisode ? { slug: prevEpisode.slug, name: prevEpisode.name } : null}
                nextEpisode={nextEpisode ? { slug: nextEpisode.slug, name: nextEpisode.name } : null}
              />

              {/* Action Buttons */}
              <WatchFilmButtons
                movieName={movie.name}
                movieSlug={movie.slug}
                episodeSlug={currentEpisode.slug}
              />
            </div>
          </div>
        </div>

        {/* Các bản phim - Layout riêng ở dưới player */}
        {filteredEpisodes.length > 0 && currentServer && (
          <MovieVersionsSelector
            servers={filteredEpisodes}
            movieSlug={slug}
            currentEpisodeSlug={episodeSlug}
            currentServerName={currentServer.server_name}
            movieName={movie.name}
            posterUrl={movie.thumb_url || movie.poster_url}
          />
        )}

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
          <div className="space-y-3 sm:space-y-4 animate-slide-up">
            {/* Premium Header */}
            <div className="flex items-center gap-2.5">
              <div className="w-1 h-6 sm:h-7 bg-gradient-to-b from-[#F6C453] to-[#D3A13A] rounded-full" />
              <h2 className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight">
                Các phần khác
              </h2>
              <span className="px-2 py-0.5 bg-[#F6C453]/10 border border-[#F6C453]/20 rounded-full text-[10px] text-[#F6C453] font-semibold">
                {relatedParts.length}
              </span>
            </div>
            
            {/* Grid responsive cho mobile, tablet và desktop */}
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
              {relatedParts.map((part) => (
                <RelatedPartLink
                  key={part.slug}
                  part={part}
                  movieName={movie.name}
                  movieSlug={movie.slug}
                />
              ))}
            </div>
          </div>
        )}
        </div>
      </VideoProgressProvider>
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
    <div className="space-y-5">
      <div className="relative w-full rounded-xl sm:rounded-2xl overflow-hidden bg-white/[0.03] ring-1 ring-white/[0.06]">
        <Skeleton className="aspect-video w-full rounded-none" />
      </div>
      <div className="flex items-center justify-between gap-4 mt-4">
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-6 sm:h-7 w-40 sm:w-52 rounded-md" />
          <Skeleton className="h-5 w-12 rounded-md" />
        </div>
        <Skeleton className="h-5 w-24 rounded-md" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
    </div>
  );
}

export default async function WatchPage({ params, searchParams }: WatchPageProps) {
  const { slug, episode } = await params;
  const { server } = await searchParams;

  return (
    <main className="min-h-screen bg-[#0c0d14]">
      {/* Cinematic background */}
      <div className="relative pt-16 sm:pt-20 md:pt-24 pb-12 overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-60 -top-60 h-96 w-96 rounded-full bg-[#F6C453]/8 blur-[100px] animate-fade-in" />
          <div className="absolute right-[-10%] top-[15%] h-80 w-80 rounded-full bg-[#D3A13A]/6 blur-[80px] animate-fade-in" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-[#0c0d14]/95 to-[#0c0d14]" />
        </div>

        <div className="relative z-10 container mx-auto px-3 sm:px-4 lg:px-6 max-w-[1400px] space-y-4 sm:space-y-6">
          {/* Breadcrumb - minimal */}
          <div className="flex items-center gap-2 text-xs text-white/40 animate-fade-in">
            <Link
              href="/"
              className="inline-flex items-center gap-1 text-white/40 hover:text-white/70 transition-colors"
            >
              <Home className="h-3 w-3" />
              <span className="hidden sm:inline">Trang chủ</span>
            </Link>
          </div>

          {/* Main content area */}
          <Suspense fallback={<VideoPlayerSkeleton />}>
            <div className="animate-slide-up">
              <VideoPlayer slug={slug} episodeSlug={episode} serverParam={server} />
            </div>
          </Suspense>

          {/* Bottom gradient fade */}
          <div className="pointer-events-none h-20 w-full bg-gradient-to-b from-transparent to-[#0c0d14]" />
        </div>
      </div>

      <Footer />
    </main>
  );
}

export async function generateMetadata({ params }: WatchPageProps) {
  const { slug, episode } = await params;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://movpey.example.com");
  
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
    let episodeData = null;
    for (const server of movie.episodes || []) {
      const ep = server.items.find((e) => e.slug === episode);
      if (ep) {
        episodeName = ` - ${ep.name}`;
        episodeData = ep;
        break;
      }
    }

    const title = `Xem ${movie.name}${episodeName} | MovPey`;
    const description = `Xem phim ${movie.name}${episodeName} online full HD Vietsub, thuyết minh miễn phí trên MovPey. ${movie.category?.map(c => c.name).join(', ') || ''}.`;
    const watchUrl = `${siteUrl}/xem-phim/${slug}/${episode}`;
    const imageUrl = getImageUrl(movie.poster_url || movie.thumb_url, true);

    return {
      title,
      description,
      keywords: [
        movie.name,
        episodeName.replace(" - ", ""),
        ...(movie.category?.map(c => c.name) || []),
        "xem phim online",
        "phim vietsub",
        "phim thuyết minh",
        "phim hd",
      ],
      openGraph: {
        title: `${movie.name}${episodeName} | MovPey`,
        description: description,
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: `${movie.name}${episodeName}`,
          },
        ],
        type: "video.episode",
        url: watchUrl,
        siteName: "MovPey",
        locale: "vi_VN",
      },
      twitter: {
        card: "summary_large_image",
        title: `${movie.name}${episodeName} | MovPey`,
        description: description,
        images: [imageUrl],
      },
      alternates: {
        canonical: watchUrl,
        languages: {
          "vi": watchUrl,
          "vi-VN": watchUrl,
          "x-default": watchUrl,
        },
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          "max-video-preview": -1,
          "max-image-preview": "large",
          "max-snippet": -1,
        },
      },
    };
  } catch {
    return {
      title: "Xem phim | MovPey",
      description: "Xem phim online Vietsub, thuyết minh chất lượng cao trên MovPey.",
      robots: {
        index: false,
        follow: false,
      },
    };
  }
}

