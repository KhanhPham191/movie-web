# Hướng dẫn xác minh Google Search Console bằng CNAME DNS Record

## Thông tin CNAME Record cần thêm:

- **Domain:** movpey.xyz
- **Loại record:** CNAME
- **Host/Label (Tên):** `7ojnwdsvm5t3`
- **Target/Destination (Giá trị):** `gv-ytnrkyfdu623ar.dv.googlehosted.com`
- **TTL:** 3600 (hoặc Auto/mặc định)

## Cách thêm CNAME Record

### Bước 1: Xác định DNS Provider của bạn

Kiểm tra xem bạn đang quản lý DNS ở đâu:
- **Cloudflare** (cloudflare.com)
- **Namecheap** (namecheap.com)
- **GoDaddy** (godaddy.com)
- **Google Domains** (domains.google.com)
- **Name.com**
- **Hoặc nhà cung cấp khác**

### Bước 2: Đăng nhập vào DNS Provider

1. Truy cập website của DNS provider
2. Đăng nhập vào tài khoản
3. Tìm phần **DNS Management** hoặc **DNS Settings**

### Bước 3: Thêm CNAME Record

Tùy theo DNS provider, các bước có thể khác nhau một chút:

#### Nếu dùng Cloudflare:
1. Chọn domain `movpey.xyz`
2. Vào tab **DNS** → **Records**
3. Click **Add record**
4. Điền thông tin:
   - **Type:** CNAME
   - **Name:** `7ojnwdsvm5t3`
   - **Target:** `gv-ytnrkyfdu623ar.dv.googlehosted.com`
   - **Proxy status:** DNS only (không bật proxy/orange cloud)
   - **TTL:** Auto
5. Click **Save**

#### Nếu dùng Namecheap:
1. Vào **Domain List** → Chọn `movpey.xyz`
2. Click **Manage** → **Advanced DNS**
3. Ở phần **Host Records**, click **Add New Record**
4. Điền thông tin:
   - **Type:** CNAME Record
   - **Host:** `7ojnwdsvm5t3`
   - **Value:** `gv-ytnrkyfdu623ar.dv.googlehosted.com`
   - **TTL:** Automatic
5. Click **Save All Changes**

#### Nếu dùng GoDaddy:
1. Vào **My Products** → Chọn domain `movpey.xyz`
2. Click **DNS** → **Manage DNS**
3. Scroll xuống phần **Records**
4. Click **Add** → Chọn **CNAME**
5. Điền thông tin:
   - **Host:** `7ojnwdsvm5t3`
   - **Points to:** `gv-ytnrkyfdu623ar.dv.googlehosted.com`
   - **TTL:** 1 Hour
6. Click **Save**

#### Nếu dùng Google Domains:
1. Vào **My domains** → Chọn `movpey.xyz`
2. Click **DNS** → **Custom records**
3. Click **Add custom record**
4. Điền thông tin:
   - **Name:** `7ojnwdsvm5t3`
   - **Type:** CNAME
   - **Data:** `gv-ytnrkyfdu623ar.dv.googlehosted.com`
   - **TTL:** 3600
5. Click **Add**

### Bước 4: Kiểm tra CNAME Record đã được thêm

Sau khi thêm, đợi vài phút rồi kiểm tra bằng lệnh:

```bash
dig 7ojnwdsvm5t3.movpey.xyz CNAME +short
```

Hoặc truy cập: https://dnschecker.org/#CNAME/7ojnwdsvm5t3.movpey.xyz

Kết quả mong đợi:
```
gv-ytnrkyfdu623ar.dv.googlehosted.com
```

### Bước 5: Xác minh trên Google Search Console

1. Quay lại Google Search Console
2. Đảm bảo CNAME record đã được thêm đúng
3. Click nút **"XÁC MINH"** (màu xanh đậm)
4. Google sẽ kiểm tra CNAME record
5. Nếu thành công, bạn sẽ thấy thông báo "Xác minh thành công"

## Lưu ý quan trọng:

⚠️ **Thời gian propagation:**
- DNS changes có thể mất từ vài phút đến 48 giờ để propagate
- Nếu Google không tìm thấy record ngay, đợi 1 ngày rồi thử lại

⚠️ **Không xóa CNAME record:**
- Phải giữ CNAME record này để duy trì trạng thái xác minh
- Nếu xóa, bạn sẽ mất quyền truy cập vào Search Console

⚠️ **Kiểm tra format:**
- Host/Label: `7ojnwdsvm5t3` (không có dấu chấm ở cuối)
- Target: `gv-ytnrkyfdu623ar.dv.googlehosted.com` (có dấu chấm ở cuối - tùy DNS provider)

## Troubleshooting:

### Google không tìm thấy CNAME record?
1. Kiểm tra lại CNAME đã được thêm đúng chưa
2. Đợi thêm thời gian (có thể đến 24-48 giờ)
3. Kiểm tra bằng công cụ: https://dnschecker.org
4. Đảm bảo không có typo trong host hoặc target

### CNAME record không hoạt động?
- Kiểm tra xem có conflict với A record không
- Đảm bảo host name đúng format (không có @, không có domain đầy đủ)
- Thử xóa và thêm lại record

## Sau khi xác minh thành công:

1. **Submit Sitemap:**
   - Vào **Sơ đồ trang web** (Sitemaps)
   - Nhập: `sitemap.xml`
   - Click **Gửi**

2. **Bắt đầu theo dõi:**
   - Xem dữ liệu về website
   - Theo dõi keywords và traffic
   - Kiểm tra lỗi crawl và indexing

---

**Cần hỗ trợ thêm?** Cho tôi biết DNS provider bạn đang dùng để tôi hướng dẫn chi tiết hơn!




