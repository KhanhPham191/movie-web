# Hướng dẫn xác minh Google Search Console

## Bước 1: Đăng ký Google Search Console

1. Truy cập: https://search.google.com/search-console
2. Đăng nhập bằng tài khoản Google của bạn
3. Click vào **"Thêm thuộc tính"** (Add Property)

## Bước 2: Thêm website của bạn

Có 2 cách:

### Cách 1: URL prefix (Khuyến nghị)
- Chọn **"URL prefix"**
- Nhập URL website của bạn: `https://yourdomain.com` (ví dụ: `https://movpey.com`)
- Click **"Tiếp tục"**

### Cách 2: Domain
- Chọn **"Domain"**
- Nhập domain: `yourdomain.com` (không có https://)
- Click **"Tiếp tục"**

## Bước 3: Xác minh website

Google sẽ hiển thị các phương thức xác minh. Chọn **"HTML tag"**:

1. Bạn sẽ thấy một đoạn code như sau:
```html
<meta name="google-site-verification" content="ABC123xyz456..." />
```

2. **Copy phần code trong `content=""`** (ví dụ: `ABC123xyz456...`)

## Bước 4: Thêm code vào website

1. Tạo file `.env.local` trong thư mục gốc của project (nếu chưa có):
```bash
touch .env.local
```

2. Thêm dòng sau vào file `.env.local`:
```env
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=ABC123xyz456...
```

**Lưu ý:** Thay `ABC123xyz456...` bằng code bạn đã copy ở bước 3.

3. Nếu bạn đang chạy dev server, khởi động lại:
```bash
npm run dev
```

4. Nếu đã deploy, commit và push code lên:
```bash
git add .env.local
git commit -m "Add Google Search Console verification"
git push
```

**⚠️ QUAN TRỌNG:** 
- File `.env.local` không nên commit lên git (đã có trong .gitignore)
- Nếu deploy trên Vercel/Netlify, thêm biến môi trường trong dashboard của hosting

## Bước 5: Xác minh trên Google Search Console

1. Quay lại trang Google Search Console
2. Click nút **"Xác minh"** (Verify)
3. Nếu thành công, bạn sẽ thấy thông báo "Xác minh thành công"

## Bước 6: Submit Sitemap

Sau khi xác minh thành công:

1. Vào **"Sơ đồ trang web"** (Sitemaps) trong menu bên trái
2. Nhập: `sitemap.xml`
3. Click **"Gửi"** (Submit)

Hoặc truy cập trực tiếp: `https://yourdomain.com/sitemap.xml` để kiểm tra sitemap đã hoạt động chưa.

## Kiểm tra xác minh đã hoạt động

1. Mở website của bạn
2. View source (Ctrl+U hoặc Cmd+Option+U)
3. Tìm trong `<head>` có dòng:
```html
<meta name="google-site-verification" content="ABC123xyz456..." />
```

Nếu thấy dòng này, xác minh đã được thêm thành công!

## Troubleshooting

### Không thấy meta tag trong source code?
- Kiểm tra file `.env.local` đã có code chưa
- Khởi động lại dev server
- Clear cache: `npm run clear-cache`

### Google báo lỗi "Không thể truy cập trang web"?
- Kiểm tra website đã deploy và hoạt động chưa
- Kiểm tra robots.txt không chặn Googlebot
- Đợi vài phút rồi thử lại

### Code không hoạt động sau khi deploy?
- Kiểm tra biến môi trường đã được thêm vào hosting (Vercel/Netlify)
- Rebuild lại website sau khi thêm biến môi trường

## Thêm biến môi trường trên Vercel

1. Vào dashboard Vercel
2. Chọn project của bạn
3. Vào **Settings** > **Environment Variables**
4. Thêm:
   - **Name:** `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
   - **Value:** `ABC123xyz456...` (code của bạn)
5. Chọn môi trường: Production, Preview, Development
6. Click **Save**
7. Redeploy website

## Thêm biến môi trường trên Netlify

1. Vào dashboard Netlify
2. Chọn site của bạn
3. Vào **Site configuration** > **Environment variables**
4. Click **Add variable**
5. Thêm:
   - **Key:** `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
   - **Value:** `ABC123xyz456...` (code của bạn)
6. Click **Save**
7. Trigger deploy lại

---

**Sau khi xác minh thành công, bạn có thể:**
- Xem dữ liệu về website trong Google Search Console
- Submit sitemap để Google index nhanh hơn
- Theo dõi keywords và traffic từ Google Search
- Kiểm tra lỗi crawl và indexing

