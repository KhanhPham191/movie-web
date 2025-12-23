import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper function để validate và format time - loại bỏ NaN và giá trị không hợp lệ
export function isValidTime(time?: string | null | undefined): boolean {
  // Kiểm tra null/undefined/empty
  if (!time) return false;
  
  // Convert sang string và trim
  const trimmed = String(time).trim();
  if (trimmed === '') return false;
  
  // Kiểm tra các giá trị không hợp lệ (case-insensitive)
  const lowerTrimmed = trimmed.toLowerCase();
  const invalidValues = ['nan', 'undefined', 'null', 'none', 'infinity', 'inf', '-infinity', '-inf'];
  
  if (invalidValues.includes(lowerTrimmed)) {
    return false;
  }
  
  // Kiểm tra nếu chứa "NaN" ở bất kỳ đâu trong string
  if (lowerTrimmed.includes('nan')) {
    return false;
  }
  
  // Chấp nhận các format string như "90 phút", "1h 30m", "120 phút", v.v.
  // Kiểm tra xem có chứa số và đơn vị thời gian không
  const hasTimeUnit = /(phút|phut|min|m|giờ|h|giay|s|giây)/i.test(trimmed);
  const hasNumber = /\d/.test(trimmed);
  
  // Nếu có đơn vị thời gian và số, chấp nhận
  if (hasTimeUnit && hasNumber) {
    return true;
  }
  
  // Nếu chỉ là số thuần túy, kiểm tra như cũ
  const numValue = Number(trimmed);
  if (!isNaN(numValue) && isFinite(numValue)) {
    // Kiểm tra nếu là số âm hoặc quá lớn (không hợp lý cho thời lượng phim)
    if (numValue >= 0 && numValue <= 10000) {
      return true;
    }
  }
  
  return false;
}

// Helper function để format time - trả về time nếu hợp lệ, ngược lại trả về empty string
export function formatTime(time?: string | null): string {
  if (!isValidTime(time)) return "";
  return String(time).trim();
}
