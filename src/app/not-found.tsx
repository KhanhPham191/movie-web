import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Không tìm thấy trang",
  description:
    "Trang không tồn tại hoặc đã được gỡ. Quay về MovPey để tiếp tục xem phim.",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#151823] px-4 text-center">
      <p className="mb-2 text-6xl font-extrabold text-[#F6C453]">404</p>
      <h1 className="mb-2 text-xl font-semibold text-white">
        Không tìm thấy trang
      </h1>
      <p className="mb-8 max-w-md text-sm text-gray-400">
        URL có thể sai hoặc nội dung không còn. Hãy dùng tìm kiếm hoặc về trang chủ.
      </p>
      <Link
        href="/"
        className="rounded-lg bg-[#F6C453] px-6 py-2.5 text-sm font-semibold text-black transition hover:brightness-110"
      >
        Về trang chủ
      </Link>
    </main>
  );
}
