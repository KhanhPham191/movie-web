-- Fix: Thêm cột user_display_name vào bảng comments
-- Chạy SQL này trong Supabase Dashboard > SQL Editor

-- 1. Kiểm tra xem cột đã tồn tại chưa
DO $$ 
BEGIN
  -- Kiểm tra và thêm cột nếu chưa có
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'comments' 
      AND column_name = 'user_display_name'
  ) THEN
    ALTER TABLE public.comments 
      ADD COLUMN user_display_name TEXT;
    
    RAISE NOTICE 'Đã thêm cột user_display_name thành công';
  ELSE
    RAISE NOTICE 'Cột user_display_name đã tồn tại';
  END IF;
END $$;

-- 2. Kiểm tra lại để xác nhận
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'comments' 
  AND column_name IN ('user_display_name', 'anonymous_name', 'user_id')
ORDER BY column_name;



