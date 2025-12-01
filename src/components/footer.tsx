import Link from "next/link";
import { Facebook, Instagram, Twitter, Youtube, Film } from "lucide-react";

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
    <footer className="bg-[#141414] pt-16 pb-8 px-4 md:px-12">
      <div className="max-w-[980px] mx-auto">
        {/* Social Links */}
        <div className="flex gap-6 mb-6">
          {socialLinks.map((social) => (
            <Link
              key={social.name}
              href={social.href}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <social.icon className="w-6 h-6" />
              <span className="sr-only">{social.name}</span>
            </Link>
          ))}
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-6">
          {footerLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-xs text-gray-400 hover:text-gray-200 hover:underline transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Service Code Button */}
        <button className="px-4 py-1.5 text-xs text-gray-400 border border-gray-600 hover:text-gray-200 transition-colors mb-6">
          Mã dịch vụ
        </button>

        {/* Brand */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded bg-[linear-gradient(135deg,rgb(255,220,120),rgb(250,236,185))] flex items-center justify-center">
            <Film className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-[rgb(255,220,120)]">Phim7.xyz</span>
        </div>

        {/* Copyright */}
        <p className="text-xs text-gray-500">
          © {new Date().getFullYear()} Phim7.xyz - Xem phim online chất lượng cao miễn phí
        </p>
      </div>
    </footer>
  );
}
