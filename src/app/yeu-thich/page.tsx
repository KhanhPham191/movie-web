"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getFavorites, removeFromFavorites, type Favorite } from "@/lib/supabase/movies";
import { getImageUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Heart, Trash2 } from "lucide-react";

export default function FavoritesPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/dang-nhap");
    } else if (user) {
      loadFavorites();
    }
  }, [user, authLoading, router]);

  const loadFavorites = async () => {
    setIsLoading(true);
    const { data, error } = await getFavorites();
    if (error) {
    } else {
      setFavorites(data || []);
    }
    setIsLoading(false);
  };

  const handleRemove = async (movieSlug: string, id: string) => {
    setRemovingId(id);
    const { error } = await removeFromFavorites(movieSlug);
    if (!error) {
      setFavorites(favorites.filter((f) => f.id !== id));
    }
    setRemovingId(null);
  };

  if (authLoading || isLoading) {
    return (
      <main className="min-h-screen bg-[#05050a]">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] pt-20">
          <div className="text-white">Đang tải...</div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#05050a]">
      <Header />
      <div className="container mx-auto px-4 py-20 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Danh sách yêu thích</h1>
          <p className="text-gray-400">
            {favorites.length > 0 
              ? `Bạn có ${favorites.length} phim trong danh sách yêu thích`
              : "Chưa có phim nào trong danh sách yêu thích"}
          </p>
        </div>

        {favorites.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-4">Danh sách yêu thích trống</p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-[#F6C453] to-[#D3A13A] hover:from-[#F6C453]/90 hover:to-[#D3A13A]/90 text-white">
                Khám phá phim
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {favorites.map((favorite) => (
              <div
                key={favorite.id}
                className="group relative bg-[#0f0f0f]/50 rounded-lg overflow-hidden hover:bg-[#0f0f0f]/80 transition-all duration-300"
              >
                <Link href={`/phim/${favorite.movie_slug}`}>
                  <div className="relative aspect-[2/3] overflow-hidden">
                    <Image
                      src={getImageUrl(favorite.movie_poster || favorite.movie_thumb || "")}
                      alt={favorite.movie_name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
                
                {/* Remove button */}
                <button
                  onClick={() => handleRemove(favorite.movie_slug, favorite.id)}
                  disabled={removingId === favorite.id}
                  className="absolute top-2 right-2 p-2 bg-black/60 hover:bg-red-600/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  title="Xóa khỏi yêu thích"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>

                {/* Title */}
                <div className="p-3">
                  <Link href={`/phim/${favorite.movie_slug}`}>
                    <h3 className="text-sm font-semibold text-white line-clamp-2 hover:text-[#F6C453] transition-colors">
                      {favorite.movie_name}
                    </h3>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}

