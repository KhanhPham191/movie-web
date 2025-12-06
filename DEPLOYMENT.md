# 🚀 Hướng dẫn Deploy lên Production

## Vấn đề: Supabase không kết nối được trên Production

**Nguyên nhân:** Biến môi trường chưa được cấu hình trên hosting platform (Vercel/Netlify).

## 📋 Cấu hình Environment Variables trên Vercel

1. **Truy cập Vercel Dashboard:**
   - Vào [https://vercel.com](https://vercel.com)
   - Chọn project của bạn

2. **Thêm Environment Variables:**
   - Vào **Settings** → **Environment Variables**
   - Thêm 2 biến sau:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://mfvyrwsuxchwvmpuwjsr.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_LArqDP9_NoGTHMTQpdbogQ_TtWdrOHH
   ```

3. **Chọn môi trường:**
   - ✅ Production
   - ✅ Preview
   - ✅ Development (nếu cần)

4. **Redeploy:**
   - Sau khi thêm env variables, cần **Redeploy** project
   - Vào **Deployments** → Click **...** → **Redeploy**

## 📋 Cấu hình Environment Variables trên Netlify

1. **Truy cập Netlify Dashboard:**
   - Vào [https://app.netlify.com](https://app.netlify.com)
   - Chọn site của bạn

2. **Thêm Environment Variables:**
   - Vào **Site configuration** → **Environment variables**
   - Click **Add a variable**
   - Thêm 2 biến:

   ```
   NEXT_PUBLIC_SUPABASE_URL=https://mfvyrwsuxchwvmpuwjsr.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_LArqDP9_NoGTHMTQpdbogQ_TtWdrOHH
   ```

3. **Redeploy:**
   - Vào **Deploys** → Click **Trigger deploy** → **Clear cache and deploy site**

## 🔐 Cấu hình Supabase cho Production

Sau khi deploy, cần cấu hình Redirect URLs trong Supabase:

1. **Vào Supabase Dashboard:**
   - Truy cập [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Chọn project của bạn

2. **Cấu hình Redirect URLs:**
   - Vào **Authentication** → **URL Configuration**
   - Trong **Redirect URLs**, thêm:
     ```
     https://your-domain.vercel.app/auth/callback
     https://your-domain.netlify.app/auth/callback
     ```
     (Thay `your-domain` bằng domain thực tế của bạn)

3. **Cấu hình Site URL:**
   - Trong **Site URL**, thêm domain production của bạn:
     ```
     https://your-domain.vercel.app
     ```
     hoặc
     ```
     https://your-domain.netlify.app
     ```

## ✅ Kiểm tra sau khi deploy

1. Mở website production
2. Mở **Developer Console** (F12)
3. Kiểm tra xem có lỗi Supabase không
4. Thử đăng nhập/đăng ký để test

## 🐛 Troubleshooting

### Lỗi: "Invalid API key"
- ✅ Kiểm tra lại `NEXT_PUBLIC_SUPABASE_ANON_KEY` đã được set đúng chưa
- ✅ Đảm bảo đã Redeploy sau khi thêm env variables

### Lỗi: "redirect_uri_mismatch"
- ✅ Kiểm tra Redirect URLs trong Supabase đã thêm domain production chưa
- ✅ Đảm bảo URL chính xác (có https://, không có trailing slash)

### Lỗi: "Supabase chưa được cấu hình"
- ✅ Kiểm tra env variables đã được set trên hosting platform
- ✅ Đảm bảo tên biến đúng: `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- ✅ Redeploy lại project

## 📝 Lưu ý

- File `.env.local` chỉ dùng cho **local development**
- Trên **production**, phải set env variables trong **hosting platform dashboard**
- Sau khi thêm/sửa env variables, **bắt buộc phải Redeploy** để áp dụng thay đổi

