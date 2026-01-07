"use client";

import { useMemo } from "react";
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

interface MovieVersionsSelectorProps {
  servers: Server[];
  movieSlug: string;
  currentEpisodeSlug: string;
  currentServerName: string;
  movieName?: string;
  posterUrl?: string;
}

export function MovieVersionsSelector({
  servers,
  movieSlug,
  currentEpisodeSlug,
  currentServerName,
  movieName,
  posterUrl,
}: MovieVersionsSelectorProps) {
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

  // Kiểm tra tất cả các server có phim lẻ (chỉ có 1 episode)
  const phimLeServers = useMemo(() => {
    return filteredServers.filter((server) => server.items.length === 1);
  }, [filteredServers]);

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

  // Tạo tham số server từ server_name
  const getServerParam = (serverName: string) => {
    const name = serverName.toLowerCase();
    if (name.includes("vietsub")) return "vietsub";
    if (name.includes("lồng") || name.includes("long")) return "long-tieng";
    if (name.includes("thuyết") || name.includes("thuyet")) return "thuyet-minh";
    return "";
  };

  // Chỉ hiển thị khi có nhiều server phim lẻ
  if (phimLeServers.length <= 1 || !movieName || !posterUrl) {
    return null;
  }

  const imageUrl = getImageUrl(posterUrl);

  return (
    <div className="animate-slide-up mb-6 sm:mb-8">
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
          const isActive = server.server_name === currentServerName && firstEpisode.slug === currentEpisodeSlug;

          return (
            <Link
              key={server.server_name}
              href={href}
              className="block flex-1 min-w-[280px] sm:min-w-[320px] max-w-full"
              onClick={() => {
                if (movieName) {
                  analytics.trackWatchFilmEpisodeClick(movieName, movieSlug, firstEpisode.name, firstEpisode.slug, server.server_name);
                }
              }}
            >
              <div className={`relative w-full aspect-[16/9] sm:aspect-[2.5/1] rounded-xl overflow-hidden border shadow-lg hover:shadow-[#F6C453]/30 transition-all hover:scale-[1.01] group cursor-pointer ${
                isActive ? "border-[#F6C453] border-2" : "border-[#F6C453]/50"
              }`}>
                {/* Background Image */}
                <div className="absolute inset-0">
                  <Image
                    src={imageUrl}
                    alt={movieName}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 600px"
                  />
                  {/* Gradient overlay theo màu indication */}
                  <div className={`absolute inset-0 ${gradientClass}`} />
                </div>

                {/* Content bên trái */}
                <div className="relative z-10 h-full flex flex-col justify-center p-4 sm:p-6 md:p-8 max-w-[55%] sm:max-w-[45%] md:max-w-[40%]">
                  {/* Label */}
                  <div className="flex items-center gap-1.5 mb-3 sm:mb-4">
                    <div className={`w-2 h-2 rounded-full ${iconColor} shadow-sm`} />
                    <span className="text-white/90 text-xs sm:text-sm font-medium">{label}</span>
                  </div>

                  {/* Tên phim */}
                  <h3 className="text-white font-bold text-base sm:text-lg md:text-xl lg:text-2xl mb-4 sm:mb-6 line-clamp-3 leading-tight group-hover:text-[#F6C453] transition-colors">
                    {movieName}
                  </h3>

                  {/* Nút Play/Đang xem */}
                  <div className={`inline-flex items-center justify-center px-4 sm:px-5 py-2 sm:py-2.5 font-semibold text-sm sm:text-base rounded-lg transition-all shadow-md group-hover:shadow-lg w-fit ${
                    isActive 
                      ? "bg-[#F6C453] text-black" 
                      : "bg-white/95 hover:bg-white text-[#1a1a2e]"
                  }`}>
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2 fill-current" />
                    <span>{isActive ? "Đang xem" : "Play"}</span>
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
