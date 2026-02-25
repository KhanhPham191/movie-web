/* eslint-disable */
  "use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import { getImageUrl } from "@/lib/api";
import { analytics } from "@/lib/analytics";

interface Episode {
  name: string;
  slug: string;
  embed: string;
  m3u8: string;
}

interface Server {
  server_name: string;
  items: Episode[];
}

interface EpisodeSelectorProps {
  servers: Server[];
  movieSlug: string;
  defaultServer?: string;
  movieName?: string;
  posterUrl?: string;
}

export function EpisodeSelector({
  servers,
  movieSlug,
  defaultServer,
  movieName,
  posterUrl,
}: EpisodeSelectorProps) {
  // Lọc giữ lại 3 server: Vietsub, Thuyết minh và Lồng tiếng
  const filteredServers = useMemo(() => {
    return servers.filter((server) => {
      const serverName = (server?.server_name || "").toLowerCase();
      return (
        /vietsub/i.test(serverName) ||
        /thuyết\s*minh|thuyet\s*minh/i.test(serverName) ||
        /lồng\s*tiếng|long\s*tieng/i.test(serverName)
      );
    });
  }, [servers]);

  // Xác định server mặc định
  const getDefaultServerIndex = () => {
    if (defaultServer) {
      const index = filteredServers.findIndex((s) => {
        const serverName = (s?.server_name || "").toLowerCase();
        const normalizedDefault = defaultServer.toLowerCase();
        return (
          (serverName.includes("vietsub") && normalizedDefault.includes("vietsub")) ||
          ((serverName.includes("thuyết") || serverName.includes("thuyet")) &&
            (normalizedDefault.includes("thuyet") || normalizedDefault.includes("thuyết"))) ||
          ((serverName.includes("lồng") || serverName.includes("long")) &&
            (normalizedDefault.includes("long") || normalizedDefault.includes("lồng")))
        );
      });
      if (index !== -1) return index;
    }
    
    // Fallback: ưu tiên Vietsub, sau đó Lồng tiếng, cuối cùng Thuyết minh
    const vietsubIndex = filteredServers.findIndex((s) =>
      /vietsub/i.test(s.server_name)
    );
    if (vietsubIndex !== -1) return vietsubIndex;
    
    const longTiengIndex = filteredServers.findIndex((s) =>
      /lồng\s*tiếng|long\s*tieng/i.test(s.server_name)
    );
    if (longTiengIndex !== -1) return longTiengIndex;
    
    const thuyetMinhIndex = filteredServers.findIndex((s) =>
      /thuyết\s*minh|thuyet\s*minh/i.test(s.server_name)
    );
    if (thuyetMinhIndex !== -1) return thuyetMinhIndex;
    
    return 0;
  };

  const [selectedServerIndex, setSelectedServerIndex] = useState(getDefaultServerIndex());

  const currentServer = filteredServers[selectedServerIndex];
  const currentEpisodes = currentServer?.items || [];

  // Kiểm tra xem có phải phim lẻ không (chỉ có 1 episode ở server hiện tại)
  const isPhimLe = currentEpisodes.length === 1;

  // Tạo tham số server từ server_name
  const getServerParam = (serverName: string) => {
    const name = serverName.toLowerCase();
    if (name.includes("vietsub")) return "vietsub";
    if (name.includes("lồng") || name.includes("long")) return "long-tieng";
    if (name.includes("thuyết") || name.includes("thuyet")) return "thuyet-minh";
    return "";
  };

  // Map server_name sang tên hiển thị (bỏ #1, #2, etc.)
  const getServerDisplayName = (serverName: string) => {
    // Bỏ các pattern như "#1", "#2", " #1", " #2", etc. trước khi xử lý
    const cleanName = serverName.replace(/\s*#\d+\s*/g, "").trim();
    const name = cleanName.toLowerCase();
    
    // Kiểm tra loại server sau khi đã clean
    if (name.includes("vietsub")) return "Vietsub";
    if (name.includes("lồng") || name.includes("long")) return "Lồng tiếng";
    if (name.includes("thuyết") || name.includes("thuyet")) return "Thuyết minh";
    return cleanName;
  };

  // Helper function để lấy label và icon cho từng loại server
  const getServerLabel = (serverName: string) => {
    const name = serverName.toLowerCase();
    if (name.includes("vietsub")) return { label: "Phụ đề", iconColor: "bg-purple-400" };
    if (name.includes("lồng") || name.includes("long")) return { label: "Lồng tiếng", iconColor: "bg-blue-400" };
    if (name.includes("thuyết") || name.includes("thuyet")) return { label: "Thuyết minh", iconColor: "bg-green-400" };
    return { label: "Phụ đề", iconColor: "bg-purple-400" };
  };

  // Helper function để lấy gradient overlay theo màu indication
  const getServerGradient = (serverName: string) => {
    const name = serverName.toLowerCase();
    if (name.includes("vietsub")) {
      // Purple gradient cho Phụ đề - trộn indicator với đen, giảm độ chói
      return "bg-gradient-to-r from-black/85 via-black/80 via-purple-900/40 via-purple-800/30 via-black/70 to-transparent";
    }
    if (name.includes("lồng") || name.includes("long")) {
      // Blue gradient cho Lồng tiếng - trộn indicator với đen, giảm độ chói
      return "bg-gradient-to-r from-black/85 via-black/80 via-blue-900/40 via-blue-800/30 via-black/70 to-transparent";
    }
    if (name.includes("thuyết") || name.includes("thuyet")) {
      // Green gradient cho Thuyết minh - trộn indicator với đen, giảm độ chói
      return "bg-gradient-to-r from-black/85 via-black/80 via-green-900/40 via-green-800/30 via-black/70 to-transparent";
    }
    // Default purple
    return "bg-gradient-to-r from-black/85 via-black/80 via-purple-900/40 via-purple-800/30 via-black/70 to-transparent";
  };

  // Kiểm tra tất cả các server có phim lẻ (chỉ có 1 episode)
  const phimLeServers = useMemo(() => {
    return filteredServers.filter((server) => server.items.length === 1);
  }, [filteredServers]);

  if (filteredServers.length === 0) {
    return null;
  }

  // UI đặc biệt cho phim lẻ (FULL) - dùng card giống trang xem phim
  // Nếu có phim lẻ và có movieName + posterUrl, hiển thị card(s)
  if (phimLeServers.length > 0 && movieName && posterUrl) {
    const imageUrl = getImageUrl(posterUrl);

    // Nếu có nhiều server phim lẻ, hiển thị grid các card
    if (phimLeServers.length > 1) {
      return (
        <div className="animate-slide-up">
          {/* Title */}
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-white mb-3 sm:mb-4 flex items-center gap-1.5">
            <span className="text-[#F6C453]">Các bản phim</span>
          </h2>
          <div className="flex flex-wrap gap-3 sm:gap-4">
          {phimLeServers.map((server) => {
            const firstEpisode = server.items[0];
            const serverParam = getServerParam(server.server_name);
            const href = serverParam
              ? `/xem-phim/${movieSlug}/${firstEpisode.slug}?server=${serverParam}`
              : `/xem-phim/${movieSlug}/${firstEpisode.slug}`;
            const { label, iconColor } = getServerLabel(server.server_name);
            const gradientClass = getServerGradient(server.server_name);

            return (
              <Link
                key={server.server_name}
                href={href}
                className="block w-[280px] sm:w-[360px] md:w-[480px] lg:w-[540px] flex-shrink-0"
                onClick={() => {
                  if (movieName) {
                    analytics.trackFilmDetailPlayNow(movieName, movieSlug, firstEpisode.slug);
                  }
                }}
              >
                <div className="relative w-full h-[157px] sm:h-[144px] md:h-[192px] lg:h-[216px] rounded-xl overflow-hidden border border-[#F6C453]/50 shadow-lg hover:shadow-[#F6C453]/30 transition-all hover:scale-[1.01] group cursor-pointer">
                  {/* Background Image */}
                  <div className="absolute inset-0">
                    <Image
                      src={imageUrl}
                      alt={movieName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 280px, (max-width: 768px) 360px, (max-width: 1024px) 480px, 540px"
                      loading="lazy"
                      quality={75}
                      unoptimized
                    />
                    {/* Gradient overlay theo màu indication */}
                    <div className={`absolute inset-0 ${gradientClass}`} />
                  </div>

                  {/* Content bên trái - kích thước cố định theo breakpoint */}
                    <div className="relative z-10 h-full flex flex-col justify-center p-3 sm:p-4 md:p-5 w-[180px] sm:w-[200px] md:w-[260px] lg:w-[280px]">
                    {/* Label */}
                    <div className="flex items-center gap-1.5 mb-2 sm:mb-3">
                      <div className={`w-2 h-2 rounded-full ${iconColor} shadow-sm`} />
                      <span className="text-white/90 text-xs sm:text-sm font-medium">{label}</span>
                    </div>

                    {/* Tên phim */}
                    <h3 className="text-white font-bold text-sm sm:text-base md:text-lg mb-2 sm:mb-4 line-clamp-3 leading-tight group-hover:text-[#F6C453] transition-colors">
                      {movieName}
                    </h3>

                    {/* Nút Play */}
                    <div className="inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 bg-white/95 hover:bg-white text-[#1a1a2e] font-semibold text-xs sm:text-sm rounded-lg transition-all shadow-md group-hover:shadow-lg w-fit">
                      <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 fill-current" />
                      <span>Play</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
          </div>
        </div>
      );
    }

    // Nếu chỉ có 1 server phim lẻ, hiển thị 1 card như cũ
    const server = phimLeServers[0];
    const firstEpisode = server.items[0];
    const serverParam = getServerParam(server.server_name);
    const href = serverParam
      ? `/xem-phim/${movieSlug}/${firstEpisode.slug}?server=${serverParam}`
      : `/xem-phim/${movieSlug}/${firstEpisode.slug}`;
    const { label, iconColor } = getServerLabel(server.server_name);
    const gradientClass = getServerGradient(server.server_name);

    return (
      <Link 
        href={href} 
        className="block w-[280px] sm:w-[360px] md:w-[480px] lg:w-[540px]"
        onClick={() => {
          if (movieName) {
            analytics.trackFilmDetailPlayNow(movieName, movieSlug, firstEpisode.slug);
          }
        }}
      >
        <div className="relative w-full h-[157px] sm:h-[144px] md:h-[192px] lg:h-[216px] rounded-xl overflow-hidden border border-[#F6C453]/50 shadow-lg hover:shadow-[#F6C453]/30 transition-all hover:scale-[1.01] group cursor-pointer">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src={imageUrl}
              alt={movieName}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 280px, (max-width: 768px) 360px, (max-width: 1024px) 480px, 540px"
              unoptimized
            />
            {/* Gradient overlay theo màu indication */}
            <div className={`absolute inset-0 ${gradientClass}`} />
          </div>

          {/* Content bên trái - kích thước cố định theo breakpoint */}
          <div className="relative z-10 h-full flex flex-col justify-center p-3 sm:p-4 md:p-5 w-[180px] sm:w-[200px] md:w-[260px] lg:w-[280px]">
            {/* Label */}
            <div className="flex items-center gap-1.5 mb-2 sm:mb-3">
              <div className={`w-2 h-2 rounded-full ${iconColor} shadow-sm`} />
              <span className="text-white/90 text-xs sm:text-sm font-medium">{label}</span>
            </div>

            {/* Tên phim */}
            <h3 className="text-white font-bold text-sm sm:text-base md:text-lg mb-2 sm:mb-4 line-clamp-3 leading-tight group-hover:text-[#F6C453] transition-colors">
              {movieName}
            </h3>

            {/* Nút Play */}
            <div className="inline-flex items-center justify-center px-3 sm:px-4 py-1.5 sm:py-2 bg-white/95 hover:bg-white text-[#1a1a2e] font-semibold text-xs sm:text-sm rounded-lg transition-all shadow-md group-hover:shadow-lg w-fit">
              <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 fill-current" />
              <span>Play</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="card-surface p-2.5 sm:p-4 animate-slide-up">
      {/* Header với tabs server */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3 mb-2 sm:mb-3">
        <div className="flex items-center gap-1.5">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-white flex items-center gap-1.5">
            <span className="text-[#F6C453]">Tập phim</span>
          </h2>
        </div>
        
        {/* Server Selection Tabs */}
        {filteredServers.length > 1 && (
          <div className="flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            {filteredServers.map((server, index) => {
              const isActive = index === selectedServerIndex;
              const displayName = getServerDisplayName(server.server_name);
              
              return (
                <button
                  key={server.server_name}
                  onClick={() => {
                    setSelectedServerIndex(index);
                    if (movieName) {
                      analytics.trackFilmDetailServerChange(movieName, movieSlug, server.server_name);
                    }
                  }}
                  className={`flex-1 sm:flex-none px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ease-in-out flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer ${
                    isActive
                      ? "bg-[#1a1a2e] text-white"
                      : "bg-[#0a0a0a] text-white/70 border border-white/10 hover:bg-[#F6C453] hover:text-white hover:border-[#F6C453]"
                  }`}
                  style={
                    isActive
                      ? {
                          border: "2px solid transparent",
                          backgroundImage:
                            "linear-gradient(#1a1a2e, #1a1a2e), linear-gradient(135deg, #F6C453, #D3A13A)",
                          backgroundOrigin: "border-box",
                          backgroundClip: "padding-box, border-box",
                        }
                      : undefined
                  }
                >
                  <svg
                    className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <span className="truncate">{displayName}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Episode Grid */}
      {currentServer && (
        <div 
          key={currentServer.server_name}
          style={{
            animation: "fadeInUp 0.3s ease-out",
          }}
        >
          <style jsx global>{`
            @keyframes fadeInUp {
              from {
                opacity: 0;
                transform: translateY(20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-[#F6C453]/70 mb-1.5 sm:mb-2">
            <span className="font-semibold uppercase tracking-wider truncate mr-2">
              {getServerDisplayName(currentServer.server_name)}
            </span>
            <span className="text-[#F6C453]/50 whitespace-nowrap">{currentEpisodes.length === 1 ? "FULL" : `${currentEpisodes.length} TẬP`}</span>
          </div>
          
          <div className="flex flex-wrap justify-start gap-1.5 sm:gap-2">
            {currentEpisodes.map((episode, index) => {
              const serverParam = getServerParam(currentServer.server_name);
              const href = serverParam
                ? `/xem-phim/${movieSlug}/${episode.slug}?server=${serverParam}`
                : `/xem-phim/${movieSlug}/${episode.slug}`;
              
              return (
                <Link 
                  key={`${currentServer.server_name}-${episode.slug}`} 
                  href={href}
                  onClick={() => {
                    if (movieName) {
                      const episodeName = currentEpisodes.length === 1 ? 'FULL' : `Tập ${index + 1}`;
                      analytics.trackFilmDetailEpisodeClick(movieName, movieSlug, episodeName, episode.slug, currentServer.server_name);
                    }
                  }}
                  className="flex w-[96px] sm:w-[104px] md:w-[112px] items-center justify-center gap-1 px-2 sm:px-2.5 md:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(0,0,0,0.65)] bg-[#0a0a0a] border border-white/10 text-white hover:bg-[#F6C453] hover:text-white hover:border-[#F6C453] cursor-pointer"
                  style={{
                    animation: "fadeInUp 0.2s ease-out",
                    animationDelay: `${Math.min(index * 15, 300)}ms`,
                    animationFillMode: "both",
                  }}
                >
                  <Play className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                  <span className="whitespace-nowrap">{currentEpisodes.length === 1 ? "FULL" : `Tập ${index + 1}`}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

