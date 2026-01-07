# Hướng dẫn thêm CNAME Record trên Vercel để xác minh Google Search Console

## Tình huống:
- Domain: `movpey.xyz` 
- Nameservers: `ns.vercel` (đang dùng Vercel DNS)
- Cần thêm CNAME record trên Vercel, không phải GoDaddy

## Thông tin CNAME Record cần thêm:

- **Type:** CNAME
- **Name/Host:** `7ojnwdsvm5t3`
- **Value/Target:** `gv-ytnrkyfdu623ar.dv.googlehosted.com`
- **TTL:** Auto

## Các bước thực hiện:

### Bước 1: Đăng nhập Vercel Dashboard

1. Truy cập: https://vercel.com
2. Đăng nhập vào tài khoản của bạn
3. Vào **Dashboard**

### Bước 2: Chọn Project

1. Tìm và click vào project **movie-web** (hoặc project chứa domain movpey.xyz)
2. Vào tab **Settings**

### Bước 3: Vào phần Domains

1. Trong Settings, tìm và click vào **Domains** ở menu bên trái
2. Hoặc truy cập trực tiếp: `https://vercel.com/[your-team]/[your-project]/settings/domains`

### Bước 4: Chọn Domain

1. Tìm domain `movpey.xyz` trong danh sách
2. Click vào domain đó để mở chi tiết

### Bước 5: Thêm DNS Record

1. Scroll xuống phần **DNS Records** hoặc **DNS Configuration**
2. Click **Add Record** hoặc **Add DNS Record**
3. Điền thông tin:
   - **Type:** Chọn `CNAME`
   - **Name:** Nhập `7ojnwdsvm5t3`
   - **Value:** Nhập `gv-ytnrkyfdu623ar.dv.googlehosted.com`
   - **TTL:** Để Auto hoặc 3600
4. Click **Save** hoặc **Add Record**

### Bước 6: Kiểm tra DNS Record đã được thêm

Sau khi thêm, đợi vài phút rồi kiểm tra:

**Cách 1: Dùng Terminal:**
```bash
dig 7ojnwdsvm5t3.movpey.xyz CNAME +short
```

**Cách 2: Dùng công cụ online:**
- Truy cập: https://dnschecker.org/#CNAME/7ojnwdsvm5t3.movpey.xyz
- Hoặc: https://mxtoolbox.com/SuperTool.aspx?action=cname%3a7ojnwdsvm5t3.movpey.xyz

**Kết quả mong đợi:**
```
gv-ytnrkyfdu623ar.dv.googlehosted.com
```

### Bước 7: Xác minh trên Google Search Console

1. Quay lại Google Search Console
2. Đảm bảo CNAME record đã được thêm đúng
3. Click nút **"XÁC MINH"** (màu xanh đậm)
4. Google sẽ kiểm tra CNAME record
5. Nếu thành công, bạn sẽ thấy thông báo "Xác minh thành công"

## Lưu ý quan trọng:

⚠️ **Thời gian propagation:**
- DNS changes trên Vercel thường propagate nhanh (5-15 phút)
- Nhưng có thể mất đến 24-48 giờ trong một số trường hợp
- Nếu Google không tìm thấy ngay, đợi vài giờ rồi thử lại

⚠️ **Không xóa CNAME record:**
- Phải giữ CNAME record này để duy trì trạng thái xác minh
- Nếu xóa, bạn sẽ mất quyền truy cập vào Search Console

⚠️ **Format:**
- Name: `7ojnwdsvm5t3` (không có dấu chấm, không có domain)
- Value: `gv-ytnrkyfdu623ar.dv.googlehosted.com` (có dấu chấm ở cuối - tùy Vercel)

## Troubleshooting:

### Không tìm thấy phần DNS Records trong Vercel?

**Cách 1: Thêm qua Vercel Dashboard → Domains**
1. Vào: https://vercel.com/dashboard
2. Click **Settings** → **Domains**
3. Click vào domain `movpey.xyz`
4. Tìm phần **DNS Records**

**Cách 2: Thêm qua Vercel CLI (nếu có)**
```bash
vercel dns add movpey.xyz CNAME 7ojnwdsvm5t3 gv-ytnrkyfdu623ar.dv.googlehosted.com
```

**Cách 3: Nếu Vercel không hỗ trợ DNS records trực tiếp**
- Có thể bạn cần chuyển DNS management về GoDaddy
- Hoặc dùng phương thức xác minh khác (HTML file hoặc HTML tag)

### Google không tìm thấy CNAME record?

1. Kiểm tra lại CNAME đã được thêm đúng chưa trên Vercel
2. Đợi thêm thời gian (15 phút - 1 giờ)
3. Kiểm tra bằng công cụ: https://dnschecker.org
4. Đảm bảo không có typo trong name hoặc value

## Alternative: Nếu không thể thêm DNS record trên Vercel

Nếu Vercel không cho phép thêm DNS records, bạn có 2 lựa chọn:

### Option 1: Dùng phương thức HTML File (Đã setup)
- File `google5e6d0a1754336249.html` đã được tạo
- Truy cập: https://www.movpey.xyz/google5e6d0a1754336249.html
- Xác minh bằng phương thức này thay vì DNS

### Option 2: Dùng phương thức HTML Tag (Đã setup)
- Meta tag đã được cấu hình trong `layout.tsx`
- Code: `NGy0YxOocF5yFGJqQ2kA4kJBwXyfg0E9QhJYoVtq4JA`
- Xác minh bằng phương thức này thay vì DNS

### Option 3: Chuyển DNS về GoDaddy
1. Vào GoDaddy → Domain Settings
2. Thay đổi nameservers từ `ns.vercel` về nameservers mặc định của GoDaddy
3. Thêm CNAME record trên GoDaddy
4. Sau đó có thể chuyển lại về Vercel nếu muốn

---

**Lưu ý:** Vercel có thể có giao diện khác một chút, nhưng các bước cơ bản giống nhau. Nếu gặp khó khăn, cho tôi biết bạn thấy gì trong Vercel Dashboard để tôi hướng dẫn cụ thể hơn!






