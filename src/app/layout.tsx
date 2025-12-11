import type { Metadata } from "next";
import { Suspense } from "react";
import { Noto_Sans, Noto_Sans_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { URLCleaner } from "@/components/url-cleaner";
import { PageTransition } from "@/components/page-transition";
import { Header } from "@/components/header";
import { RouteLoader } from "@/components/route-loader";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://movpey.example.com");

const notoSans = Noto_Sans({
  variable: "--font-geist-sans",
  subsets: ["latin", "vietnamese"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700", "800"],
});

const notoSansMono = Noto_Sans_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "vietnamese"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MovPey - Phim xịn mỗi ngày",
  description:
    "MovPey - Phim xịn mỗi ngày. Nền tảng xem phim trực tuyến với hàng nghìn bộ phim hấp dẫn, cập nhật liên tục.",
  keywords: [
    "xem phim",
    "phim lẻ",
    "phim bộ",
    "phim vietsub",
    "xem phim online",
    "phim hd",
  ],
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MovPey - Phim xịn mỗi ngày",
    description:
      "Xem phim online chất lượng cao, cập nhật liên tục, đầy đủ thể loại với Vietsub/Thuyết minh.",
    url: siteUrl,
    siteName: "MovPey",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: "/logo.svg",
        width: 256,
        height: 256,
        alt: "MovPey",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MovPey - Phim xịn mỗi ngày",
    description:
      "Xem phim online chất lượng cao, cập nhật liên tục, đầy đủ thể loại với Vietsub/Thuyết minh.",
    images: ["/logo.svg"],
  },
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }],
    shortcut: ["/logo.svg"],
    apple: "/logo.svg",
  },
};

export const viewport = {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${notoSans.variable} ${notoSansMono.variable} font-sans antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Suspense fallback={null}>
              <URLCleaner />
            </Suspense>
            <Suspense fallback={null}>
              <RouteLoader />
            </Suspense>
            {/* Header outside PageTransition to avoid transform stacking context issues */}
            <Header />
            <PageTransition>{children}</PageTransition>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
