"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getFavorites,
  getWatchHistory,
  getCurrentlyWatching,
  getPlaylists,
  createPlaylist,
  deletePlaylist,
  getPlaylistItems,
  removeFromPlaylist,
  type Favorite,
  type WatchHistory,
  type CurrentlyWatching,
  type Playlist,
  type PlaylistItem,
} from "@/lib/supabase/movies";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Heart, Clock, Play, Plus, Trash2, X } from "lucide-react";
import { getImageUrl } from "@/lib/api";

export default function MyListsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"favorites" | "history" | "watching" | "playlists">("favorites");
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchHistory[]>([]);
  const [currentlyWatching, setCurrentlyWatching] = useState<CurrentlyWatching[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [playlistItems, setPlaylistItems] = useState<PlaylistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreatePlaylist, setShowCreatePlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [newPlaylistDesc, setNewPlaylistDesc] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/dang-nhap");
    } else if (user) {
      loadData();
    }
  }, [user, authLoading, router, activeTab]);

  const loadData = async () => {
    setLoading(true);
    if (activeTab === "favorites") {
      const { data } = await getFavorites();
      if (data) setFavorites(data);
    } else if (activeTab === "history") {
      const { data } = await getWatchHistory();
      if (data) setWatchHistory(data);
    } else if (activeTab === "watching") {
      const { data } = await getCurrentlyWatching();
      if (data) setCurrentlyWatching(data);
    } else if (activeTab === "playlists") {
      const { data } = await getPlaylists();
      if (data) setPlaylists(data);
    }
    setLoading(false);
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    setLoading(true);
    const { data, error } = await createPlaylist(newPlaylistName, newPlaylistDesc);
    if (data && !error) {
      setPlaylists([...playlists, data]);
      setNewPlaylistName("");
      setNewPlaylistDesc("");
      setShowCreatePlaylist(false);
    }
    setLoading(false);
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa danh sách này?")) return;

    setLoading(true);
    await deletePlaylist(playlistId);
    setPlaylists(playlists.filter((p) => p.id !== playlistId));
    if (selectedPlaylist?.id === playlistId) {
      setSelectedPlaylist(null);
      setPlaylistItems([]);
    }
    setLoading(false);
  };

  const handleViewPlaylist = async (playlist: Playlist) => {
    setSelectedPlaylist(playlist);
    const { data } = await getPlaylistItems(playlist.id);
    if (data) setPlaylistItems(data);
  };

  const handleRemoveFromPlaylist = async (movieSlug: string) => {
    if (!selectedPlaylist) return;

    setLoading(true);
    await removeFromPlaylist(selectedPlaylist.id, movieSlug);
    setPlaylistItems(playlistItems.filter((item) => item.movie_slug !== movieSlug));
    setLoading(false);
  };

  if (authLoading) {
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

  if (!user) return null;

  const tabs = [
    { id: "favorites", label: "Yêu thích", icon: Heart },
    { id: "history", label: "Lịch sử", icon: Clock },
    { id: "watching", label: "Đang xem", icon: Play },
    { id: "playlists", label: "Danh sách phát", icon: Plus },
  ];

  return (
    <main className="min-h-screen bg-[#05050a]">
      <Header />
      <div className="container mx-auto px-4 py-20 max-w-7xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white"
          >
            ← Quay lại
          </Button>
        </div>

        <h1 className="text-3xl font-bold text-white mb-8">Danh sách của tôi</h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-[#fb743E] text-[#fb743E]"
                    : "border-transparent text-gray-400 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        {activeTab === "favorites" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {favorites.map((fav) => (
              <Link key={fav.id} href={`/phim/${fav.movie_slug}`}>
                <div className="group relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-all">
                  {fav.movie_poster || fav.movie_thumb ? (
                    <Image
                      src={getImageUrl(fav.movie_poster || fav.movie_thumb || "")}
                      alt={fav.movie_name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <Heart className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-white text-sm font-semibold line-clamp-2">
                        {fav.movie_name}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {favorites.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                Chưa có phim yêu thích nào
              </div>
            )}
          </div>
        )}

        {activeTab === "history" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {watchHistory.map((item) => (
              <Link key={item.id} href={`/phim/${item.movie_slug}`}>
                <div className="group relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-all">
                  {item.movie_poster || item.movie_thumb ? (
                    <Image
                      src={getImageUrl(item.movie_poster || item.movie_thumb || "")}
                      alt={item.movie_name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <Clock className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-white text-sm font-semibold line-clamp-2">
                        {item.movie_name}
                      </p>
                      {item.episode_name && (
                        <p className="text-gray-400 text-xs mt-1">{item.episode_name}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {watchHistory.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                Chưa có lịch sử xem
              </div>
            )}
          </div>
        )}

        {activeTab === "watching" && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {currentlyWatching.map((item) => (
              <Link key={item.id} href={`/phim/${item.movie_slug}`}>
                <div className="group relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-all">
                  {item.movie_poster || item.movie_thumb ? (
                    <>
                      <Image
                        src={getImageUrl(item.movie_poster || item.movie_thumb || "")}
                        alt={item.movie_name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform"
                      />
                      {item.total_duration > 0 && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800">
                          <div
                            className="h-full bg-[#fb743E]"
                            style={{
                              width: `${(item.watch_time / item.total_duration) * 100}%`,
                            }}
                          />
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                      <Play className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-0 left-0 right-0 p-2">
                      <p className="text-white text-sm font-semibold line-clamp-2">
                        {item.movie_name}
                      </p>
                      {item.episode_name && (
                        <p className="text-gray-400 text-xs mt-1">{item.episode_name}</p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
            {currentlyWatching.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-400">
                Chưa có phim đang xem
              </div>
            )}
          </div>
        )}

        {activeTab === "playlists" && (
          <div className="space-y-6">
            {!selectedPlaylist ? (
              <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-white">Danh sách phát của tôi</h2>
                  <Button
                    onClick={() => setShowCreatePlaylist(true)}
                    className="bg-[#fb743E] hover:bg-[#fb743E]/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Tạo danh sách mới
                  </Button>
                </div>

                {showCreatePlaylist && (
                  <Card className="bg-[#0f0f0f]/95 backdrop-blur border-gray-800 mb-6">
                    <CardHeader>
                      <CardTitle className="text-white">Tạo danh sách mới</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <label className="text-sm text-gray-300 mb-2 block">Tên danh sách</label>
                        <Input
                          value={newPlaylistName}
                          onChange={(e) => setNewPlaylistName(e.target.value)}
                          placeholder="Nhập tên danh sách"
                          className="bg-white/5 border-gray-700 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-300 mb-2 block">Mô tả (tùy chọn)</label>
                        <Input
                          value={newPlaylistDesc}
                          onChange={(e) => setNewPlaylistDesc(e.target.value)}
                          placeholder="Nhập mô tả"
                          className="bg-white/5 border-gray-700 text-white"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handleCreatePlaylist}
                          disabled={loading || !newPlaylistName.trim()}
                          className="bg-[#fb743E] hover:bg-[#fb743E]/90"
                        >
                          Tạo
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setShowCreatePlaylist(false);
                            setNewPlaylistName("");
                            setNewPlaylistDesc("");
                          }}
                        >
                          Hủy
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {playlists.map((playlist) => (
                    <Card
                      key={playlist.id}
                      className="bg-[#0f0f0f]/95 backdrop-blur border-gray-800 cursor-pointer hover:border-[#fb743E]/50 transition-colors"
                      onClick={() => handleViewPlaylist(playlist)}
                    >
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-white">{playlist.name}</CardTitle>
                            {playlist.description && (
                              <CardDescription className="text-gray-400 mt-1">
                                {playlist.description}
                              </CardDescription>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePlaylist(playlist.id);
                            }}
                            className="text-gray-400 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                  {playlists.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-400">
                      Chưa có danh sách phát nào
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div>
                <div className="flex items-center gap-4 mb-6">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setSelectedPlaylist(null);
                      setPlaylistItems([]);
                    }}
                    className="text-gray-400 hover:text-white"
                  >
                    ← Quay lại
                  </Button>
                  <div>
                    <h2 className="text-2xl font-semibold text-white">{selectedPlaylist.name}</h2>
                    {selectedPlaylist.description && (
                      <p className="text-gray-400 mt-1">{selectedPlaylist.description}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {playlistItems.map((item) => (
                    <div key={item.id} className="group relative">
                      <Link href={`/phim/${item.movie_slug}`}>
                        <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-white/5 hover:bg-white/10 transition-all">
                          {item.movie_poster || item.movie_thumb ? (
                            <Image
                              src={getImageUrl(item.movie_poster || item.movie_thumb || "")}
                              alt={item.movie_name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-500">
                              <Play className="w-12 h-12" />
                            </div>
                          )}
                        </div>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveFromPlaylist(item.movie_slug)}
                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-black/60 hover:bg-black/80 text-white"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <div className="mt-2">
                        <p className="text-white text-sm font-semibold line-clamp-2">
                          {item.movie_name}
                        </p>
                      </div>
                    </div>
                  ))}
                  {playlistItems.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-400">
                      Danh sách này chưa có phim nào
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      <Footer />
    </main>
  );
}

