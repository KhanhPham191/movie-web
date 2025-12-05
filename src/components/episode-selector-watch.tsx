"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Play } from "lucide-react";
import { getImageUrl } from "@/lib/api";

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

interface EpisodeSelectorWatchProps {
  servers: Server[];
  movieSlug: string;
  currentEpisodeSlug: string;
  currentServerName: string;
  currentEpisodeIndex: number;
  movieName?: string;
  posterUrl?: string;
}

export function EpisodeSelectorWatch({
  servers,
  movieSlug,
  currentEpisodeSlug,
  currentServerName,
  currentEpisodeIndex,
  movieName,
  posterUrl,
}: EpisodeSelectorWatchProps) {
  // Lọc chỉ giữ lại 2 server: Vietsub và Thuyết minh
  const filteredServers = useMemo(() => {
    return servers.filter((server) => {
      const serverName = (server?.server_name || "").toLowerCase();
      return (
        /vietsub/i.test(serverName) ||
        /thuyết\s*minh|thuyet\s*minh/i.test(serverName)
      );
    });
  }, [servers]);

  // Tìm index của server hiện tại
  const getCurrentServerIndex = () => {
    const index = filteredServers.findIndex(
      (s) => s.server_name === currentServerName
    );
    return index !== -1 ? index : 0;
  };

  const [selectedServerIndex, setSelectedServerIndex] = useState(
    getCurrentServerIndex()
  );

  const currentServer = filteredServers[selectedServerIndex];
  const currentEpisodes = currentServer?.items || [];

  // Map server_name sang tên hiển thị (bỏ #1, #2, etc.)
  const getServerDisplayName = (serverName: string) => {
    const name = serverName.toLowerCase();
    // Bỏ các pattern như "#1", "#2", " #1", " #2", etc.
    let cleanName = serverName.replace(/\s*#\d+\s*/g, "").trim();
    
    if (name.includes("vietsub")) return "Vietsub";
    if (name.includes("thuyết") || name.includes("thuyet")) return "Thuyết minh";
    return cleanName;
  };

  // Tạo tham số server từ server_name
  const getServerParam = (serverName: string) => {
    const name = serverName.toLowerCase();
    if (name.includes("vietsub")) return "vietsub";
    if (name.includes("thuyết") || name.includes("thuyet")) return "thuyet-minh";
    return "";
  };

  if (filteredServers.length === 0 || !currentServer) {
    return null;
  }

  // Tính số tập tối đa để reserve space
  const maxEpisodes = useMemo(() => {
    return Math.max(...filteredServers.map(s => s.items?.length || 0), 0);
  }, [filteredServers]);

  // Kiểm tra xem có phải phim lẻ không (chỉ có 1 episode)
  const isPhimLe = currentEpisodes.length === 1;

  // Nếu là phim lẻ, hiển thị UI card đặc biệt
  if (isPhimLe && movieName && posterUrl) {
    const firstEpisode = currentEpisodes[0];
    const serverParam = getServerParam(currentServer.server_name);
    const href = serverParam
      ? `/xem-phim/${movieSlug}/${firstEpisode.slug}?server=${serverParam}`
      : `/xem-phim/${movieSlug}/${firstEpisode.slug}`;
    const imageUrl = getImageUrl(posterUrl);

    return (
      <Link href={href}>
        <div className="relative w-full aspect-[16/9] sm:aspect-[2.5/1] rounded-xl overflow-hidden border border-[#fb743E]/50 shadow-lg hover:shadow-[#fb743E]/30 transition-all hover:scale-[1.01] group cursor-pointer">
          {/* Background Image */}
          <div className="absolute inset-0">
            <Image
              src={imageUrl}
              alt={movieName}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 1200px"
            />
            {/* Ombre gradient overlay bên trái - mờ dần sang phải */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a2e] via-[#1a1a2e]/90 via-[#1a1a2e]/70 via-[#1a1a2e]/40 to-transparent" />
          </div>

          {/* Content bên trái */}
          <div className="relative z-10 h-full flex flex-col justify-center p-4 sm:p-6 md:p-8 max-w-[55%] sm:max-w-[45%] md:max-w-[40%]">
            {/* Label Phụ đề */}
            <div className="flex items-center gap-1.5 mb-3 sm:mb-4">
              <div className="w-2 h-2 rounded-full bg-purple-400 shadow-sm" />
              <span className="text-white/90 text-xs sm:text-sm font-medium">Phụ đề</span>
            </div>

            {/* Tên phim */}
            <h3 className="text-white font-bold text-base sm:text-lg md:text-xl lg:text-2xl mb-4 sm:mb-6 line-clamp-3 leading-tight group-hover:text-[#fb743E] transition-colors">
              {movieName}
            </h3>

            {/* Nút Đang xem */}
            <div className="inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 bg-white/95 hover:bg-white text-[#1a1a2e] font-semibold text-sm sm:text-base rounded-lg transition-all shadow-md group-hover:shadow-lg">
              <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 fill-current" />
              <span>Đang xem</span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header với tabs server - Fixed height để tránh layout shift */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 min-h-[40px] sm:min-h-[35px]">
        <div className="flex flex-col gap-0.5 justify-center">
          <h2 className="text-sm sm:text-base font-semibold text-white flex items-center gap-1">
            <span className="text-[#fb743E]">Tập phim</span>
          </h2>
        </div>

        {/* Server Selection Tabs - Fixed width container */}
        {filteredServers.length > 1 && (
          <div className="flex flex-col items-end gap-1 min-w-[100px] sm:min-w-[120px]">
            <div className="flex items-center gap-1">
              {filteredServers.map((server, index) => {
                const isActive = index === selectedServerIndex;
                const displayName = getServerDisplayName(server.server_name);

                return (
                  <button
                    key={server.server_name}
                    onClick={() => setSelectedServerIndex(index)}
                    className={`relative flex items-center justify-center gap-0.5 sm:gap-1 px-2 sm:px-2.5 py-1 rounded text-[10px] sm:text-xs font-semibold transition-all duration-200 ease-in-out whitespace-nowrap shrink-0 min-w-[70px] sm:min-w-[80px] ${
                      isActive
                        ? "bg-[#1a1a2e] text-white"
                        : "bg-[#0a0a0a] text-white/70 border border-white/10 hover:bg-[#fb743E] hover:text-white hover:border-[#fb743E]"
                    }`}
                    style={
                      isActive
                        ? {
                            border: "2px solid transparent",
                            backgroundImage:
                              "linear-gradient(#1a1a2e, #1a1a2e), linear-gradient(135deg, #fb743E, #3b82f6)",
                            backgroundOrigin: "border-box",
                            backgroundClip: "padding-box, border-box",
                          }
                        : undefined
                    }
                  >
                    <svg
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0"
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
            <span 
              className="text-[9px] sm:text-[10px] text-[#fb743E]/70 uppercase tracking-wider min-h-[12px] sm:min-h-[14px] block text-right"
              style={{ minWidth: '60px' }}
            >
              {currentEpisodes.length === 1 ? "FULL" : `${currentEpisodes.length} TẬP`}
            </span>
          </div>
        )}
      </div>

      {/* Episode Grid - Mobile 4 tập, iPad/Desktop 5 tập mỗi hàng */}
      <div className="grid grid-cols-4 md:grid-cols-5 gap-1.5 sm:gap-2 pb-1">
        {currentEpisodes.map((ep, index) => {
          // Tạo tham số server từ server_name của server được chọn
          const serverParam = getServerParam(currentServer.server_name);

          const href = serverParam
            ? `/xem-phim/${movieSlug}/${ep.slug}?server=${serverParam}`
            : `/xem-phim/${movieSlug}/${ep.slug}`;

          // Chỉ đánh dấu active khi đang ở đúng server hiện tại và slug khớp
          const isActive = currentServer.server_name === currentServerName && ep.slug === currentEpisodeSlug;

          return (
            <Link
              key={ep.slug}
              href={href}
              className={`flex items-center justify-center gap-1 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(0,0,0,0.65)] min-w-0 ${
                isActive
                  ? "bg-[#fb743E] text-black shadow-[0_0_20px_rgba(251,116,62,0.4)]"
                  : "bg-[#0a0a0a] border border-white/10 text-white hover:bg-[#fb743E] hover:text-white hover:border-[#fb743E]"
              }`}
            >
              <Play className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="whitespace-nowrap">{currentEpisodes.length === 1 ? "FULL" : `Tập ${index + 1}`}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

