import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tìm kiếm phim",
  description:
    "Tìm kiếm phim trên MovPey - Tìm phim lẻ, phim bộ, phim Hàn Quốc, Trung Quốc, Âu Mỹ, Anime và hơn thế nữa.",
  robots: { index: true, follow: true },
};

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
