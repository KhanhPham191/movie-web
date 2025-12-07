"use client";

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/**
 * Component để clean URL sau khi OAuth callback
 * Xóa code parameter khỏi URL sau khi đăng nhập thành công
 */
export function URLCleaner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Nếu có code parameter (từ OAuth callback), xóa nó
    const code = searchParams.get('code');
    if (code) {
      // Replace URL mà không có query params
      router.replace('/', { scroll: false });
    }
  }, [searchParams, router]);
  
  return null;
}

