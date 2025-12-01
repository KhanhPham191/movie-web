import Link from "next/link";
import { Film, Facebook, Twitter, Instagram, Youtube } from "lucide-react";

const footerLinks = [
  { name: "Giới thiệu", href: "/about" },
  { name: "Điều khoản sử dụng", href: "/terms" },
  { name: "Chính sách bảo mật", href: "/privacy" },
  { name: "Liên hệ", href: "/contact" },
  { name: "Câu hỏi thường gặp", href: "/faq" },
  { name: "Trung tâm trợ giúp", href: "/help" },
  { name: "Yêu cầu phim", href: "/request" },
  { name: "Tuyển dụng", href: "/careers" },
];

const socialLinks = [
  { name: "Facebook", icon: Facebook, href: "#" },
  { name: "Twitter", icon: Twitter, href: "#" },
  { name: "Instagram", icon: Instagram, href: "#" },
  { name: "Youtube", icon: Youtube, href: "#" },
];

export function Footer() {
  return (
    <footer className="bg-background border-t border-white/5 pt-12 pb-8">
      <div className="container mx-auto px-4">
        {/* Social Links */}
        <div className="flex items-center gap-4 mb-8">
          {socialLinks.map((social) => (
            <Link
              key={social.name}
              href={social.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <social.icon className="w-6 h-6" />
              <span className="sr-only">{social.name}</span>
            </Link>
          ))}
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-8">
          {footerLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Service Code */}
        <button className="px-4 py-1.5 border border-muted-foreground/50 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          Mã dịch vụ
        </button>

        {/* Brand & Copyright */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Film className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">
              <span className="text-blue-500">Phim7</span>
              <span className="text-foreground">.xyz</span>
            </span>
          </Link>

          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Phim7.xyz. Tất cả quyền được bảo lưu.
          </p>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground/60 mt-6 max-w-3xl">
          Phim7.xyz - Trang xem phim online chất lượng cao miễn phí. Tất cả nội dung 
          trên website đều được thu thập từ các nguồn có sẵn trên internet. Chúng tôi 
          không lưu trữ bất kỳ nội dung nào trên máy chủ của mình.
        </p>
      </div>
    </footer>
  );
}
