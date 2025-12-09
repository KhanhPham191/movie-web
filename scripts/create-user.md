# Hướng dẫn tạo user thủ công (nếu cần)

## ⚠️ LƯU Ý: Không nên tạo user trực tiếp trong database!

Cách đúng nhất là dùng form đăng ký tại `/dang-ky` trên website.

## Nếu thực sự cần tạo user thủ công:

### Cách 1: Dùng Supabase Dashboard (Khuyến nghị)
1. Vào Supabase Dashboard > Authentication > Users
2. Click "Add user" hoặc "Create user"
3. Điền email và mật khẩu
4. Supabase sẽ tự động hash mật khẩu

### Cách 2: Dùng SQL (Chỉ cho development)
```sql
-- Tạo user với email và mật khẩu
-- Supabase sẽ tự động hash mật khẩu
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  recovery_token
)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('your_password_here', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  FALSE,
  '',
  ''
);
```

**LƯU Ý:** Cách này phức tạp và không khuyến nghị. Tốt nhất là dùng form đăng ký!


