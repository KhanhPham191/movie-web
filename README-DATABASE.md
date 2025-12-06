# Hướng dẫn Setup Database cho Movie Web

## Bước 1: Chạy SQL Schema

1. Vào [Supabase Dashboard](https://supabase.com/dashboard/project/mfvyrwsuxchwvmpuwjsr)
2. Vào **SQL Editor** (menu bên trái)
3. Click **"New query"**
4. Copy toàn bộ nội dung file `supabase-schema.sql`
5. Paste vào SQL Editor
6. Click **"Run"** hoặc nhấn `Ctrl+Enter` (Windows) / `Cmd+Enter` (Mac)

## Bước 2: Kiểm tra Tables đã tạo

Sau khi chạy SQL, vào **Table Editor** để kiểm tra các bảng đã được tạo:

- ✅ `favorites` - Danh sách phim yêu thích
- ✅ `watch_history` - Lịch sử xem phim
- ✅ `ratings` - Đánh giá phim
- ✅ `playlists` - Danh sách phát
- ✅ `playlist_items` - Phim trong danh sách phát
- ✅ `currently_watching` - Phim đang xem

## Bước 3: Kiểm tra Row Level Security (RLS)

RLS đã được bật tự động và các policies đã được tạo. Điều này đảm bảo:
- Users chỉ có thể xem/sửa dữ liệu của chính họ
- Ratings có thể được xem bởi tất cả users
- Playlists công khai có thể được xem bởi tất cả users

## Các tính năng đã được tích hợp

### 1. Danh sách phim yêu thích
- Thêm/xóa phim yêu thích từ trang chi tiết phim
- Xem danh sách tại `/tai-khoan/danh-sach` (tab "Yêu thích")

### 2. Lịch sử xem phim
- Tự động lưu khi xem phim
- Xem tại `/tai-khoan/danh-sach` (tab "Lịch sử")

### 3. Đánh giá phim
- Đánh giá từ 1-5 sao từ trang chi tiết phim
- Xem đánh giá của người dùng khác

### 4. Danh sách phát tùy chỉnh
- Tạo danh sách phát mới
- Thêm phim vào danh sách
- Quản lý danh sách tại `/tai-khoan/danh-sach` (tab "Danh sách phát")

### 5. Phim đang xem
- Tự động lưu khi xem phim
- Hiển thị tiến độ xem
- Xem tại `/tai-khoan/danh-sach` (tab "Đang xem")

## Troubleshooting

### Lỗi: "relation does not exist"
- Đảm bảo đã chạy SQL schema đầy đủ
- Kiểm tra lại trong Table Editor xem các bảng đã được tạo chưa

### Lỗi: "permission denied"
- Kiểm tra RLS policies đã được tạo chưa
- Đảm bảo user đã đăng nhập

### Không lưu được dữ liệu
- Kiểm tra user đã đăng nhập chưa
- Kiểm tra console browser để xem lỗi chi tiết
- Đảm bảo RLS policies đã được tạo đúng

## Cấu trúc Database

```
favorites
├── id (UUID)
├── user_id (UUID) → auth.users
├── movie_slug (TEXT)
├── movie_name (TEXT)
├── movie_thumb (TEXT)
├── movie_poster (TEXT)
└── created_at (TIMESTAMP)

watch_history
├── id (UUID)
├── user_id (UUID) → auth.users
├── movie_slug (TEXT)
├── movie_name (TEXT)
├── episode_slug (TEXT)
├── episode_name (TEXT)
├── watch_time (INTEGER)
└── last_watched_at (TIMESTAMP)

ratings
├── id (UUID)
├── user_id (UUID) → auth.users
├── movie_slug (TEXT)
├── movie_name (TEXT)
├── rating (INTEGER 1-5)
├── comment (TEXT)
└── created_at (TIMESTAMP)

playlists
├── id (UUID)
├── user_id (UUID) → auth.users
├── name (TEXT)
├── description (TEXT)
├── is_public (BOOLEAN)
└── created_at (TIMESTAMP)

playlist_items
├── id (UUID)
├── playlist_id (UUID) → playlists
├── movie_slug (TEXT)
├── movie_name (TEXT)
├── movie_thumb (TEXT)
└── movie_poster (TEXT)

currently_watching
├── id (UUID)
├── user_id (UUID) → auth.users
├── movie_slug (TEXT)
├── movie_name (TEXT)
├── episode_slug (TEXT)
├── watch_time (INTEGER)
├── total_duration (INTEGER)
└── last_watched_at (TIMESTAMP)
```

## API Functions

Tất cả các functions để tương tác với database đã được tạo trong:
`src/lib/supabase/movies.ts`

Bạn có thể import và sử dụng trong các components:

```typescript
import {
  addToFavorites,
  removeFromFavorites,
  isFavorite,
  getFavorites,
  addToWatchHistory,
  getWatchHistory,
  addRating,
  getUserRating,
  // ... và nhiều functions khác
} from "@/lib/supabase/movies";
```
