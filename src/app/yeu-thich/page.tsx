"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth, AUTH_DISABLED } from "@/contexts/auth-context";
import { useFavorites } from "@/contexts/favorites-context";
import { Footer } from "@/components/footer";
import { getImageUrl } from "@/lib/api";
import { Heart, Trash2, Play, Film, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FavoriteItem {
  id: string;
  movie_slug: string;
  movie_name: string;
  movie_thumb: string;
  movie_poster?: string;
  movie_year?: number;
  movie_quality?: string;
  movie_type?: string;
  added_at: string;
}

const PAGE_SIZE = 24;

export default function FavoritesPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toggleFavorite } = useFavorites();

  const [items, setItems] = useState<FavoriteItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (AUTH_DISABLED) router.replace("/");
  }, [router]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) router.replace("/dang-nhap");
  }, [isAuthenticated, authLoading, router]);

  const fetchFavorites = useCallback(async (p: number) => {
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`/movpey/favorites?page=${p}&limit=${PAGE_SIZE}`);
      if (!res.ok) throw new Error("Không thể tải danh sách");
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err: any) {
      setError(err.message || "Đã xảy ra lỗi");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) fetchFavorites(page);
  }, [isAuthenticated, page, fetchFavorites]);

  if (AUTH_DISABLED) return null;

  const handleRemove = async (item: FavoriteItem) => {
    await toggleFavorite({
      movie_slug: item.movie_slug,
      movie_name: item.movie_name,
      movie_thumb: item.movie_thumb,
      movie_poster: item.movie_poster,
      movie_year: item.movie_year,
      movie_quality: item.movie_quality,
      movie_type: item.movie_type,
    });
    // Re-fetch to sync UI
    fetchFavorites(page);
  };

  const typeLabel = (type?: string) => {
    if (type === "phim-bo") return "Phim bộ";
    if (type === "phim-le") return "Phim lẻ";
    return "";
  };

  return (
    <main className="min-h-screen bg-[#0D0D0D] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#F6C453]/6 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#F6C453]/4 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative container mx-auto px-4 pt-24 pb-16 max-w-7xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#F6C453]/10 flex items-center justify-center">
            <Heart className="w-5 h-5 text-[#F6C453] fill-[#F6C453]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Danh sách yêu thích</h1>
            {total > 0 && (
              <p className="text-sm text-gray-500 mt-0.5">{total} bộ phim</p>
            )}
          </div>
        </div>

        {/* Loading skeleton */}
        {(isLoading || authLoading) && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="aspect-[2/3] rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {!isLoading && error && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 max-w-md">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && items.length === 0 && isAuthenticated && (
          <div className="flex flex-col items-center justify-center py-24 gap-5 text-center">
            <div className="w-20 h-20 rounded-2xl bg-white/5 flex items-center justify-center">
              <Film className="w-10 h-10 text-gray-600" />
            </div>
            <div>
              <p className="text-white font-semibold text-lg mb-2">Chưa có phim yêu thích</p>
              <p className="text-gray-500 text-sm max-w-xs">
                Nhấn nút{" "}
                <Heart className="w-3.5 h-3.5 inline text-[#F6C453] fill-[#F6C453]" />{" "}
                trên bất kỳ bộ phim nào để thêm vào đây
              </p>
            </div>
            <Link href="/">
              <Button className="bg-gradient-to-r from-[#F6C453] to-[#D3A13A] text-black font-semibold rounded-xl hover:shadow-[0_0_20px_rgba(246,196,83,0.3)] transition-all">
                Khám phá phim ngay
              </Button>
            </Link>
          </div>
        )}

        {/* Grid */}
        {!isLoading && items.length > 0 && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {items.map((item) => {
                const thumb = getImageUrl(item.movie_poster || item.movie_thumb);
                return (
                  <div key={item.id} className="group relative">
                    <Link href={`/phim/${item.movie_slug}`} className="block">
                      {/* Poster */}
                      <div className="relative aspect-[2/3] rounded-xl overflow-hidden bg-white/5 mb-2">
                        <Image
                          src={thumb}
                          alt={item.movie_name}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 17vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                          unoptimized
                        />

                        {/* Badges */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {item.movie_quality && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F6C453] text-black leading-none">
                              {item.movie_quality}
                            </span>
                          )}
                        </div>

                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                          <div className="w-10 h-10 rounded-full bg-[#F6C453] flex items-center justify-center">
                            <Play className="w-4 h-4 fill-black text-black ml-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Title */}
                      <p className="text-sm text-white font-medium line-clamp-2 leading-snug group-hover:text-[#F6C453] transition-colors">
                        {item.movie_name}
                      </p>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {[item.movie_year, typeLabel(item.movie_type)]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </Link>

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemove(item)}
                      title="Xóa khỏi yêu thích"
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80 text-gray-300 hover:text-white"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-10">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-sm text-gray-400">
                  Trang <span className="text-white font-medium">{page}</span> / {totalPages}
                </span>

                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </main>
  );
}
