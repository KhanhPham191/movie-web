-- Thêm cột user_display_name vào bảng comments
-- Copy và chạy SQL này trong Supabase Dashboard > SQL Editor

ALTER TABLE public.comments 
  ADD COLUMN IF NOT EXISTS user_display_name TEXT;

-- Kiểm tra xem cột đã được thêm chưa
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'comments' 
  AND column_name = 'user_display_name';



