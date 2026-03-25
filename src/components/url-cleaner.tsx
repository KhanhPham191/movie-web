"use client";

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Component để clean URL sau khi OAuth callback
 * Xóa code parameter khỏi URL sau khi đăng nhập thành công
 */
export function URLCleaner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Nếu có code parameter (từ OAuth callback), xóa nó
    const code = searchParams.get('code');
    if (code && pathname) {
      // Replace URL không query nhưng giữ nguyên path hiện tại
      router.replace(pathname, { scroll: false });
    }
  }, [searchParams, router, pathname]);
  
  return null;
}

