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
      {/* Header với tabs server */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 sm:gap-2 min-h-[40px] sm:min-h-[35px]">
        <div className="flex items-center gap-1.5">
          <div className="w-0.5 h-4 bg-[#F6C453] rounded-full" />
          <h2 className="text-sm sm:text-base font-semibold text-white">
            Tập phim
          </h2>
          <span className="text-[9px] sm:text-[10px] text-white/30 ml-1">
            {currentEpisodes.length === 1 ? "FULL" : `${currentEpisodes.length} tập`}
          </span>
        </div>

        {/* Server Selection Tabs */}
        {filteredServers.length > 1 && (
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
                  className={`flex items-center justify-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-medium transition-all duration-150 whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "bg-[#F6C453]/15 text-[#F6C453] ring-1 ring-[#F6C453]/30"
                      : "text-white/50 hover:text-white/70 hover:bg-white/[0.04]"
                  }`}
                >
                  <span>{displayName}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Episode Grid */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(78px,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(88px,1fr))] md:grid-cols-[repeat(auto-fit,minmax(96px,1fr))] gap-1.5 sm:gap-2 pb-1">
        {currentEpisodes.map((ep, index) => {
          const serverParam = getServerParam(currentServer.server_name);

          const href = serverParam
            ? `/xem-phim/${movieSlug}/${ep.slug}?server=${serverParam}`
            : `/xem-phim/${movieSlug}/${ep.slug}`;

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
              className={`flex items-center justify-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all hover:-translate-y-0.5 min-w-0 cursor-pointer ${
                isActive
                  ? "bg-[#F6C453] text-black font-semibold shadow-[0_0_16px_rgba(246,196,83,0.3)]"
                  : "bg-white/[0.04] ring-1 ring-white/[0.06] text-white/70 hover:bg-[#F6C453]/10 hover:text-[#F6C453] hover:ring-[#F6C453]/30"
              }`}
            >
              <Play className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">{currentEpisodes.length === 1 ? "FULL" : `Tập ${index + 1}`}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

