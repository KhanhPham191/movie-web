import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Footer } from "@/components/footer";
import { Skeleton } from "@/components/ui/skeleton";
import { Home } from "lucide-react";
import { getFilmDetail, getImageUrl, searchFilmsMerged, type FilmDetail, type FilmItem } from "@/lib/api";
import { generateVideoStructuredData, generateBreadcrumbStructuredData } from "@/lib/structured-data";
import { WatchEpisodeExperience } from "@/components/watch-episode-experience";
import { resolveWatchEpisode } from "@/lib/watch-episode-resolve";
import { RelatedPartsSection } from "@/components/related-parts-section";
import { MovieSection } from "@/components/movie-section";
import { VideoProgressProvider } from "@/contexts/video-progress-context";

export const revalidate = 3600; // 1 hour ISR - balance between freshness and cache hit rate
export const dynamicParams = true;

// Lấy số "phần" của series từ slug/tên phim (phan-1, (Phần 1), Season 1, ...)
function getSeriesPartNumber(item: { slug: string; name: string; original_name: string }): number | null {
  // Ưu tiên đọc từ slug: tai-xe-an-danh-phan-3
  const slugMatch = item.slug.match(/-phan-(\d+)$/i);
  if (slugMatch) {
    const n = parseInt(slugMatch[1], 10);
    if (!Number.isNaN(n)) return n;
  }

  // Thử đọc từ tên hiển thị: Tài Xế Ẩn Danh (Phần 3)
  const nameMatch = item.name.match(/\(Phần\s*(\d+)\)/i);
  if (nameMatch) {
    const n = parseInt(nameMatch[1], 10);
    if (!Number.isNaN(n)) return n;
  }

  // Thử đọc từ original_name: Taxi Driver Season 3
  const originalMatch = item.original_name?.match(/Season\s*(\d+)/i);
  if (originalMatch) {
    const n = parseInt(originalMatch[1], 10);
    if (!Number.isNaN(n)) return n;
  }

  return null;
}

interface WatchPageProps {
  params: Promise<{ slug: string; episode: string }>;
  searchParams: Promise<{ server?: string; fs?: string }>;
}

async function VideoPlayer({
  slug,
  episodeSlug,
  serverParam,
  shouldRequestFullscreen = false,
}: {
  slug: string;
  episodeSlug: string;
  serverParam?: string;
  shouldRequestFullscreen?: boolean;
}) {
  try {
    const response = await getFilmDetail(slug);
    const movie = response.movie;


    if (!movie) {
      notFound();
    }

    const getBaseName = (name: string): string => {
      let baseName = name.replace(/\s*\(Phần\s*\d+\)\s*$/i, "").trim();
      return baseName;
    };

    const baseName = getBaseName(movie.name);
    const searchName = baseName && baseName.length >= 2 ? baseName : movie.name;

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

    const resolved = resolveWatchEpisode(filteredEpisodes, episodeSlug, { serverParam });
    const { currentEpisode, currentServer } = resolved;

    if (!currentEpisode || !currentServer) {
      return (
        <div className="text-center py-20">
          <p className="text-muted-foreground">Không tìm thấy tập phim</p>
        </div>
      );
    }

    const categories = Array.isArray(movie.category)
      ? movie.category
      : movie.category
        ? [movie.category]
        : [];

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      "https://www.movpey.xyz";
    const videoStructuredData = generateVideoStructuredData(
      movie,
      currentEpisode,
      `${siteUrl}/xem-phim/${slug}/${currentEpisode.slug}`
    );

    const breadcrumbStructuredData = generateBreadcrumbStructuredData([
      { name: "Trang chủ", url: siteUrl },
      { name: movie.name, url: `${siteUrl}/phim/${slug}` },
      { name: `${movie.name} - ${currentEpisode.name}`, url: `${siteUrl}/xem-phim/${slug}/${currentEpisode.slug}` },
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
        <WatchEpisodeExperience
          slug={slug}
          movie={movie}
          filteredEpisodes={filteredEpisodes}
          initialEpisodeSlug={currentEpisode.slug}
          initialServerName={currentServer.server_name}
          serverParam={serverParam}
          shouldRequestFullscreen={shouldRequestFullscreen}
          categories={categories}
          seriesPartsSlot={
            <Suspense fallback={null}>
              <SeriesPartsLoader movie={movie} />
            </Suspense>
          }
          relatedPartsSlot={
            <Suspense fallback={null}>
              <RelatedPartsSection
                movieSlug={movie.slug}
                movieName={movie.name}
                baseMovieName={searchName}
              />
            </Suspense>
          }
        />
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

// Async component to load series parts without blocking initial render
async function SeriesPartsLoader({
  movie,
}: {
  movie: FilmDetail;
}) {
  try {
    const baseSlug = movie.slug.replace(/-phan-\d+$/i, "");
    const baseOriginalName = movie.original_name
      ? movie.original_name.replace(/\s*\(Season\s*\d+\)\s*$/i, "")
      : "";
    const searchKeyword = baseOriginalName || movie.name;

    if (!searchKeyword) return null;

    try {
      const searchResults = await searchFilmsMerged(searchKeyword);
      const filtered = searchResults.filter((item) => {
        const itemBaseSlug = item.slug.replace(/-phan-\d+$/i, "");
        return item.slug !== movie.slug && itemBaseSlug === baseSlug;
      });

      const withPart = filtered
        .map((item) => ({ item, part: getSeriesPartNumber(item) }))
        .filter((x) => x.part !== null) as {
        item: FilmItem;
        part: number;
      }[];
      
      withPart.sort((a, b) => a.part - b.part);
      const seriesParts = withPart.map((x) => x.item);

      if (!seriesParts.length) return null;

      return (
        <div className="mx-3 sm:mx-4 md:mx-12">
          <MovieSection
            title="Các phần khác trong series"
            movies={seriesParts}
            variant="series"
          />
        </div>
      );
    } catch {
      return null;
    }
  } catch {
    return null;
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
  const { server, fs } = await searchParams;
  const shouldRequestFullscreen = fs === '1';

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
              <VideoPlayer slug={slug} episodeSlug={episode} serverParam={server} shouldRequestFullscreen={shouldRequestFullscreen} />
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
    "https://www.movpey.xyz";
  
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

