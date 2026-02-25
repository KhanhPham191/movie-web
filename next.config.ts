import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Next.js Image Optimization: tự động resize, convert WebP/AVIF, cache
    // Poster 1500px gốc → chỉ serve 200-400px tùy viewport → giảm 80-90% dung lượng
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
    // Ưu tiên AVIF (nhỏ hơn ~20% so với WebP), fallback WebP
    formats: ["image/avif", "image/webp"],
    // Kích thước ảnh phù hợp với layout thực tế (poster card, hero, thumbnail)
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [64, 96, 128, 256, 384],
    // Cache ảnh đã optimize 30 ngày (giảm re-process)
    minimumCacheTTL: 2592000,
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
