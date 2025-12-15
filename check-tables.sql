-- Script kiểm tra các bảng đã được tạo chưa
-- Chạy trong Supabase Dashboard > SQL Editor

-- Kiểm tra các bảng
SELECT 
  table_name,
  table_schema
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'favorites',
    'watch_history',
    'ratings',
    'playlists',
    'playlist_items',
    'currently_watching'
  )
ORDER BY table_name;

-- Kiểm tra RLS đã được bật chưa
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'favorites',
    'watch_history',
    'ratings',
    'playlists',
    'playlist_items',
    'currently_watching'
  )
ORDER BY tablename;

-- Kiểm tra Policies đã được tạo chưa
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'favorites',
    'watch_history',
    'ratings',
    'playlists',
    'playlist_items',
    'currently_watching'
  )
ORDER BY tablename, policyname;






