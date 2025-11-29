# 🎬 CineVerse - Website Xem Phim Trực Tuyến

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

## 🚀 Công nghệ sử dụng

- **Framework:** Next.js 16 (App Router)
- **Styling:** Tailwind CSS 4
- **UI Components:** shadcn/ui
- **Icons:** Lucide React
- **Theme:** next-themes
- **Package Manager:** pnpm
- **Language:** TypeScript

## 📦 Cài đặt

```bash
# Clone repository
git clone <repository-url>
cd movie-web

# Cài đặt dependencies
pnpm install

# Chạy development server
pnpm dev
```

Mở [http://localhost:3000](http://localhost:3000) trong trình duyệt.

## 📁 Cấu trúc thư mục

```
src/
├── app/
│   ├── globals.css      # Global styles & theme variables
│   ├── layout.tsx       # Root layout với ThemeProvider
│   └── page.tsx         # Trang chủ
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── header.tsx       # Navigation header
│   ├── footer.tsx       # Footer
│   ├── hero-section.tsx # Hero section với phim nổi bật
│   ├── movie-card.tsx   # Card hiển thị phim
│   ├── movie-section.tsx # Section chứa danh sách phim
│   ├── genre-section.tsx # Bộ lọc thể loại
│   ├── theme-provider.tsx # Provider cho dark mode
│   └── theme-toggle.tsx  # Nút chuyển đổi theme
└── lib/
    ├── movies.ts        # Dữ liệu phim mẫu
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
