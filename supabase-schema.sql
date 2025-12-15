-- Database Schema cho Movie Web App
-- Chạy SQL này trong Supabase Dashboard > SQL Editor

-- 1. Bảng Phim yêu thích (Favorites)
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  movie_slug TEXT NOT NULL,
  movie_name TEXT NOT NULL,
  movie_thumb TEXT,
  movie_poster TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, movie_slug)
);

-- 2. Bảng Lịch sử xem (Watch History)
CREATE TABLE IF NOT EXISTS public.watch_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  movie_slug TEXT NOT NULL,
  movie_name TEXT NOT NULL,
  movie_thumb TEXT,
  movie_poster TEXT,
  episode_slug TEXT,
  episode_name TEXT,
  watch_time INTEGER DEFAULT 0, -- Thời gian đã xem (giây)
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, movie_slug, episode_slug)
);

-- 3. Bảng Đánh giá phim (Ratings)
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  movie_slug TEXT NOT NULL,
  movie_name TEXT NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, movie_slug)
);

-- 4. Bảng Danh sách phát (Playlists)
CREATE TABLE IF NOT EXISTS public.playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Bảng Phim trong danh sách phát (Playlist Items)
CREATE TABLE IF NOT EXISTS public.playlist_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
  movie_slug TEXT NOT NULL,
  movie_name TEXT NOT NULL,
  movie_thumb TEXT,
  movie_poster TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(playlist_id, movie_slug)
);

-- 6. Bảng Phim đang xem (Currently Watching)
CREATE TABLE IF NOT EXISTS public.currently_watching (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  movie_slug TEXT NOT NULL,
  movie_name TEXT NOT NULL,
  movie_thumb TEXT,
  movie_poster TEXT,
  episode_slug TEXT,
  episode_name TEXT,
  watch_time INTEGER DEFAULT 0,
  total_duration INTEGER DEFAULT 0,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, movie_slug)
);

-- Tạo indexes để tối ưu query
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_movie_slug ON public.favorites(movie_slug);
CREATE INDEX IF NOT EXISTS idx_watch_history_user_id ON public.watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_movie_slug ON public.watch_history(movie_slug);
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON public.ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_movie_slug ON public.ratings(movie_slug);
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON public.playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON public.playlist_items(playlist_id);
CREATE INDEX IF NOT EXISTS idx_currently_watching_user_id ON public.currently_watching(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.currently_watching ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users chỉ có thể xem/sửa dữ liệu của chính họ
-- Favorites
CREATE POLICY "Users can view their own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- Watch History
CREATE POLICY "Users can view their own watch history"
  ON public.watch_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own watch history"
  ON public.watch_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watch history"
  ON public.watch_history FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own watch history"
  ON public.watch_history FOR DELETE
  USING (auth.uid() = user_id);

-- Ratings
CREATE POLICY "Users can view all ratings"
  ON public.ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own ratings"
  ON public.ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ratings"
  ON public.ratings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ratings"
  ON public.ratings FOR DELETE
  USING (auth.uid() = user_id);

-- Playlists
CREATE POLICY "Users can view public playlists or their own"
  ON public.playlists FOR SELECT
  USING (is_public = true OR auth.uid() = user_id);

CREATE POLICY "Users can insert their own playlists"
  ON public.playlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlists"
  ON public.playlists FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playlists"
  ON public.playlists FOR DELETE
  USING (auth.uid() = user_id);

-- Playlist Items
CREATE POLICY "Users can view items of accessible playlists"
  ON public.playlist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_items.playlist_id
      AND (playlists.is_public = true OR playlists.user_id = auth.uid())
    )
  );

CREATE POLICY "Users can insert items to their own playlists"
  ON public.playlist_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_items.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items from their own playlists"
  ON public.playlist_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.playlists
      WHERE playlists.id = playlist_items.playlist_id
      AND playlists.user_id = auth.uid()
    )
  );

-- Currently Watching
CREATE POLICY "Users can view their own currently watching"
  ON public.currently_watching FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own currently watching"
  ON public.currently_watching FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own currently watching"
  ON public.currently_watching FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own currently watching"
  ON public.currently_watching FOR DELETE
  USING (auth.uid() = user_id);





