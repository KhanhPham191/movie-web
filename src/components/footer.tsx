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

export function Footer() {
  return (
    <footer className="bg-transparent pt-16 pb-8 px-4 md:px-12">
      <div className="max-w-[980px] mx-auto">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-transparent flex items-center justify-center">
            <Image
            src="/logo.ico"
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

        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} MovPey - Phim xịn mỗi ngày. Xem phim online chất lượng cao miễn phí.
        </p>
      </div>
    </footer>
  );
}
