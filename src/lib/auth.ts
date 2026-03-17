import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

const JWT_SECRET = process.env.JWT_SECRET!;
const COOKIE_NAME = "movpey_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 ngày (giây)

export interface JwtPayload {
  userId: string;
  username: string;
  role: "user" | "admin";
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// Lấy token từ cookie trong API route (Server Component / Route Handler)
export async function getTokenFromCookie(): Promise<JwtPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// Set cookie khi đăng nhập thành công
export function createAuthCookie(token: string): string {
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax${process.env.NODE_ENV === "production" ? "; Secure" : ""}`;
}

// Xóa cookie khi đăng xuất
export function clearAuthCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
}
