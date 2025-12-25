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

// Format thời gian từ giây sang phút:giây
function formatTime(seconds: number): string {
  if (!seconds || seconds <= 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
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
    
    // Xóa ngay lập tức, không cần confirm
    setIsDeleting(true);
    try {
      await removeFromCurrentlyWatching(item.movie_slug);
      // Trigger refresh bằng cách dispatch custom event
      window.dispatchEvent(new CustomEvent('currently-watching-updated'));
    } catch (error) {
      console.error('Failed to remove from currently watching:', error);
      setIsDeleting(false);
    }
  };

  return (
    <Link href={href}>
      <div className="group relative flex flex-col h-full cursor-pointer">
        {/* Poster với progress bar - Nổi bật hơn */}
        <div 
          className="relative aspect-[2/3] w-full rounded-lg overflow-hidden bg-muted transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_8px_30px_rgba(246,196,83,0.4)] group-hover:border-2 group-hover:border-[#F6C453]/50 flex-shrink-0 border border-transparent"
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
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
          />
          
          {/* Gradient overlay để text dễ đọc hơn */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Progress bar overlay - Nổi bật hơn */}
          {progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-black/60 backdrop-blur-sm">
              <div 
                className="h-full bg-gradient-to-r from-[#F6C453] to-[#D3A13A] transition-all duration-300 shadow-[0_0_8px_rgba(246,196,83,0.6)]"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Play button overlay khi hover - Nổi bật hơn */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="w-14 h-14 rounded-full bg-[#F6C453] flex items-center justify-center shadow-[0_4px_20px_rgba(246,196,83,0.6)] transform scale-90 group-hover:scale-100 transition-all duration-300 group-hover:shadow-[0_6px_30px_rgba(246,196,83,0.8)] cursor-pointer">
              <Play className="w-7 h-7 text-white fill-white ml-1" />
            </div>
          </div>

          {/* Episode badge nếu có - di chuyển xuống dưới để tránh nút xóa */}
          {item.episode_name && (
            <div className="absolute top-10 right-2 bg-[#F6C453]/90 backdrop-blur-sm px-2 py-1 rounded-md text-white text-[10px] font-bold shadow-lg border border-[#D3A13A]/30 z-20">
              {item.episode_name}
            </div>
          )}

          {/* "Xem tiếp" badge - luôn hiển thị, gọn trên mobile */}
          {progress > 0 && progress < 100 && (
            <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-black/80 backdrop-blur-sm border border-white/10 shadow-sm z-20">
              <span className="text-[8px] sm:text-[9px] text-white font-semibold uppercase tracking-wide whitespace-nowrap">
                Xem tiếp
              </span>
            </div>
          )}

          {/* Delete button - top right corner, chỉ hiện khi hover */}
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="absolute top-2 right-2 z-30 w-7 h-7 rounded-full bg-black/80 backdrop-blur-sm border border-white/20 hover:bg-red-600/90 hover:border-red-500 flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 shadow-lg"
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

        {/* Title và thông tin - Cải thiện */}
        <div className="mt-2.5 space-y-1.5 flex-shrink-0">
          <h3 className="text-sm font-semibold line-clamp-2 min-h-[2.5rem] text-gray-200 group-hover:text-white transition-colors">
            {item.movie_name}
          </h3>
          
          {/* Progress info - Nổi bật hơn */}
          {item.total_duration > 0 && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-gray-400">{formatTime(item.watch_time)} / {formatTime(item.total_duration)}</span>
                <span className="text-[#F6C453] font-bold">{Math.round(progress)}%</span>
              </div>
              {progress > 0 && progress < 100 && (
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-1 bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-[#F6C453] to-[#D3A13A] transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
              {item.total_duration > 0 && (
                <p className="text-[9px] text-[#F6C453] font-medium">
                  {formatRemainingTime(item.watch_time, item.total_duration)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

