-- Fix RLS Policy cho bảng Comments
-- Chạy SQL này trong Supabase Dashboard > SQL Editor để sửa lỗi RLS policy

-- 1. Xóa TẤT CẢ các policies cũ của bảng comments (bao gồm tất cả các tên có thể có)
DROP POLICY IF EXISTS "Users can view all comments" ON public.comments;
DROP POLICY IF EXISTS "Anyone can view all comments" ON public.comments;
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.comments;
DROP POLICY IF EXISTS "Anyone can insert comments (authenticated or anonymous)" ON public.comments;
DROP POLICY IF EXISTS "Anyone can insert comments" ON public.comments;
DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;

-- 2. Tạo lại các policies đúng cách

-- Policy SELECT: Mọi người có thể xem tất cả bình luận
CREATE POLICY "Anyone can view all comments"
  ON public.comments FOR SELECT
  USING (true);

-- Policy INSERT: Cho phép mọi người insert bình luận
-- - Nếu user_id IS NULL: cho phép (bình luận ẩn danh)
-- - Nếu user_id IS NOT NULL: chỉ cho phép nếu auth.uid() = user_id
CREATE POLICY "Anyone can insert comments"
  ON public.comments FOR INSERT
  WITH CHECK (
    user_id IS NULL OR 
    (user_id IS NOT NULL AND auth.uid() = user_id)
  );

-- Policy UPDATE: Chỉ user đã đăng nhập mới có thể update bình luận của mình
CREATE POLICY "Users can update their own comments"
  ON public.comments FOR UPDATE
  USING (auth.uid() = user_id AND user_id IS NOT NULL)
  WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- Policy DELETE: 
-- - User đã đăng nhập có thể xóa comment của mình
-- - Hoặc comment ẩn danh có thể được xóa trong vòng 15 phút sau khi tạo
CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE
  USING (
    (auth.uid() = user_id AND user_id IS NOT NULL) OR
    (user_id IS NULL AND created_at > NOW() - INTERVAL '15 minutes')
  );

