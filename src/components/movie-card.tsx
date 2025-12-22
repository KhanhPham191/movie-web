"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Play, Plus, ThumbsUp, ChevronDown, Volume2, VolumeX, Info, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FilmItem } from "@/lib/api";
import { getImageUrl } from "@/lib/api";
import { isValidTime } from "@/lib/utils";

interface MovieCardProps {
  movie: FilmItem;
  index?: number;
  variant?: "default" | "portrait" | "top10" | "newRelease" | "series" | "cinema";
  rank?: number;
  disableTilt?: boolean;
}

// Chuẩn hoá text số tập: "Hoàn tất (20/20)" -> "20/20"
function formatEpisodeLabel(episode?: string) {
  if (!episode) return "";
  const match = episode.match(/Hoàn tất\s*\(([^)]+)\)/i);
  if (match) return match[1]; // chỉ lấy "20/20"
  return episode;
}

// Parse episode info: extract "Phần X" and "Tập Y" separately
function parseEpisodeInfo(episode?: string): { part?: string; episode?: string } {
  if (!episode) return {};
  const partMatch = episode.match(/Phần\s*(\d+)/i);
  const epMatch = episode.match(/Tập\s*(\d+)/i) || episode.match(/(\d+)\s*\/\s*\d+/);
  return {
    part: partMatch ? `Phần ${partMatch[1]}` : undefined,
    episode: epMatch ? `Tập ${epMatch[1]}` : undefined,
  };
}

function getShortDescription(description?: string, maxLength: number = 120) {
  if (!description) return "";
  const clean = description.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, Math.max(0, maxLength - 3))}...`;
}

// Rút gọn nhãn ngôn ngữ giống "VS-LT"
function getLanguageBadge(language?: string) {
  if (!language) return "";
  const lang = language.toLowerCase();
  const hasVS = lang.includes("viet") || lang.includes("vs");
  const hasLT = lang.includes("lồng") || lang.includes("lt");
  const hasTM = lang.includes("thuyết minh") || lang.includes("tm");
  const parts = [];
  if (hasVS) parts.push("VS");
  if (hasLT) parts.push("LT");
  if (hasTM) parts.push("TM");
  return parts.length ? parts.join("-") : language;
}

export function MovieCard({ movie, index = 0, variant = "default", rank, disableTilt = false }: MovieCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPortraitImage, setIsPortraitImage] = useState(false);
  const cardRef = useRef<HTMLAnchorElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [popupPosition, setPopupPosition] = useState<{ left: number; top: number } | null>(null);
  // Use thumb_url for movie cards in categories (clearer for horizontal display)
  const imageUrl = getImageUrl(movie.thumb_url || movie.poster_url);
  
  useEffect(() => {
    const updatePosition = () => {
      if (cardRef.current && isHovered && (variant === "newRelease" || variant === "series")) {
        // Sử dụng requestAnimationFrame để đảm bảo DOM đã render xong
        requestAnimationFrame(() => {
          if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            // Tính toán vị trí chính xác giữa card
            // Fixed positioning sử dụng viewport coordinates
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            setPopupPosition({
              left: centerX,
              top: centerY,
            });
          }
        });
      } else {
        setPopupPosition(null);
      }
    };

    if (isHovered && (variant === "newRelease" || variant === "series")) {
      // Tính toán ngay khi hover
      updatePosition();
      
      // Ngăn scroll khi hover vào popup
      const preventWheel = (e: WheelEvent) => {
        if (popupRef.current && popupRef.current.contains(e.target as Node)) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      
      const preventTouch = (e: TouchEvent) => {
        if (popupRef.current && popupRef.current.contains(e.target as Node)) {
          e.preventDefault();
          e.stopPropagation();
        }
      };
      
      document.addEventListener('wheel', preventWheel, { passive: false });
      document.addEventListener('touchmove', preventTouch, { passive: false });
      
      return () => {
        document.removeEventListener('wheel', preventWheel);
        document.removeEventListener('touchmove', preventTouch);
      };
    } else {
      setPopupPosition(null);
    }
  }, [isHovered, variant]);

  useEffect(() => {
    setIsPortraitImage(false);
  }, [imageUrl]);

  // Top 10 variant - Netflix style with badge
  if (variant === "top10" && rank) {
    return (
      <Link href={`/phim/${movie.slug}`} className="cursor-pointer">
        <div className="group relative flex flex-col h-full">
          {/* Poster */}
          <div 
            className="relative aspect-[2/3] w-full rounded-[10px] overflow-hidden transition-all duration-500 ease-out group-hover:scale-[1.03] bg-muted flex-shrink-0 border border-transparent group-hover:border-[rgba(246,196,83,0.3)]"
            style={{
              willChange: "transform",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "translateZ(0)",
            }}
          >
            {/* Overlay vàng khi hover */}
            <div className="absolute inset-0 bg-[rgba(246,196,83,0.15)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out pointer-events-none z-10" />
            {/* Hover Overlay - Subtle */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out z-10" />
            <Image
              src={imageUrl}
              alt={movie.name}
              fill
              className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            />
            
            {/* Rank Badge - Top Left Corner */}
            <div className="absolute top-0 left-0 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center rounded-br-md shadow-lg z-20">
              <span className="text-white font-black text-xl md:text-2xl">{rank}</span>
            </div>
            
            {/* Top 10 Badge - Bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 z-20">
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">T</span>
                </div>
                <span className="text-white text-xs font-semibold">Top 10</span>
              </div>
            </div>
            
            {/* Play Button - Center on Hover */}
            <div className="absolute inset-0 flex items-center justify-center z-30 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out">
              <div className="relative transform scale-0 group-hover:scale-100 transition-transform duration-500 ease-in-out">
                <div className="absolute inset-0 bg-[#F6C453] rounded-full blur-lg opacity-50 group-hover:opacity-70 transition-opacity duration-500 ease-in-out" />
                <button
                  type="button"
                  className="relative w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-[#F6C453] flex items-center justify-center shadow-xl cursor-pointer"
                  aria-label="Phát phim"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = `/phim/${movie.slug}`;
                  }}
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white fill-white ml-0.5" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Title below */}
          <div className="mt-2 space-y-1 flex-shrink-0">
            <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5rem] group-hover:text-[#F6C453] transition-colors duration-500 ease-in-out">
              {movie.name}
            </h3>
            {(movie.time || movie.total_episodes) && (
              <p className="text-xs sm:text-sm text-gray-300 flex items-center gap-2">
                {isValidTime(movie.time) && (
                  <span className="truncate font-semibold text-white">
                    {movie.time}
                  </span>
                )}
                <span className="px-1 py-0.5 rounded border border-gray-500 text-[9px] leading-none">
                  16+
                </span>
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Portrait variant (vertical poster)
  if (variant === "portrait") {
    return (
      <Link href={`/phim/${movie.slug}`} className="cursor-pointer">
        <div 
          className="group relative flex flex-col h-full"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="relative aspect-[2/3] w-full rounded-[10px] overflow-hidden bg-muted transition-all duration-500 ease-in-out group-hover:scale-[1.03] group-hover:z-10 flex-shrink-0 border border-transparent group-hover:border-[rgba(246,196,83,0.3)]">
            {/* Overlay vàng khi hover */}
            <div className="absolute inset-0 bg-[rgba(246,196,83,0.15)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out pointer-events-none z-10" />
            {/* Hover Overlay - Subtle */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out z-10" />
            <Image
              src={imageUrl}
              alt={movie.name}
              fill
              className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            />
            {movie.current_episode && (
              <Badge className="absolute top-2 right-2 bg-red-600 text-white border-0 text-[10px] z-20">
                {formatEpisodeLabel(movie.current_episode)}
              </Badge>
            )}
            
            {/* Play Button - Center on Hover */}
            <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out">
              <div className="relative transform scale-0 group-hover:scale-100 transition-transform duration-500 ease-in-out">
                <div className="absolute inset-0 bg-[#F6C453] rounded-full blur-lg opacity-50 group-hover:opacity-70 transition-opacity duration-500 ease-in-out" />
                <button
                  type="button"
                  className="relative w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-[#F6C453] flex items-center justify-center shadow-xl cursor-pointer"
                  aria-label="Phát phim"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = `/phim/${movie.slug}`;
                  }}
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white fill-white ml-0.5" />
                </button>
              </div>
            </div>
          </div>
          <div className="mt-2 space-y-1 flex-shrink-0">
            <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5rem] group-hover:text-[#F6C453] transition-colors duration-500 ease-in-out">
              {movie.name}
            </h3>
            {(movie.time || movie.total_episodes) && (
              <p className="text-xs sm:text-sm text-gray-300 flex items-center gap-2">
                {isValidTime(movie.time) && (
                  <span className="truncate font-semibold text-white">
                    {movie.time}
                  </span>
                )}
                <span className="px-1 py-0.5 rounded border border-gray-500 text-[9px] leading-none">
                  16+
                </span>
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // New Release variant - poster + big rank + info, giống layout Top mới
  // Áp dụng cho Top 10 phim lẻ và Top 10 phim bộ
  if (variant === "newRelease") {
    // Xác định hướng nghiêng xen kẽ: số lẻ nghiêng trái, số chẵn nghiêng phải
    const order = rank ?? index + 1;
    const isTiltLeft = order % 2 === 1; // Card lẻ (1, 3, 5...) nghiêng trái
    const backdropUrl = getImageUrl(movie.poster_url || movie.thumb_url);
    const thumbUrl = getImageUrl(movie.thumb_url || movie.poster_url);
    const shortDescription = getShortDescription(movie.description, 140);
    const year =
      movie.created && !Number.isNaN(new Date(movie.created).getFullYear())
        ? new Date(movie.created).getFullYear()
        : undefined;
    const episodeLabel = formatEpisodeLabel(movie.current_episode);
    const qualityLabel = movie.quality ? movie.quality.toUpperCase() : "";
    
    // Clip-path polygon từ tramphim - tạo hình dạng nghiêng với góc bo tròn
    // Clip-path gốc nghiêng về bên phải, đảo ngược bằng scaleX(-1) để nghiêng trái
    const clipPathPolygon = "polygon(5.761% 100%, 94.239% 100%, 94.239% 100%, 95.174% 99.95%, 96.06% 99.803%, 96.887% 99.569%, 97.642% 99.256%, 98.313% 98.87%, 98.889% 98.421%, 99.357% 97.915%, 99.706% 97.362%, 99.925% 96.768%, 100% 96.142%, 100% 3.858%, 100% 3.858%, 99.913% 3.185%, 99.662% 2.552%, 99.263% 1.968%, 98.731% 1.442%, 98.08% .984%, 97.328% .602%, 96.488% .306%, 95.577% .105%, 94.609% .008%, 93.6% .024%, 5.121% 6.625%, 5.121% 6.625%, 4.269% 6.732%, 3.468% 6.919%, 2.728% 7.178%, 2.058% 7.503%, 1.467% 7.887%, .962% 8.323%, .555% 8.805%, .253% 9.326%, .065% 9.88%, 0% 10.459%, 0% 96.142%, 0% 96.142%, .075% 96.768%, .294% 97.362%, .643% 97.915%, 1.111% 98.421%, 1.687% 98.87%, 2.358% 99.256%, 3.113% 99.569%, 3.94% 99.803%, 4.826% 99.95%, 5.761% 100%)";

    return (
      <>
        {/* Hover Popup Detail - Fixed positioning tại vị trí card với animation bung ra */}
        {isHovered && popupPosition && (
          <div
            ref={popupRef}
            className="pointer-events-none fixed z-[9999] w-[min(480px,82vw)] hidden md:block"
            style={{
              left: `${popupPosition.left}px`,
              top: `${popupPosition.top}px`,
              transform: 'translate(-50%, -50%)',
              opacity: 1,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="rounded-xl border border-white/15 bg-[#050509]/95 overflow-hidden shadow-[0_18px_40px_rgba(0,0,0,0.85)] backdrop-blur-md">
              {/* Poster - Bên trên, tỉ lệ 16:9 */}
              {backdropUrl && (
                <div className="relative aspect-video w-full overflow-hidden bg-[#0a0a0a]">
                  <Image
                    src={backdropUrl}
                    alt={movie.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 0px, 480px"
                    unoptimized
                  />
                </div>
              )}

              {/* Content - Bên dưới */}
              <div className="px-6 py-5 space-y-4">
                {/* Title Section */}
                <div className="space-y-1">
                  <h3 className="text-[18px] font-bold text-white line-clamp-2">
                    {movie.name}
                  </h3>
                  {movie.original_name && movie.original_name !== movie.name && (
                    <p className="text-[14px] text-[#F6C453] line-clamp-1">
                      {movie.original_name}
                    </p>
                  )}
                </div>

                {/* Metadata Tags */}
                {(() => {
                  const episodeInfo = parseEpisodeInfo(movie.current_episode);
                    return (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-sm bg-black/80 px-2.5 py-1.5 text-[12px] font-semibold text-white border border-white/20">
                          T16
                        </span>
                        {year && (
                          <span className="inline-flex items-center rounded-sm bg-white px-2.5 py-1.5 text-[12px] font-semibold text-black">
                            {year}
                          </span>
                        )}
                        {episodeInfo.part && (
                          <span className="inline-flex items-center rounded-sm bg-white px-2.5 py-1.5 text-[12px] font-semibold text-black">
                            {episodeInfo.part}
                          </span>
                        )}
                        {episodeInfo.episode && (
                          <span className="inline-flex items-center rounded-sm bg-white px-2.5 py-1.5 text-[12px] font-semibold text-black">
                            {episodeInfo.episode}
                          </span>
                        )}
                      </div>
                    );
                })()}

              {/* Genres */}
              {movie.category && movie.category.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 text-[13px] text-white">
                  {movie.category.slice(0, 4).map((cat, i) => (
                    <span key={cat.id}>
                      {cat.name}
                      {i < Math.min(movie.category.length, 4) - 1 && (
                        <span className="mx-2 text-gray-500">•</span>
                      )}
                    </span>
                  ))}
                </div>
              )}

                {/* Action Buttons - Full width */}
                <div className="flex items-center gap-3 pt-2">
                  <Link
                    href={`/phim/${movie.slug}`}
                    className="pointer-events-auto bg-[#F6C453] hover:bg-[#F6C453]/90 text-black font-bold text-base rounded-md flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                    style={{ width: '139.52px', height: '46px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Play className="w-5 h-5 fill-black shrink-0" />
                    <span>Xem ngay</span>
                  </Link>
                  <button
                    type="button"
                    className="pointer-events-auto bg-[#1a1a1a] hover:bg-[#252525] text-white border border-white/20 font-semibold text-base px-5 py-3.5 rounded-md flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <Heart className="w-5 h-5 shrink-0" />
                    <span>Thích</span>
                  </button>
                  <Link
                    href={`/phim/${movie.slug}`}
                    className="pointer-events-auto bg-[#1a1a1a] hover:bg-[#252525] text-white border border-white/20 font-semibold text-base px-5 py-3.5 rounded-md flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Info className="w-5 h-5 shrink-0" />
                    <span>Chi tiết</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
        <Link ref={cardRef} href={`/phim/${movie.slug}`} className="relative block cursor-pointer">
          <div
            className="group relative flex flex-col items-start h-full pt-4 sm:pt-5"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Poster - Sử dụng clip-path polygon để tạo hình dạng nghiêng như tramphim */}
            <div
            className="relative aspect-[2/3] w-full bg-muted transition-all duration-500 ease-in-out group-hover:shadow-2xl flex-shrink-0 border border-transparent group-hover:border-[rgba(246,196,83,0.3)]"
            style={{
              clipPath: clipPathPolygon,
              transform: `scale(${isHovered ? 1.03 : 1}) ${isTiltLeft ? 'scaleX(-1)' : ''}`,
              transformStyle: "preserve-3d",
              transformOrigin: "center center",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3)",
            }}
          >
            {/* Inner container với overflow-hidden - đảo ngược lại nội dung cho card nghiêng trái */}
            <div 
              className="absolute inset-0 overflow-hidden"
              style={{
                transform: isTiltLeft ? 'scaleX(-1)' : 'none',
              }}
            >
              {/* Overlay vàng khi hover */}
              <div className="absolute inset-0 bg-[rgba(246,196,83,0.15)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out pointer-events-none z-10" />
              {/* Hover Overlay - Subtle */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out z-10" />
              <Image
                src={imageUrl}
                alt={movie.name}
                fill
                className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-[1.03]"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              />
              {movie.current_episode && (
                <Badge className="absolute bottom-2 left-2 bg-red-600 text-white border-0 text-[10px] font-bold z-20">
                  {formatEpisodeLabel(movie.current_episode)}
                </Badge>
              )}
              
              {/* Play Button - Center on Hover */}
              <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out">
                <div className="relative transform scale-0 group-hover:scale-100 transition-transform duration-500 ease-in-out">
                  <div className="absolute inset-0 bg-[#F6C453] rounded-full blur-lg opacity-50 group-hover:opacity-70 transition-opacity duration-500 ease-in-out" />
                  <button
                    type="button"
                    className="relative w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-[#F6C453] flex items-center justify-center shadow-xl"
                    aria-label="Phát phim"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      window.location.href = `/phim/${movie.slug}`;
                    }}
                  >
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white fill-white ml-0.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Rank + Info - Giảm spacing và kích thước rank để compact hơn */}
          <div className="mt-2 flex items-start gap-1.5 w-full flex-shrink-0">
            {rank && (
              <div className="text-2xl xs:text-3xl sm:text-4xl font-black text-[#F6C453] leading-none flex-shrink-0">
                {rank}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm xs:text-base font-semibold text-white line-clamp-2 min-h-[2.25rem] group-hover:text-[#F6C453] transition-colors duration-500 ease-in-out">
                {movie.name}
              </h3>
              <p className="mt-0.5 text-xs sm:text-sm text-gray-300 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                {isValidTime(movie.time) && (
                  <span className="font-semibold text-white">
                    {movie.time}
                  </span>
                )}
                {movie.language && (
                  <span className="px-1 py-0.5 rounded bg-white/10 text-[10px] uppercase tracking-wide">
                    {movie.language}
                  </span>
                )}
                <span className="px-1 py-0.5 rounded border border-gray-500 text-[10px]">
                  13+
                </span>
              </p>
            </div>
          </div>
        </div>
      </Link>
      </>
    );
  }

  // Series variant - poster + info, không số thứ tự, 3D nhẹ khi hover
  if (variant === "series") {
    const thumbUrl = getImageUrl(movie.thumb_url || movie.poster_url);
    const backdropUrl = getImageUrl(movie.poster_url || movie.thumb_url);
    const year =
      movie.created && !Number.isNaN(new Date(movie.created).getFullYear())
        ? new Date(movie.created).getFullYear()
        : undefined;
    const episodeLabel = formatEpisodeLabel(movie.current_episode);
    const shortDescription = getShortDescription(movie.description, 140);

    return (
      <>
        {/* Hover Popup Detail - Fixed positioning tại vị trí card với animation bung ra */}
        {isHovered && popupPosition && (
          <div
            ref={popupRef}
            className="pointer-events-none fixed z-[9999] w-[min(480px,82vw)] hidden md:block"
            style={{
              left: `${popupPosition.left}px`,
              top: `${popupPosition.top}px`,
              transform: 'translate(-50%, -50%)',
              opacity: 1,
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            <div className="rounded-xl border border-white/15 bg-[#050509]/95 overflow-hidden shadow-[0_18px_40px_rgba(0,0,0,0.85)] backdrop-blur-md">
              {/* Poster - Bên trên, tỉ lệ 16:9 */}
              {backdropUrl && (
                <div className="relative aspect-video w-full overflow-hidden bg-[#0a0a0a]">
                  <Image
                    src={backdropUrl}
                    alt={movie.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 0px, 480px"
                    unoptimized
                  />
                </div>
              )}

              {/* Content - Bên dưới */}
              <div className="px-6 py-5 space-y-4">
                {/* Title Section */}
                <div className="space-y-1">
                  <h3 className="text-[18px] font-bold text-white line-clamp-2">
                    {movie.name}
                  </h3>
                  {movie.original_name && movie.original_name !== movie.name && (
                    <p className="text-[14px] text-[#F6C453] line-clamp-1">
                      {movie.original_name}
                    </p>
                  )}
                </div>

                {/* Metadata Tags */}
                {(() => {
                  const episodeInfo = parseEpisodeInfo(movie.current_episode);
                    return (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-sm bg-black/80 px-2.5 py-1.5 text-[12px] font-semibold text-white border border-white/20">
                          T16
                        </span>
                        {year && (
                          <span className="inline-flex items-center rounded-sm bg-white px-2.5 py-1.5 text-[12px] font-semibold text-black">
                            {year}
                          </span>
                        )}
                        {episodeInfo.part && (
                          <span className="inline-flex items-center rounded-sm bg-white px-2.5 py-1.5 text-[12px] font-semibold text-black">
                            {episodeInfo.part}
                          </span>
                        )}
                        {episodeInfo.episode && (
                          <span className="inline-flex items-center rounded-sm bg-white px-2.5 py-1.5 text-[12px] font-semibold text-black">
                            {episodeInfo.episode}
                          </span>
                        )}
                      </div>
                    );
                })()}

              {/* Genres */}
              {movie.category && movie.category.length > 0 && (
                <div className="flex flex-wrap items-center gap-1 text-[13px] text-white">
                  {movie.category.slice(0, 4).map((cat, i) => (
                    <span key={cat.id}>
                      {cat.name}
                      {i < Math.min(movie.category.length, 4) - 1 && (
                        <span className="mx-2 text-gray-500">•</span>
                      )}
                    </span>
                  ))}
                </div>
              )}

                {/* Action Buttons - Full width */}
                <div className="flex items-center gap-3 pt-2">
                  <Link
                    href={`/phim/${movie.slug}`}
                    className="pointer-events-auto bg-[#F6C453] hover:bg-[#F6C453]/90 text-black font-bold text-base rounded-md flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                    style={{ width: '139.52px', height: '46px' }}
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Play className="w-5 h-5 fill-black shrink-0" />
                    <span>Xem ngay</span>
                  </Link>
                  <button
                    type="button"
                    className="pointer-events-auto bg-[#1a1a1a] hover:bg-[#252525] text-white border border-white/20 font-semibold text-base px-5 py-3.5 rounded-md flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <Heart className="w-5 h-5 shrink-0" />
                    <span>Thích</span>
                  </button>
                  <Link
                    href={`/phim/${movie.slug}`}
                    className="pointer-events-auto bg-[#1a1a1a] hover:bg-[#252525] text-white border border-white/20 font-semibold text-base px-5 py-3.5 rounded-md flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Info className="w-5 h-5 shrink-0" />
                    <span>Chi tiết</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
        <Link ref={cardRef} href={`/phim/${movie.slug}`} className="cursor-pointer">
          <div
            className="group relative flex flex-col items-start h-full"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Poster */}
          <div
            className="relative aspect-[2/3] w-full rounded-[10px] overflow-hidden bg-muted transition-all duration-500 ease-in-out group-hover:shadow-2xl flex-shrink-0 border border-transparent group-hover:border-[rgba(246,196,83,0.3)]"
            style={{
              transform: isHovered && !disableTilt
                ? "perspective(900px) rotateY(8deg) scale(1.03)"
                : isHovered && disableTilt
                ? "scale(1.03)"
                : "none",
              transformStyle: "preserve-3d",
            }}
          >
            {/* Overlay vàng khi hover */}
            <div className="absolute inset-0 bg-[rgba(246,196,83,0.15)] opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out pointer-events-none z-10" />
            {/* Hover Overlay - Subtle */}
            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-in-out z-10" />
            <Image
              src={imageUrl}
              alt={movie.name}
              fill
              className="object-cover transition-transform duration-500 ease-in-out group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            />
            {movie.current_episode && (
              <Badge className="absolute bottom-2 left-2 bg-red-600 text-white border-0 text-[10px] font-bold z-20">
                {formatEpisodeLabel(movie.current_episode)}
              </Badge>
            )}
            
            {/* Play Button - Center on Hover */}
            <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out">
              <div className="relative transform scale-0 group-hover:scale-100 transition-transform duration-500 ease-in-out">
                <div className="absolute inset-0 bg-[#F6C453] rounded-full blur-lg opacity-50 group-hover:opacity-70 transition-opacity duration-500 ease-in-out" />
                <button
                  type="button"
                  className="relative w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-[#F6C453] flex items-center justify-center shadow-xl cursor-pointer"
                  aria-label="Phát phim"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    window.location.href = `/phim/${movie.slug}`;
                  }}
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white fill-white ml-0.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="mt-3 w-full flex-shrink-0">
            <h3 className="text-sm xs:text-base font-semibold text-white line-clamp-2 min-h-[2.5rem] group-hover:text-[#F6C453] transition-colors duration-500 ease-out">
              {movie.name}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-gray-300 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              {isValidTime(movie.time) && (
                <span className="font-semibold text-white">
                  {movie.time}
                </span>
              )}
              <span className="px-1 py-0.5 rounded border border-gray-500 text-[10px]">
                16+
              </span>
            </p>
          </div>
        </div>
        </Link>
      </>
    );
  }

  // Cinema / US-UK variant - wide backdrop + small poster + info (layout giống hình bạn gửi)
  if (variant === "cinema") {
    // Đổi ngược lại giữa poster và thumb_url:
    // - backdrop dùng poster_url (nếu có) để rõ nét
    // - poster nhỏ bên dưới dùng thumb_url để khác hình
    const backdropUrl = getImageUrl(movie.poster_url || movie.thumb_url);
    const thumbUrl = getImageUrl(movie.thumb_url || movie.poster_url);
    const shortDescription = getShortDescription(movie.description, 110);
    const languageBadge = getLanguageBadge(movie.language);
    const qualityLabel = movie.quality ? movie.quality.toUpperCase() : "";

    const year =
      movie.created && !Number.isNaN(new Date(movie.created).getFullYear())
        ? new Date(movie.created).getFullYear()
        : undefined;
    const episodeLabel = formatEpisodeLabel(movie.current_episode);

    return (
      <Link href={`/phim/${movie.slug}`} className="cursor-pointer">
        <div className="group relative w-full max-w-full h-full flex flex-col">
          {/* Glow frame */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#F6C453]/20 via-transparent to-[#DB2777]/15 blur-xl opacity-0 group-hover:opacity-100 transition duration-500" />

          {/* Wide backdrop */}
          <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-[#0a0a0a] transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-2xl flex-shrink-0 border border-white/5 group-hover:border-[rgba(246,196,83,0.35)]">
            {/* Top accent bar */}
            <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-[#F6C453] via-[#DB2777] to-[#6D28D9] opacity-70" />

            {/* Overlay vàng khi hover */}
            <div className="absolute inset-0 bg-[rgba(246,196,83,0.12)] opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10" />

            <Image
              src={backdropUrl}
              alt={movie.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              unoptimized
            />

            {(languageBadge || qualityLabel) && (
              <div className="absolute top-2 left-2 flex items-center gap-1 z-20">
                {languageBadge && (
                  <Badge className="bg-gradient-to-r from-[#7C3AED] to-[#DB2777] text-white border-0 text-[10px] font-bold shadow-lg">
                    {languageBadge}
                  </Badge>
                )}
                {qualityLabel && (
                  <Badge className="bg-white/15 text-white border border-white/20 text-[10px] font-semibold">
                    {qualityLabel}
                  </Badge>
                )}
              </div>
            )}

            {/* Dark gradient bar at bottom */}
            <div className="absolute inset-x-0 bottom-0 h-[96px] sm:h-[108px] bg-gradient-to-t from-[#050505] via-[#050505e6] to-transparent" />

            {/* Poster + text overlay on bottom bar */}
            <div className="absolute left-3 right-3 sm:left-4 sm:right-4 bottom-3 flex items-end gap-2 sm:gap-3">
              {/* Small vertical poster */}
              <div className="relative aspect-[2/3] w-12 xs:w-14 sm:w-20 rounded-md overflow-hidden shadow-2xl shadow-black/80 border border-white/10 bg-black/60 flex-shrink-0">
                <Image
                  src={thumbUrl}
                  alt={movie.name}
                  fill
                  className="object-cover"
                  sizes="56px"
                />
              </div>

              {/* Text & badges */}
              <div className="flex-1 min-w-0">
                <div className="mb-0.5 sm:mb-1 flex flex-wrap items-center gap-1">
                  {movie.language && (
                    <Badge className="bg-white text-black text-[9px] xs:text-[10px] font-semibold px-1.5 sm:px-2 py-0.5 border-0">
                      {movie.language}
                    </Badge>
                  )}
                  {episodeLabel && (
                    <Badge className="bg-red-600 text-white text-[9px] xs:text-[10px] font-semibold border-0">
                      {episodeLabel}
                    </Badge>
                  )}
                  {qualityLabel && (
                    <Badge className="bg-white/10 text-white text-[9px] xs:text-[10px] font-semibold border border-white/20">
                      {qualityLabel}
                    </Badge>
                  )}
                </div>
                <h3 className="text-xs xs:text-sm sm:text-base font-semibold text-white line-clamp-1">
                  {movie.name}
                </h3>
                {movie.original_name && movie.original_name !== movie.name && (
                  <p className="text-[10px] xs:text-xs text-gray-300 line-clamp-1">
                    {movie.original_name}
                  </p>
                )}
                {shortDescription && (
                  <p className="mt-0.5 text-[10px] xs:text-xs text-gray-300 line-clamp-2">
                    {shortDescription}
                  </p>
                )}
                <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm text-gray-200 flex flex-wrap items-center gap-x-1.5 sm:gap-x-2 gap-y-0.5">
                  <span className="px-1 py-0.5 rounded border border-gray-500 text-[9px] xs:text-[10px]">
                    18+
                  </span>
                  {year && <span>{year}</span>}
                  {isValidTime(movie.time) && (
                    <span className="font-semibold text-white">
                      {movie.time}
                    </span>
                  )}
                  {episodeLabel && (
                    <span className="px-1 py-0.5 rounded bg-white/10 border border-white/10 text-[9px] xs:text-[10px]">
                      {episodeLabel}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Default variant - Netflix 2024 horizontal thumbnail
  return (
    <div
      className="group relative flex flex-col h-full premium-hover"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/phim/${movie.slug}`} className="cursor-pointer">
        <div
          className={`relative rounded-[10px] overflow-hidden bg-muted transition-all duration-300 ease-out flex-shrink-0 border border-transparent ${
            isHovered
              ? "scale-[1.25] sm:scale-[1.35] md:scale-[1.4] z-50 shadow-2xl shadow-black/80 border-[rgba(246,196,83,0.3)] rounded-t-[10px] rounded-b-none"
              : "scale-100 z-10 group-hover:border-[rgba(246,196,83,0.3)]"
          }`}
          style={{
            transformOrigin: index === 0 ? "left center" : "center center",
            willChange: "transform",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "translateZ(0)",
          }}
        >
          {/* Overlay vàng khi hover */}
          <div className={`absolute inset-0 bg-[rgba(246,196,83,0.15)] transition-opacity duration-300 pointer-events-none z-10 ${
            isHovered ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`} />
          {/* Thumbnail - 16:9 using thumb_url (crop center) */}
          <div className="relative aspect-video w-full overflow-hidden rounded-[10px]">
            <Image
              src={imageUrl}
              alt={movie.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
            />

            {/* Episode badge */}
            {!isHovered && movie.current_episode && (
              <div className="absolute bottom-2 left-2">
                <Badge className="bg-red-600 text-white border-0 text-[10px] font-bold">
                  {formatEpisodeLabel(movie.current_episode)}
                </Badge>
              </div>
            )}

            {/* Progress bar (simulated) */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600/50">
              <div className="h-full bg-red-600 w-0" />
            </div>
          </div>

          {/* Hover Content Panel */}
          {isHovered && (
            <div className="absolute left-0 right-0 top-full bg-[#0f0f1f] rounded-b-md p-3 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Action Buttons Row */}
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F6C453] to-[#D3A13A] hover:brightness-110 text-white border-0 cursor-pointer"
                  onClick={(e) => e.preventDefault()}
                >
                  <Play className="w-5 h-5 fill-white" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="w-9 h-9 rounded-full border-gray-400 hover:border-white bg-transparent"
                  onClick={(e) => e.preventDefault()}
                >
                  <Plus className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="w-9 h-9 rounded-full border-gray-400 hover:border-white bg-transparent"
                  onClick={(e) => e.preventDefault()}
                >
                  <ThumbsUp className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="w-9 h-9 rounded-full border-gray-400 hover:border-white bg-transparent ml-auto"
                  onClick={(e) => e.preventDefault()}
                >
                  <ChevronDown className="w-5 h-5" />
                </Button>
              </div>

              {/* Meta Info Row */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-green-500 font-semibold">97% Phù hợp</span>
                {isValidTime(movie.time) && <span className="text-gray-400">{movie.time}</span>}
              </div>

              {/* Genres */}
              <div className="flex flex-wrap items-center gap-1 text-xs text-gray-300">
                {movie.category?.slice(0, 3).map((cat, i) => (
                  <span key={cat.id}>
                    {cat.name}
                    {i < Math.min((movie.category?.length || 0), 3) - 1 && (
                      <span className="mx-1 text-gray-600">•</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Title below (when not hovered) */}
      {!isHovered && (
        <h3 className="mt-2 text-sm font-medium line-clamp-2 min-h-[2.5rem] text-gray-300 group-hover:text-white transition-colors flex-shrink-0">
          {movie.name}
        </h3>
      )}
    </div>
  );
}
