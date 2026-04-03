import Link from "next/link";
import Image from "next/image";
import { GENRES, COUNTRIES } from "@/lib/api";

const catalogLinks = [
  { name: "Phim lẻ", href: "/danh-sach/phim-le" },
  { name: "Phim bộ", href: "/danh-sach/phim-bo" },
  { name: "Đang chiếu", href: "/danh-sach/phim-dang-chieu" },
  { name: "Phim chiếu rạp", href: "/danh-sach/phim-chieu-rap" },
  { name: "TV Shows", href: "/danh-sach/tv-shows" },
  { name: "Mới cập nhật", href: "/danh-sach/phim-moi-cap-nhat" },
  { name: "Cập nhật hàng ngày", href: "/danh-sach/phim-cap-nhat-hang-ngay" },
] as const;

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

        <nav
          aria-label="Danh mục phim"
          className="mb-8 space-y-2 border-t border-gray-800/80 pt-8"
        >
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Danh mục
          </h2>
          <div className="flex flex-wrap gap-x-3 gap-y-2">
            {catalogLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-xs text-gray-400 transition-colors hover:text-[#F6C453] underline-offset-2 hover:underline"
              >
                {item.name}
              </Link>
            ))}
          </div>
        </nav>

        <nav aria-label="Thể loại phim" className="mb-8 space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Thể loại
          </h2>
          <div className="flex flex-wrap gap-x-3 gap-y-2">
            {GENRES.map((genre) => (
              <Link
                key={genre.slug}
                href={`/the-loai/${genre.slug}`}
                className="text-xs text-gray-400 transition-colors hover:text-[#F6C453] underline-offset-2 hover:underline"
              >
                {genre.name}
              </Link>
            ))}
          </div>
        </nav>

        <nav aria-label="Phim theo quốc gia" className="mb-8 space-y-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Quốc gia / khu vực
          </h2>
          <div className="flex flex-wrap gap-x-3 gap-y-2">
            {COUNTRIES.map((country) => (
              <Link
                key={country.slug}
                href={`/quoc-gia/${country.slug}`}
                className="text-xs text-gray-400 transition-colors hover:text-[#F6C453] underline-offset-2 hover:underline"
              >
                Phim {country.name}
              </Link>
            ))}
          </div>
        </nav>

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
