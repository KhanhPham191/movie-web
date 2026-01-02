import type { Metadata } from "next";
import { Suspense } from "react";
import { Noto_Sans, Noto_Sans_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { URLCleaner } from "@/components/url-cleaner";
import { PageTransition } from "@/components/page-transition";
import { Header } from "@/components/header";
import { GoogleAnalytics } from "@/components/google-analytics";
import { DevToolsBlocker } from "@/components/devtools-blocker";
import { PageViewTracker } from "@/components/page-view-tracker";
import { SplashOverlay } from "@/components/splash-overlay";
import { generateWebsiteStructuredData, generateOrganizationStructuredData } from "@/lib/structured-data";
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
  title: {
    default: "MovPey - Phim xịn mỗi ngày",
    template: "%s | MovPey",
  },
  description:
    "MovPey - Phim xịn mỗi ngày. Nền tảng xem phim trực tuyến với hàng nghìn bộ phim hấp dẫn, cập nhật liên tục. Xem phim HD, phim lẻ, phim bộ, phim Hàn Quốc, Trung Quốc, Âu Mỹ, Anime với phụ đề Việt chất lượng cao.",
  keywords: [
    "xem phim",
    "phim lẻ",
    "phim bộ",
    "phim vietsub",
    "xem phim online",
    "phim hd",
    "phim miễn phí",
    "phim hay",
    "phim mới",
    "phim Hàn Quốc",
    "phim Trung Quốc",
    "phim Âu Mỹ",
    "phim Thái Lan",
    "phim Hong Kong",
    "anime",
    "phim thuyết minh",
    "phim lồng tiếng",
    "xem phim không quảng cáo",
    "phim chất lượng cao",
    "phim full hd",
    "phim 4k",
    "phim online miễn phí",
    "xem phim trực tuyến",
    "phim truyền hình",
    "phim điện ảnh",
    "phim chiếu rạp",
    "phim bom tấn",
  ],
  authors: [{ name: "MovPey" }],
  creator: "MovPey",
  publisher: "MovPey",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "MovPey - Phim xịn mỗi ngày",
    description:
      "Xem phim online chất lượng cao, cập nhật liên tục, đầy đủ thể loại với Vietsub/Thuyết minh. Phim lẻ, phim bộ, phim Hàn Quốc, Trung Quốc, Âu Mỹ, Anime HD miễn phí.",
    url: siteUrl,
    siteName: "MovPey",
    locale: "vi_VN",
    type: "website",
    images: [
      {
        url: `${siteUrl}/logo.svg`,
        width: 1200,
        height: 630,
        alt: "MovPey - Phim xịn mỗi ngày",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MovPey - Phim xịn mỗi ngày",
    description:
      "Xem phim online chất lượng cao, cập nhật liên tục, đầy đủ thể loại với Vietsub/Thuyết minh.",
    images: [`${siteUrl}/logo.svg`],
    creator: "@MovPey",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [{ url: "/logo.svg", type: "image/svg+xml" }],
    shortcut: ["/logo.svg"],
    apple: "/logo.svg",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: "cover",
  },
  verification: {
    // Google Search Console verification code
    // Lấy từ: https://search.google.com/search-console
    // Chọn phương thức xác minh "HTML tag" và copy code trong content attribute
    // Thêm vào file .env.local: NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=your-code-here
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
  category: "Entertainment",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID || 'G-5GN4EFTX0Q';
  const websiteStructuredData = generateWebsiteStructuredData(siteUrl);
  const organizationStructuredData = generateOrganizationStructuredData(siteUrl);
  
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
        />
      </head>
      <body
        className={`${notoSans.variable} ${notoSansMono.variable} font-sans antialiased`}
      >
        <SplashOverlay />
        {gaId && <GoogleAnalytics gaId={gaId} />}
        <PageViewTracker />
        <DevToolsBlocker />
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
            {/* Header outside PageTransition to avoid transform stacking context issues */}
            <Header />
            <PageTransition>{children}</PageTransition>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
