# MovPey - Requirements & Feature List

Tài liệu này mô tả yêu cầu và các tính năng đang có của source code `movie-web` theo implementation hiện tại.

## 1) Mục tiêu sản phẩm

- Xây dựng website xem phim online tối ưu cho người dùng Việt Nam.
- Lấy dữ liệu phim từ OPhim API, hiển thị theo trang chủ, thể loại, quốc gia, danh sách và tìm kiếm.
- Hỗ trợ xem tập phim trực tuyến, lưu trạng thái người dùng (đăng nhập, yêu thích, lịch sử xem), và bình luận.
- Tối ưu SEO, hiệu năng và trải nghiệm đa thiết bị.

## 2) Phạm vi chức năng (Functional Requirements)

### 2.1 Duyệt và khám phá nội dung

- Trang chủ có nhiều section phim (hero, top, theo quốc gia/thể loại).
- Trang chi tiết phim: thông tin phim, tập, gợi ý phim liên quan, các phần khác trong series.
- Trang xem phim theo tập với hỗ trợ phát luồng HLS (`hls.js`).
- Trang danh mục theo:
  - Thể loại: `/the-loai/[slug]`
  - Quốc gia: `/quoc-gia/[slug]`
  - Danh sách: `/danh-sach/[slug]`
- Tìm kiếm phim: `/tim-kiem` (hỗ trợ lọc và phân trang).

### 2.2 Tài khoản và xác thực

- Có trang đăng nhập, đăng ký, quên mật khẩu, đặt lại mật khẩu, tài khoản cá nhân.
- Hệ thống auth phía client đang dùng `AuthContext` + `localStorage`.
- API auth server-side tồn tại song song (JWT + cookie HttpOnly + MongoDB):
  - `/movpey/auth/login`
  - `/movpey/auth/register`
  - `/movpey/auth/me`
  - `/movpey/auth/logout`

### 2.3 Tính năng cá nhân hóa

- Danh sách yêu thích:
  - Lấy danh sách yêu thích, thêm phim yêu thích, xóa theo slug.
- Lịch sử xem:
  - Lưu tiến trình xem theo phim/tập, có trạng thái đã xem gần xong.
  - Lấy danh sách lịch sử xem gần nhất.
- Bình luận:
  - Bình luận theo phim.
  - Trả lời bình luận (parent/child).
  - Hỗ trợ user đăng nhập hoặc ẩn danh.

### 2.4 SEO và analytics

- Metadata động cho các trang chính (title, description, Open Graph, Twitter card, canonical).
- Structured Data (JSON-LD): website, organization, movie, breadcrumb, FAQ.
- Google Analytics tracking.
- Thiết lập robots/indexing cho máy tìm kiếm.

## 3) Yêu cầu phi chức năng (Non-functional Requirements)

- Hiệu năng:
  - Dùng ISR/revalidate ở nhiều trang để giảm tải API.
  - Caching request phía server/client cho call OPhim.
  - Fallback OPhim endpoint khi nguồn chính lỗi.
- Responsive:
  - UI tương thích mobile/tablet/desktop.
- Trải nghiệm:
  - Giao diện dark-first, animation và skeleton loading.
  - Chuyển trang mượt (page transition), splash overlay.
- Độ tin cậy:
  - Xử lý lỗi API có fallback và thông báo phù hợp.
- Bảo mật:
  - API auth server dùng `bcryptjs` hash password.
  - JWT lưu trong cookie `HttpOnly` (khi dùng flow server auth).

## 4) Yêu cầu kỹ thuật (Technical Requirements)

### 4.1 Công nghệ chính

- `Next.js 16` (App Router)
- `React 19`, `TypeScript`
- `Tailwind CSS 4`
- `Mongoose` + MongoDB
- `jsonwebtoken`, `bcryptjs`
- `hls.js`

### 4.2 Nguồn dữ liệu phim

- Nguồn chính: OPhim API (`ophim1.com`), có fallback sang domain khác.
- Các nhóm API sử dụng:
  - Lấy danh sách phim theo thể loại/quốc gia/danh sách.
  - Tìm kiếm phim.
  - Lấy chi tiết phim và danh sách tập.

### 4.3 Các route chính

- UI pages:
  - `/`
  - `/phim/[slug]`
  - `/xem-phim/[slug]/[episode]`
  - `/tim-kiem`
  - `/the-loai/[slug]`
  - `/quoc-gia/[slug]`
  - `/danh-sach/[slug]`
  - `/dang-nhap`, `/dang-ky`, `/tai-khoan`, `/yeu-thich`
- API routes:
  - `/movpey/ophim`
  - `/movpey/auth/*`
  - `/movpey/favorites/*`
  - `/movpey/watch-history/*`
  - `/movpey/comments`

## 5) Biến môi trường tối thiểu đề xuất

- `NEXT_PUBLIC_SITE_URL` (URL chính thức của site)
- `JWT_SECRET` (bắt buộc nếu dùng auth API server-side)
- `MONGODB_URI` (bắt buộc cho các API MongoDB)
- `NEXT_PUBLIC_GA_ID` (tùy chọn, cho Google Analytics)
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` (tùy chọn, cho Search Console)

## 6) Danh sách tính năng theo mức độ

### Core (đã có)

- Xem danh sách phim theo nhiều tiêu chí.
- Xem chi tiết phim và danh sách tập.
- Phát phim online.
- Tìm kiếm phim.
- Metadata SEO cơ bản + nâng cao.

### User features (đã có)

- Đăng nhập/đăng ký.
- Quản lý thông tin tài khoản cơ bản.
- Thêm/xóa yêu thích.
- Lưu lịch sử xem và tiến trình.
- Bình luận và trả lời bình luận.

### Vận hành/tối ưu (đã có)

- ISR + request deduplication/caching.
- API fallback khi nguồn phim lỗi.
- Theo dõi pageview qua GA.

## 7) Lưu ý quan trọng

- Trong code hiện tại đang tồn tại song song 2 hướng auth:
  - Client local auth (`localStorage`) trong `AuthContext`.
  - Server auth với MongoDB + JWT cookie trong API routes.
- Khi phát triển tiếp, nên thống nhất về một hướng auth chính để tránh lệch hành vi giữa UI và API.

