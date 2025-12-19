import Link from "next/link";
import Image from "next/image";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

const footerLinks = [
  { name: "Mô tả âm thanh", href: "#" },
  { name: "Trung tâm trợ giúp", href: "#" },
  { name: "Thẻ quà tặng", href: "#" },
  { name: "Trung tâm đa phương tiện", href: "#" },
  { name: "Quan hệ với nhà đầu tư", href: "#" },
  { name: "Việc làm", href: "#" },
  { name: "Điều khoản sử dụng", href: "#" },
  { name: "Quyền riêng tư", href: "#" },
  { name: "Thông báo pháp lý", href: "#" },
  { name: "Tùy chọn cookie", href: "#" },
  { name: "Thông tin doanh nghiệp", href: "#" },
  { name: "Liên hệ", href: "#" },
];

const socialLinks = [
  { name: "Facebook", icon: Facebook, href: "#" },
  { name: "Instagram", icon: Instagram, href: "#" },
  { name: "Twitter", icon: Twitter, href: "#" },
  { name: "Youtube", icon: Youtube, href: "#" },
];

const seoKeywords = [
  "xem phim online",
  "phim lẻ",
  "phim bộ",
  "phim vietsub",
  "phim hd",
  "phim miễn phí",
  "phim Hàn Quốc",
  "phim Trung Quốc",
  "phim Âu Mỹ",
  "phim Thái Lan",
  "phim Hong Kong",
  "anime",
  "phim thuyết minh",
  "phim lồng tiếng",
  "phim chất lượng cao",
  "phim full hd",
  "phim 4k",
  "phim online miễn phí",
  "xem phim trực tuyến",
  "phim truyền hình",
  "phim điện ảnh",
  "phim bom tấn",
  "phim hay",
  "phim mới",
  "xem phim không quảng cáo",
];

export function Footer() {
  return (
    <footer className="bg-transparent pt-16 pb-8 px-4 md:px-12">
      <div className="max-w-[980px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-transparent flex items-center justify-center">
            <Image
              src="/logo.svg"
              alt="MovPey logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
            />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold text-[#F6C453]">
              MovPey
            </span>
            <span className="text-[10px] text-gray-300">
              Phim xịn mỗi ngày
            </span>
          </div>
        </div>

        {/* SEO Keywords Section */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {seoKeywords.map((keyword, index) => (
              <span
                key={index}
                className="text-[10px] text-gray-500 hover:text-gray-300 transition-colors"
                itemProp="keywords"
              >
                {keyword}
                {index < seoKeywords.length - 1 && (
                  <span className="mx-1 text-gray-600">•</span>
                )}
              </span>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-800 pt-6 mt-6">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} MovPey - Phim xịn mỗi ngày. Xem phim online chất lượng cao miễn phí.
          </p>
          <p className="text-[10px] text-gray-600 mt-2">
            MovPey là nền tảng xem phim trực tuyến miễn phí với hàng nghìn bộ phim chất lượng cao, 
            bao gồm phim lẻ, phim bộ, phim Hàn Quốc, Trung Quốc, Âu Mỹ, Thái Lan, Hong Kong và Anime. 
            Tất cả phim đều có phụ đề Việt hoặc thuyết minh chất lượng cao.
          </p>
        </div>
      </div>
    </footer>
  );
}
