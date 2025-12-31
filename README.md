# 🎬 Phim7.xyz - Website Xem Phim Trực Tuyến

Dự án web phim được xây dựng với công nghệ hiện đại, giao diện đẹp mắt với chế độ tối/sáng.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript)
![shadcn/ui](https://img.shields.io/badge/shadcn/ui-latest-000000?style=for-the-badge)

## ✨ Tính năng

- 🌙 **Dark/Light Mode** - Chuyển đổi chế độ tối/sáng mượt mà
- 🎨 **UI hiện đại** - Giao diện được thiết kế theo phong cách cinema
- 📱 **Responsive** - Tương thích với mọi kích thước màn hình
- ⚡ **Hiệu năng cao** - Được tối ưu với Next.js 16 và Turbopack
- 🎭 **Animation đẹp** - Hiệu ứng hover và chuyển động mượt mà
- 🔐 **Authentication** - Đăng nhập/đăng ký với Supabase Auth
- 👤 **Quản lý tài khoản** - Quản lý hồ sơ và cài đặt người dùng
- 🛡️ **Geo-blocking** - Chặn truy cập từ nước ngoài (chỉ cho phép Việt Nam)

## 🚀 Công nghệ sử dụng

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui
- **Icons:** Lucide React
- **Theme:** next-themes
- **Authentication:** Supabase Auth
- **Package Manager:** pnpm
- **Language:** TypeScript

## 📦 Cài đặt

```bash
# Clone repository
git clone <repository-url>
cd movie-web

# Cài đặt dependencies
pnpm install

# Cấu hình Supabase (xem bên dưới)
# Tạo file .env.local với các biến môi trường

# Chạy development server
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000) trong trình duyệt.

## 🔐 Cấu hình Supabase Authentication

Dự án sử dụng Supabase để quản lý authentication. Để thiết lập:

1. **Tạo tài khoản Supabase:**
   - Truy cập [https://supabase.com](https://supabase.com)
   - Đăng ký/đăng nhập và tạo project mới

2. **Lấy thông tin API:**
   - Vào Project Settings > API
   - Copy `Project URL` và `anon public` key

3. **Tạo file `.env.local`:**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   
   # Cấu hình chặn IP nước ngoài (tùy chọn)
   ENABLE_GEO_BLOCKING=true
   ALLOWED_COUNTRIES=VN
   ```

4. **Cấu hình Email Authentication trong Supabase:**
   - Vào Authentication > Providers
   - Bật Email provider
   - Cấu hình email templates (tùy chọn)

5. **Cấu hình Redirect URLs:**
   - Vào Authentication > URL Configuration
   - **Site URL:** `https://movpey.xyz` (hoặc `http://localhost:3000` cho development)
   - **Redirect URLs:** Thêm các URL sau:
     - `http://localhost:3000/auth/callback` (cho development)
     - `https://movpey.xyz/auth/callback` (cho production)
     - `https://www.movpey.xyz/auth/callback` (nếu có www subdomain)
   - **Lưu ý:** Code sẽ tự động sử dụng domain hiện tại (`window.location.origin`), nhưng Supabase cần được cấu hình để chấp nhận các redirect URLs này

## 🚀 Deploy lên Production

**⚠️ QUAN TRỌNG:** Trên production, bạn **PHẢI** set Environment Variables trong hosting platform:

### Vercel:
1. Vào **Settings** → **Environment Variables**
2. Thêm `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Redeploy** project

### Netlify:
1. Vào **Site configuration** → **Environment variables**
2. Thêm `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Redeploy** site

**Xem chi tiết trong file [DEPLOYMENT.md](./DEPLOYMENT.md)**

## 🛡️ Cấu hình Chặn IP Nước Ngoài

Dự án hỗ trợ tính năng chặn truy cập từ các quốc gia ngoài danh sách được phép. Tính năng này sử dụng:

- **Vercel Geolocation** (nếu deploy trên Vercel) - Miễn phí và chính xác
- **Cloudflare Geolocation** (nếu dùng Cloudflare) - Miễn phí và chính xác
- **API Fallback** (ip-api.com) - Chỉ dùng khi không có header từ hosting

### Cách bật tính năng:

1. **Thêm vào file `.env.local` (development):**
   ```env
   ENABLE_GEO_BLOCKING=true
   ALLOWED_COUNTRIES=VN
   ```

2. **Thêm vào Vercel Environment Variables (production):**
   - Vào **Settings** → **Environment Variables**
   - Thêm:
     - `ENABLE_GEO_BLOCKING` = `true`
     - `ALLOWED_COUNTRIES` = `VN` (hoặc `VN,LA,TH` nếu muốn cho phép nhiều quốc gia)
   - **Redeploy** project

### Cấu hình:

- **ENABLE_GEO_BLOCKING**: Bật/tắt tính năng (`true` hoặc `false`)
- **ALLOWED_COUNTRIES**: Danh sách mã quốc gia được phép, cách nhau bởi dấu phẩy
  - Ví dụ: `VN` (chỉ Việt Nam)
  - Ví dụ: `VN,LA,TH` (Việt Nam, Lào, Thái Lan)
  - Mã quốc gia theo chuẩn ISO 3166-1 alpha-2

### Lưu ý:

- Trong môi trường **development**, nếu không xác định được quốc gia, hệ thống sẽ **cho phép truy cập** (mặc định VN)
- Trong môi trường **production**, nếu không xác định được quốc gia, hệ thống sẽ **chặn truy cập**
- Các path sau sẽ **không bị chặn**: `/api/*`, `/auth/callback`, `/blocked`, `/_next/*`
- Người dùng bị chặn sẽ được redirect đến trang `/blocked` với thông báo rõ ràng

## 📁 Cấu trúc thư mục

```
src/
├── app/
│   ├── globals.css      # Global styles & theme variables
│   ├── layout.tsx       # Root layout với ThemeProvider & AuthProvider
│   ├── page.tsx         # Trang chủ
│   ├── dang-nhap/       # Trang đăng nhập
│   └── dang-ky/         # Trang đăng ký
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── header.tsx       # Navigation header với auth
│   ├── footer.tsx       # Footer
│   ├── hero-section.tsx # Hero section với phim nổi bật
│   ├── movie-card.tsx   # Card hiển thị phim
│   ├── movie-section.tsx # Section chứa danh sách phim
│   ├── genre-section.tsx # Bộ lọc thể loại
│   ├── theme-provider.tsx # Provider cho dark mode
│   └── theme-toggle.tsx  # Nút chuyển đổi theme
├── contexts/
│   └── auth-context.tsx # Auth context với Supabase
└── lib/
    ├── supabase/        # Supabase client & server config
    ├── api.ts           # API calls cho phim
    └── utils.ts         # Utility functions
```

## 🎨 Tùy chỉnh Theme

Theme được định nghĩa trong `src/app/globals.css` sử dụng CSS variables. Bạn có thể dễ dàng tùy chỉnh màu sắc:

```css
:root {
  --primary: oklch(0.55 0.2 30); /* Màu chủ đạo */
  --background: oklch(0.98 0.005 250); /* Màu nền */
  /* ... các biến khác */
}

.dark {
  --primary: oklch(0.7 0.18 50); /* Màu chủ đạo trong dark mode */
  --background: oklch(0.12 0.015 260); /* Màu nền dark */
  /* ... các biến khác */
}
```

## 📝 Scripts

```bash
pnpm dev      # Chạy development server
pnpm build    # Build production
pnpm start    # Chạy production server
pnpm lint     # Kiểm tra linting
```

## 🖼️ Screenshots

### Dark Mode
Giao diện mặc định với theme tối, màu accent amber/orange tạo cảm giác ấm áp như rạp chiếu phim.

### Light Mode
Chế độ sáng với giao diện clean, dễ đọc trong môi trường sáng.

## 📄 License

MIT License - Thoải mái sử dụng cho mục đích học tập và phát triển.

---

Made with ❤️ using Next.js & shadcn/ui
