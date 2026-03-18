"use client";

import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useAuth, AUTH_DISABLED } from "@/contexts/auth-context";
import { useFavorites } from "@/contexts/favorites-context";

interface LikeButtonProps {
  movieSlug: string;
  movieName?: string;
}

export function LikeButton({ movieSlug, movieName = "" }: LikeButtonProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { isFavorited, toggleFavorite, pendingSlugs } = useFavorites();
  
  const isLiked = isFavorited(movieSlug);
  const isPending = pendingSlugs.has(movieSlug);

  const handleLike = async () => {
    // Kiểm tra auth
    if (AUTH_DISABLED || !isAuthenticated) {
      router.push("/dang-nhap");
      return;
    }

    if (isPending) return;

    await toggleFavorite({
      movie_slug: movieSlug,
      movie_name: movieName,
      movie_thumb: "",
    });
  };

  if (!isAuthenticated) return null;

  return (
    <button
      onClick={handleLike}
      disabled={isPending}
      className={`inline-flex items-center justify-center rounded-full transition-all duration-300 border font-semibold text-base px-5 py-3.5 ${
        isLiked
          ? "bg-[#F6C453]/15 hover:bg-[#F6C453]/25 text-[#F6C453] border-[#F6C453]/40"
          : "bg-[#1a1a1a] hover:bg-[#252525] text-white border-white/20"
      } ${isPending ? "opacity-60 cursor-not-allowed" : ""}`}
      title={
        AUTH_DISABLED || !isAuthenticated
          ? "Đăng nhập để yêu thích"
          : isLiked
            ? "Bỏ yêu thích"
            : "Yêu thích"
      }
      aria-label={
        AUTH_DISABLED || !isAuthenticated
          ? "Đăng nhập để yêu thích"
          : isLiked
            ? "Bỏ yêu thích"
            : "Yêu thích"
      }
    >
      <Heart
        className="w-5 h-5 shrink-0 transition-all duration-300"
        fill={isLiked ? "currentColor" : "none"}
        strokeWidth={2}
      />
      <span>{isLiked ? "Đã thích" : "Thích"}</span>
    </button>
  );
}
