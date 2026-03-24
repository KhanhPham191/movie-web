import type { MetadataRoute } from "next";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://www.movpey.xyz";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/tai-khoan", "/dang-nhap", "/dang-ky", "/auth", "/api"],
        crawlDelay: 1,
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/tai-khoan", "/dang-nhap", "/dang-ky", "/auth"],
      },
      {
        userAgent: "Bingbot",
        allow: "/",
        disallow: ["/tai-khoan", "/dang-nhap", "/dang-ky", "/auth"],
        crawlDelay: 1,
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}










