-- Thêm cột user_display_name vào bảng comments
-- Chạy SQL này trong Supabase Dashboard > SQL Editor để thêm cột lưu tên user

ALTER TABLE public.comments 
  ADD COLUMN IF NOT EXISTS user_display_name TEXT;


