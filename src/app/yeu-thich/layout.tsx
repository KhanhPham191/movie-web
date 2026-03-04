import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Danh sách yêu thích",
  description: "Xem danh sách phim yêu thích của bạn trên MovPey.",
  robots: { index: false, follow: false },
};

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
