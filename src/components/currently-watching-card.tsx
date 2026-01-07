"use client";

import Image from "next/image";
import Link from "next/link";
import { Play, X } from "lucide-react";
import { getImageUrl } from "@/lib/api";
import { removeFromCurrentlyWatching } from "@/lib/supabase/movies";
import type { CurrentlyWatching } from "@/lib/supabase/movies";
import { useState } from "react";

interface CurrentlyWatchingCardProps {
  item: CurrentlyWatching;
  index?: number;
}

// Format thời gian từ giây sang định dạng như "12m / 1h 59m"
function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return "0m";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Format thời gian đầy đủ cho hiển thị "12m / 1h 59m"
function formatTimeDisplay(watchTime: number, totalDuration: number): string {
  const watchFormatted = formatTime(watchTime);
  const totalFormatted = formatTime(totalDuration);
  return `${watchFormatted} / ${totalFormatted}`;
}

// Format thời gian còn lại
function formatRemainingTime(watchTime: number, totalDuration: number): string {
  if (!totalDuration || totalDuration <= 0) return "";
  const remaining = totalDuration - watchTime;
  if (remaining <= 0) return "Hoàn thành";
  return `Còn ${formatTime(remaining)}`;
}

export function CurrentlyWatchingCard({ item, index = 0 }: CurrentlyWatchingCardProps) {
  // Ưu tiên dùng poster_url (poster) thay vì thumb
  const imageUrl = getImageUrl(item.movie_poster || item.movie_thumb || "");
  const progress = item.total_duration > 0 
    ? Math.min((item.watch_time / item.total_duration) * 100, 100) 
    : 0;
  const [isDeleting, setIsDeleting] = useState(false);

  // Link đến episode nếu có, nếu không thì link đến trang phim
  const href = item.episode_slug 
    ? `/xem-phim/${item.movie_slug}/${item.episode_slug}?t=${Math.floor(item.watch_time)}`
    : `/phim/${item.movie_slug}`;

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isDeleting) return;
    
    // Bắt đầu animation xóa
    setIsDeleting(true);
    try {
      await removeFromCurrentlyWatching(item.movie_slug);
      // Đợi animation xóa hoàn thành (300ms) trước khi trigger refresh
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('currently-watching-updated'));
      }, 300);
    } catch (error) {
      // console.error('Failed to remove from currently watching:', error);
      setIsDeleting(false);
    }
  };

  return (
    <Link href={href} className={isDeleting ? 'pointer-events-none' : ''}>
      <div 
        className={`group relative flex flex-col h-full cursor-pointer transition-all duration-300 ease-in-out ${
          isDeleting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
        }`}
      >
        {/* Poster card - chỉ có poster và nút X */}
        <div 
          className={`relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-muted transition-all duration-300 flex-shrink-0 border ${
            isDeleting 
              ? 'border-transparent' 
              : 'border-transparent group-hover:scale-105 group-hover:shadow-[0_8px_30px_rgba(246,196,83,0.4)] group-hover:border-2 group-hover:border-[#F6C453]/50'
          }`}
          style={{
            willChange: "transform",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "translateZ(0)",
          }}
        >
          <Image
            src={imageUrl}
            alt={item.movie_name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-110"
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 200px"
            loading="lazy"
            quality={60}
          />

          {/* Play button overlay khi hover */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="w-14 h-14 rounded-full bg-[#F6C453] flex items-center justify-center shadow-[0_4px_20px_rgba(246,196,83,0.6)] transform scale-90 group-hover:scale-100 transition-all duration-300 group-hover:shadow-[0_6px_30px_rgba(246,196,83,0.8)] cursor-pointer">
              <Play className="w-7 h-7 text-white fill-white ml-1" />
            </div>
          </div>

          {/* Delete button (X) - top right corner, light grey rounded square */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="absolute top-2 right-2 z-30 w-7 h-7 rounded-md bg-white/20 backdrop-blur-sm hover:bg-white/30 flex items-center justify-center transition-all duration-200 shadow-lg"
            aria-label="Xóa khỏi danh sách đang xem"
            title="Xóa khỏi danh sách đang xem"
          >
            {isDeleting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <X className="w-4 h-4 text-white" />
            )}
          </button>
        </div>

        {/* Info section ở dưới card - Timeline, Title, Episode */}
        <div className="mt-2 sm:mt-3 space-y-1.5 sm:space-y-2 flex-shrink-0">
          {/* Timeline thời gian đang xem - Progress bar với time info - luôn hiển thị */}
          <div className="space-y-1">
            {/* Progress bar - light grey với segment tối hơn - chỉ hiện nếu có total_duration và progress > 0 */}
            {item.total_duration > 0 && progress > 0 ? (
              <div className="w-full h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-white/60 transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            ) : (
              // Hiển thị progress bar trống khi chưa có dữ liệu
              <div className="w-full h-0.5 bg-white/30 rounded-full overflow-hidden">
                <div className="h-full bg-white/60 transition-all duration-300" style={{ width: '0%' }} />
              </div>
            )}
            
            {/* Time info - Centered, white text - Lấy trực tiếp từ database */}
            <div className="text-center text-white text-xs sm:text-sm font-medium">
              {item.total_duration > 0 ? (
                // Có total_duration: hiển thị "12m / 1h 59m" từ watch_time trong database
                formatTimeDisplay(item.watch_time || 0, item.total_duration)
              ) : (
                // Không có total_duration: hiển thị watch_time từ database (có thể là 0)
                item.watch_time > 0 
                  ? `Đã xem: ${formatTime(item.watch_time)}`
                  : "0m / --"
              )}
            </div>
          </div>
          
          {/* Title - Bold white text */}
          <h3 className="text-white text-sm sm:text-base font-bold line-clamp-2 group-hover:text-[#F6C453] transition-colors">
            {item.movie_name}
          </h3>
          
          {/* Subtitle/Episode - Lighter white text */}
          {item.episode_name && (
            <p className="text-white/70 text-xs sm:text-sm line-clamp-1">
              {item.episode_name}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

