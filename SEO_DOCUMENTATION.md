# SEO — MovPey (Audit & cải tiến)

Tài liệu gộp: báo cáo đánh giá ban đầu + tóm tắt các thay đổi đã làm trong code.

---

## Tổng quan

Website đã có **nền tảng SEO tốt** (metadata, schema, sitemap, kỹ thuật Next.js). Một số hạng mục trong audit đã được **xử lý trong repo**; phần còn lại là backlog (nội dung, backlinks, tối ưu thêm).

---

## Điểm mạnh (nền tảng — vẫn đúng)

### Meta & metadata
- Title template, meta description, keywords, OG, Twitter Cards, canonical

### Structured data (JSON-LD)
- Movie, VideoObject, BreadcrumbList, Website & Organization, FAQPage (trang phim)

### Kỹ thuật
- Sitemap, robots, tối ưu ảnh (WebP/AVIF), responsive, Next.js

### Cấu trúc nội dung
- HTML ngữ nghĩa, breadcrumbs, internal linking (đã được tăng cường thêm — xem dưới)

---

## Đã hoàn thành trong code (chi tiết)

### 1. Hreflang
**Mục đích:** Google hiểu ngôn ngữ / khu vực.

**Đã thêm vào:** `layout.tsx`, trang chủ, `phim/[slug]`, `xem-phim/...`, `danh-sach/[slug]`, `the-loai/[slug]`, `quoc-gia/[slug]`.

```typescript
alternates: {
  canonical: url,
  languages: {
    "vi": url,
    "vi-VN": url,
    "x-default": url,
  },
}
```

### 2. Internal linking
- Section **Phim cùng thể loại** trên trang chi tiết (~12 phim, loại trừ phim hiện tại)
- **File:** `src/app/phim/[slug]/page.tsx`, dùng `MovieSection`

### 3. Content trên trang phim
- Section **Nội dung phim** (mô tả HTML từ API), diễn viên / đạo diễn, styling rõ ràng  
- **File:** `src/app/phim/[slug]/page.tsx`

### 4. Sitemap
- Giới hạn tăng (ví dụ 500 → 1000 phim — theo commit đã ghi trong summary), vẫn có bảo vệ timeout  
- **File:** `src/app/sitemap.ts`

---

## Trạng thái so với audit ban đầu

| Hạng mục audit | Trạng thái |
|----------------|------------|
| Hreflang | Đã triển khai |
| Internal linking mạnh hơn | Đã triển khai (cùng thể loại) |
| Content rich hơn trên trang phim | Đã triển khai (mô tả + meta nội dung) |
| Sitemap giới hạn 500 | Đã nới (số lượng URL lớn hơn — xem `sitemap.ts`) |
| Sitemap index / nhiều sitemap con | Backlog (tùy scale) |
| Backlinks | Ngoài code — marketing |
| Alt text đầy đủ | Backlog / rà soát từng component |
| Page speed thêm | Backlog (Lighthouse, bundle) |
| User engagement / analytics | Backlog |

---

## Backlog & ưu tiên tiếp theo

### Trung bình
- Alt text đồng nhất cho ảnh quan trọng
- Section liên quan: cùng đạo diễn / diễn viên / quốc gia (nếu có dữ liệu API)
- Meta description hấp dẫn hơn + CTA

### Thấp / dài hạn
- Page speed: Lighthouse, lazy load component nặng
- Schema bổ sung: Review / AggregateRating nếu có dữ liệu thật
- Sitemap index + nhiều file con nếu số URL rất lớn

### Không nằm trong code
- **Google Search Console:** submit sitemap, Coverage, Performance  
- **Backlinks:** guest post, social, forum (có chọn lọc)  
- **Content:** bài blog / mô tả sâu cho phim hot

---

## Tác động dự kiến (tham khảo)

- **Ngắn hạn:** crawl/index internal link mới, hreflang, nội dung dài hơn  
- **Trung dài hạn:** traffic organic, index rate, vị trí trung bình — cần 1–6 tháng đo bằng GSC

---

## Checklist sau deploy

- [ ] Trong HTML có `hreflang` (View Source, tìm `hreflang`)
- [ ] “Phim cùng thể loại” và “Nội dung phim” hiển thị đúng
- [ ] `/sitemap.xml` mở được; trong GSC số URL hợp lý
- [ ] Không lỗi nghiêm trọng trong Search Console

### Kiểm tra hreflang nhanh

```html
<link rel="alternate" hreflang="vi" href="https://yourdomain.com/..." />
<link rel="alternate" hreflang="vi-VN" href="https://yourdomain.com/..." />
<link rel="alternate" hreflang="x-default" href="https://yourdomain.com/..." />
```

---

## Công cụ

1. **Google Search Console** — coverage, queries, CTR  
2. **PageSpeed Insights** — mobile/desktop  
3. **validator.schema.org** — JSON-LD  
4. **Ahrefs / SEMrush** (tuỳ chọn) — backlinks, đối thủ  

---

## Metrics nên theo dõi

- GSC: impressions, clicks, CTR, average position, index coverage  
- Analytics: organic traffic, bounce, time on page  
- Rankings: bộ từ khóa mục tiêu  

---

## Lưu ý

1. SEO là quá trình dài hạn (thường vài tháng mới thấy xu hướng rõ).  
2. Nội dung và UX vẫn là trọng tâm.  
3. Cập nhật phim / nội dung đều đặn.  

---

**Phiên bản tài liệu:** 2.0 (gộp audit + tóm tắt cải tiến)  
**Cập nhật:** 2025-03
