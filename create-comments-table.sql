-- Tạo bảng Comments với hỗ trợ bình luận ẩn danh
-- Chạy SQL này trong Supabase Dashboard > SQL Editor

-- 1. Tạo bảng Comments
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Cho phép NULL cho bình luận ẩn danh
  movie_slug TEXT NOT NULL,
  movie_name TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE, -- Để hỗ trợ reply comment
  anonymous_name TEXT, -- Tên ngẫu nhiên cho bình luận ẩn danh (ví dụ: UserMov123)
  user_display_name TEXT, -- Tên hiển thị của user khi tạo comment
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Tạo indexes để tối ưu query
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_movie_slug ON public.comments(movie_slug);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 4. Xóa các policies cũ nếu có (để tránh conflict)
DROP POLICY IF EXISTS "Users can view all comments" ON public.comments;
DROP POLICY IF EXISTS "Anyone can view all comments" ON public.comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.comments;
DROP POLICY IF EXISTS "Anyone can insert comments (authenticated or anonymous)" ON public.comments;
DROP POLICY IF EXISTS "Anyone can insert comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

-- 5. RLS Policies cho Comments

-- Policy: Mọi người có thể xem tất cả bình luận
CREATE POLICY "Anyone can view all comments"
  ON public.comments FOR SELECT
  USING (true);

-- Policy: Cho phép mọi người insert bình luận (đã đăng nhập hoặc ẩn danh)
CREATE POLICY "Anyone can insert comments"
  ON public.comments FOR INSERT
  WITH CHECK (
    user_id IS NULL OR 
    (user_id IS NOT NULL AND auth.uid() = user_id)
  );

-- Policy: Chỉ user đã đăng nhập mới có thể update bình luận của mình
CREATE POLICY "Users can update their own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id AND user_id IS NOT NULL)
  WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- Policy: 
-- - User đã đăng nhập có thể xóa comment của mình
-- - Hoặc comment ẩn danh có thể được xóa trong vòng 15 phút sau khi tạo
CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE
  USING (
    (auth.uid() = user_id AND user_id IS NOT NULL) OR
    (user_id IS NULL AND created_at > NOW() - INTERVAL '15 minutes')
  );

