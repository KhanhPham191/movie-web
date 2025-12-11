"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Image from "next/image";

/**
 * Hiển thị overlay loading ngắn gọn khi đổi route trên client.
 * Dùng cùng spinner với src/app/loading.tsx để giữ trải nghiệm nhất quán.
 */
export function RouteLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Khi URL (path hoặc query) đổi, show loader trong thời gian ngắn
    setVisible(true);

    // Giữ tối thiểu 450ms để người dùng kịp thấy, tránh flicker
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), 450);

    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [pathname, searchParams]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f0f0f]/90 backdrop-blur-sm">
      <div className="relative flex items-center justify-center">
        <div className="h-20 w-20 rounded-full border-[3px] border-t-[#F6C453] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
        <div className="absolute h-10 w-10 drop-shadow-[0_0_22px_rgba(246,196,83,0.9)]">
          <Image
            src="/logo.svg"
            alt="MovPey"
            fill
            sizes="40px"
            priority
            className="rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}



