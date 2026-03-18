"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { useAuth, AUTH_DISABLED } from "@/contexts/auth-context";

interface LikeButtonProps {
  movieSlug: string;
  movieName?: string;
}

export function LikeButton({ movieSlug, movieName }: LikeButtonProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [isLiked, setIsLiked] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Load từ localStorage khi component mount
  useEffect(() => {
    setIsMounted(true);
    if (isAuthenticated) {
      const likedMovies = JSON.parse(localStorage.getItem("likedMovies") || "[]");
      setIsLiked(likedMovies.includes(movieSlug));
    }
  }, [movieSlug, isAuthenticated]);

  const handleLike = () => {
    // Kiểm tra auth
    if (AUTH_DISABLED || !isAuthenticated) {
      router.push("/dang-nhap");
      return;
    }

    const likedMovies = JSON.parse(localStorage.getItem("likedMovies") || "[]");
    
    if (isLiked) {
      // Bỏ like
      const updated = likedMovies.filter((slug: string) => slug !== movieSlug);
      localStorage.setItem("likedMovies", JSON.stringify(updated));
      setIsLiked(false);
    } else {
      // Thêm like
      if (!likedMovies.includes(movieSlug)) {
        likedMovies.push(movieSlug);
      }
      localStorage.setItem("likedMovies", JSON.stringify(likedMovies));
      setIsLiked(true);
    }
  };

  if (!isMounted) return null;

  return (
    <button
      onClick={handleLike}
      className={`inline-flex items-center justify-center rounded-full transition-all duration-300 ${
        isLiked
          ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
          : "bg-white/5 text-white hover:bg-white/10"
      }`}
      style={{
        width: "44px",
        height: "44px",
        padding: "8px"
      }}
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
        className="w-6 h-6 transition-all duration-300"
        fill={isLiked ? "currentColor" : "none"}
        strokeWidth={2}
      />
    </button>
  );
}
