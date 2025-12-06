"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Heart, Star, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  addToFavorites,
  removeFromFavorites,
  isFavorite,
  addRating,
  getUserRating,
  addToPlaylist,
  getPlaylists,
  type Playlist,
} from "@/lib/supabase/movies";
import type { FilmItem } from "@/lib/api";
import { useRouter } from "next/navigation";

interface MovieActionsProps {
  movie: FilmItem;
  onRatingChange?: () => void;
}

export function MovieActions({ movie, onRatingChange }: MovieActionsProps) {
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [userRating, setUserRating] = useState<number | null>(null);
  const [showRatingDialog, setShowRatingDialog] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      // Chỉ load khi component đã mount và user đã authenticated
      const timer = setTimeout(() => {
        checkFavorite();
        loadPlaylists();
        loadUserRating();
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, movie.slug]);

  const checkFavorite = async () => {
    try {
      const favorite = await isFavorite(movie.slug);
      setFavorited(favorite);
    } catch (error) {
      console.error("[checkFavorite] Error:", error);
      setFavorited(false);
    }
  };

  const loadPlaylists = async () => {
    try {
      const { data } = await getPlaylists();
      if (data) setPlaylists(data);
    } catch (error) {
      console.error("[loadPlaylists] Error:", error);
      setPlaylists([]);
    }
  };

  const loadUserRating = async () => {
    try {
      const { data } = await getUserRating(movie.slug);
      if (data) setUserRating(data.rating);
    } catch (error) {
      console.error("[loadUserRating] Error:", error);
      setUserRating(null);
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      router.push("/dang-nhap");
      return;
    }

    setLoading(true);
    if (favorited) {
      await removeFromFavorites(movie.slug);
      setFavorited(false);
    } else {
      await addToFavorites(movie);
      setFavorited(true);
    }
    setLoading(false);
  };

  const handleRating = async (rating: number) => {
    if (!isAuthenticated) {
      router.push("/dang-nhap");
      return;
    }

    setLoading(true);
    await addRating(movie, rating);
    setUserRating(rating);
    setLoading(false);
    setShowRatingDialog(false);
    if (onRatingChange) onRatingChange();
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!isAuthenticated) {
      router.push("/dang-nhap");
      return;
    }

    setLoading(true);
    await addToPlaylist(playlistId, movie);
    setLoading(false);
    // Có thể thêm toast notification ở đây
  };

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => router.push("/dang-nhap")}
          className="bg-white/5 border-white/20 text-white hover:bg-white/10"
        >
          <Heart className="w-4 h-4 mr-2" />
          Đăng nhập để lưu
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Favorite Button */}
      <Button
        variant="outline"
        onClick={handleFavorite}
        disabled={loading}
        className={`bg-white/5 border-white/20 text-white hover:bg-white/10 ${
          favorited ? "bg-[#fb743E]/20 border-[#fb743E] text-[#fb743E]" : ""
        }`}
      >
        <Heart className={`w-4 h-4 mr-2 ${favorited ? "fill-current" : ""}`} />
        {favorited ? "Đã yêu thích" : "Yêu thích"}
      </Button>

      {/* Rating Button */}
      <DropdownMenu open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            disabled={loading}
            className="bg-white/5 border-white/20 text-white hover:bg-white/10"
          >
            <Star className={`w-4 h-4 mr-2 ${userRating ? "fill-current text-yellow-400" : ""}`} />
            {userRating ? `${userRating} sao` : "Đánh giá"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-[#0f0f0f]/95 backdrop-blur border-gray-800">
          <div className="px-2 py-1.5 text-xs text-gray-400">Chọn số sao</div>
          <DropdownMenuSeparator className="bg-gray-700" />
          {[5, 4, 3, 2, 1].map((rating) => (
            <DropdownMenuItem
              key={rating}
              onClick={() => handleRating(rating)}
              className="text-gray-200 hover:text-white cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Star className={`w-4 h-4 ${userRating === rating ? "fill-current text-yellow-400" : ""}`} />
                <span>{rating} sao</span>
                {userRating === rating && <Check className="w-4 h-4 ml-auto" />}
              </div>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Add to Playlist */}
      {playlists.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              disabled={loading}
              className="bg-white/5 border-white/20 text-white hover:bg-white/10"
            >
              <Plus className="w-4 h-4 mr-2" />
              Thêm vào danh sách
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-[#0f0f0f]/95 backdrop-blur border-gray-800">
            {playlists.map((playlist) => (
              <DropdownMenuItem
                key={playlist.id}
                onClick={() => handleAddToPlaylist(playlist.id)}
                className="text-gray-200 hover:text-white cursor-pointer"
              >
                {playlist.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-gray-700" />
            <DropdownMenuItem
              onClick={() => router.push("/tai-khoan/danh-sach")}
              className="text-[#fb743E] hover:text-white cursor-pointer"
            >
              Tạo danh sách mới
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {playlists.length === 0 && (
        <Button
          variant="outline"
          onClick={() => router.push("/tai-khoan/danh-sach")}
          className="bg-white/5 border-white/20 text-white hover:bg-white/10"
        >
          <Plus className="w-4 h-4 mr-2" />
          Tạo danh sách
        </Button>
      )}
    </div>
  );
}

