"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Play } from "lucide-react";
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
    // Bỏ các pattern như "#1", "#2", " #1", " #2", etc. trước khi xử lý
    const cleanName = serverName.replace(/\s*#\d+\s*/g, "").trim();
    const name = cleanName.toLowerCase();
    
    // Kiểm tra loại server sau khi đã clean
    if (name.includes("vietsub")) return "Vietsub";
    if (name.includes("lồng") || name.includes("long")) return "Lồng tiếng";
    if (name.includes("thuyết") || name.includes("thuyet")) return "Thuyết minh";
    return cleanName;
  };

  // Tạo tham số server từ server_name
  const getServerParam = (serverName: string) => {
    const name = serverName.toLowerCase();
    if (name.includes("vietsub")) return "vietsub";
    if (name.includes("lồng") || name.includes("long")) return "long-tieng";
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

  // Nếu là phim lẻ, không hiển thị gì (đã tách ra component riêng)
  if (isPhimLe && movieName && posterUrl) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Header với tabs server - Fixed height để tránh layout shift */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 min-h-[40px] sm:min-h-[35px]">
        <div className="flex flex-col gap-0.5 justify-center">
          <h2 className="text-sm sm:text-base font-semibold text-white flex items-center gap-1">
            <span className="text-[#F6C453]">Tập phim</span>
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
                    onClick={() => {
                      setSelectedServerIndex(index);
                      if (movieName) {
                        analytics.trackWatchFilmServerChange(movieName, movieSlug, server.server_name, currentEpisodeSlug);
                      }
                    }}
                    className={`relative flex items-center justify-center gap-0.5 sm:gap-1 px-2 sm:px-2.5 py-1 rounded text-[10px] sm:text-xs font-semibold transition-all duration-200 ease-in-out whitespace-nowrap shrink-0 min-w-[70px] sm:min-w-[80px] cursor-pointer ${
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
              className="text-[9px] sm:text-[10px] text-[#F6C453]/70 uppercase tracking-wider min-h-[12px] sm:min-h-[14px] block text-right"
              style={{ minWidth: '60px' }}
            >
              {currentEpisodes.length === 1 ? "FULL" : `${currentEpisodes.length} TẬP`}
            </span>
          </div>
        )}
      </div>

      {/* Episode Grid - dùng auto-fit để tránh bể layout trên iPad */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(78px,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(88px,1fr))] md:grid-cols-[repeat(auto-fit,minmax(96px,1fr))] gap-1.5 sm:gap-2 pb-1">
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
              onClick={() => {
                if (movieName) {
                  const episodeName = currentEpisodes.length === 1 ? 'FULL' : `Tập ${index + 1}`;
                  analytics.trackWatchFilmEpisodeClick(movieName, movieSlug, episodeName, ep.slug, currentServer.server_name);
                }
              }}
              className={`flex items-center justify-center gap-1 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(0,0,0,0.65)] min-w-0 cursor-pointer ${
                isActive
                  ? "bg-[#F6C453] text-black shadow-[0_0_20px_rgba(246,196,83,0.4)]"
                  : "bg-[#0a0a0a] border border-white/10 text-white hover:bg-[#F6C453] hover:text-white hover:border-[#F6C453]"
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

