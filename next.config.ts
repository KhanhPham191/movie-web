import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Tắt image optimization toàn cục → trình duyệt load trực tiếp từ URL API
    // Tránh Next.js tải ảnh về server resize/convert/cache → tiết kiệm bộ nhớ server
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        port: "",
        pathname: "/t/p/**",
      },
      {
        protocol: "https",
        hostname: "phimapi.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "phimimg.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "img.ophim.live",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**",
        port: "",
        pathname: "/**",
      },
    ],
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
