-- Migration: Allow anonymous comments
-- Chạy SQL này trong Supabase Dashboard > SQL Editor để cho phép bình luận ẩn danh
-- LƯU Ý: Nếu bảng comments chưa tồn tại, hãy chạy file create-comments-table.sql trước

-- Kiểm tra và tạo bảng nếu chưa tồn tại
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  movie_slug TEXT NOT NULL,
  movie_name TEXT NOT NULL,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  anonymous_name TEXT,
  user_display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 1. Xóa foreign key constraint cũ (nếu có)
ALTER TABLE public.comments 
  DROP CONSTRAINT IF EXISTS comments_user_id_fkey;

-- 2. Cho phép user_id NULL (nếu bảng đã tồn tại)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'comments' 
    AND column_name = 'user_id'
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.comments ALTER COLUMN user_id DROP NOT NULL;
  END IF;
END $$;

-- 3. Tạo lại foreign key constraint với ON DELETE SET NULL cho anonymous comments
ALTER TABLE public.comments 
  ADD CONSTRAINT comments_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- 4. Xóa policy cũ
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.comments;

-- 5. Tạo policy mới cho phép insert anonymous comments
CREATE POLICY "Anyone can insert comments (authenticated or anonymous)"
  ON public.comments FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- 6. Cập nhật policy update để chỉ cho phép user đã đăng nhập sửa comment của mình
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
CREATE POLICY "Users can update their own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id AND user_id IS NOT NULL);

-- 7. Cập nhật policy delete: 
-- - User đã đăng nhập có thể xóa comment của mình
-- - Hoặc comment ẩn danh có thể được xóa trong vòng 15 phút sau khi tạo
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE
  USING (
    (auth.uid() = user_id AND user_id IS NOT NULL) OR
    (user_id IS NULL AND created_at > NOW() - INTERVAL '15 minutes')
  );

-- 8. Thêm cột anonymous_name để lưu tên ngẫu nhiên cho bình luận ẩn danh
ALTER TABLE public.comments 
  ADD COLUMN IF NOT EXISTS anonymous_name TEXT;

-- 9. Thêm cột user_display_name để lưu tên hiển thị của user
ALTER TABLE public.comments 
  ADD COLUMN IF NOT EXISTS user_display_name TEXT;

-- 10. Tạo indexes nếu chưa có
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_movie_slug ON public.comments(movie_slug);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);

-- 11. Enable RLS nếu chưa enable
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;


