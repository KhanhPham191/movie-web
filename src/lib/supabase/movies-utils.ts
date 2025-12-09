"use client";

import { createClient } from "./client";

/**
 * Kiểm tra xem bảng có tồn tại trong database không
 * Sử dụng để tránh lỗi khi bảng chưa được tạo
 */
export async function checkTableExists(tableName: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const { error } = await supabase
      .from(tableName)
      .select("id")
      .limit(1);
    
    // Nếu lỗi là "relation does not exist", bảng chưa tồn tại
    if (error && error.code === "42P01") {
      return false;
    }
    
    return true;
  } catch {
    return false;
  }
}

/**
 * Wrapper để xử lý lỗi khi gọi Supabase functions
 */
export async function safeSupabaseCall<T>(
  fn: () => Promise<T>,
  fallback: T,
  errorMessage?: string
): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    console.error(errorMessage || "Supabase call error:", error);
    
    // Nếu bảng chưa tồn tại, trả về fallback
    if (error?.code === "42P01" || error?.message?.includes("does not exist")) {
      console.warn(`Table may not exist yet. Please run supabase-schema.sql`);
      return fallback;
    }
    
    return fallback;
  }
}


