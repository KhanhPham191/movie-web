import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tài khoản",
  description: "Quản lý tài khoản MovPey của bạn.",
  robots: { index: false, follow: false },
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
