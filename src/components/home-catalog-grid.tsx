import Link from "next/link";
import { Clapperboard, Film, Globe2, Sparkles, Tv, Zap } from "lucide-react";
import { getFilmsByGenre } from "@/lib/api";

const quickCollections = [
  {
    title: "Phim lẻ",
    description: "Nội dung gọn, xem trọn bộ nhanh",
    href: "/danh-sach/phim-le",
    icon: Film,
    accent: "from-amber-400/20 via-amber-300/10 to-transparent",
  },
  {
    title: "Phim bộ",
    description: "Theo dõi dài tập, cập nhật liên tục",
    href: "/danh-sach/phim-bo",
    icon: Tv,
    accent: "from-cyan-400/20 via-cyan-300/10 to-transparent",
  },
  {
    title: "Đang chiếu",
    description: "Các phim đang hot và còn ra tập",
    href: "/danh-sach/phim-dang-chieu",
    icon: Sparkles,
    accent: "from-fuchsia-400/20 via-purple-300/10 to-transparent",
  },
  {
    title: "TV Shows",
    description: "Gameshow, truyền hình và giải trí",
    href: "/danh-sach/tv-shows",
    icon: Clapperboard,
    accent: "from-emerald-400/20 via-emerald-300/10 to-transparent",
  },
];

const genreCandidates = [
  { name: "Hành động", slug: "hanh-dong" },
  { name: "Tình cảm", slug: "tinh-cam" },
  { name: "Kinh dị", slug: "kinh-di" },
  { name: "Hoạt hình", slug: "hoat-hinh" },
  { name: "Viễn tưởng", slug: "khoa-hoc-vien-tuong" },
  { name: "Hài", slug: "hai" },
  { name: "Cổ trang", slug: "co-trang" },
  { name: "Tâm lý", slug: "tam-ly" },
  { name: "Hình sự", slug: "hinh-su" },
  { name: "Lãng mạn", slug: "lang-man" },
];

const countryShortcuts = [
  { name: "Hàn Quốc", slug: "han-quoc", flag: "KR" },
  { name: "Trung Quốc", slug: "trung-quoc", flag: "CN" },
  { name: "Nhật Bản", slug: "nhat-ban", flag: "JP" },
  { name: "Âu Mỹ", slug: "au-my", flag: "US" },
];

export async function HomeCatalogGrid() {
  const genreChecks = await Promise.all(
    genreCandidates.map(async (genre) => {
      try {
        const result = await getFilmsByGenre(genre.slug, 1, { limit: 12 });
        if (result.status === "success" && result.items.length > 0) {
          return genre;
        }
      } catch {
        // Ignore failed genres; keep only valid categories with data.
      }
      return null;
    })
  );

  const availableGenres = genreChecks.filter(
    (genre): genre is (typeof genreCandidates)[number] => genre !== null
  );

  const visibleGenres = availableGenres.slice(0, 6);

  return (
    <section className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/[0.05] via-white/[0.03] to-transparent p-4 sm:p-6">
      <div className="mb-4 sm:mb-5 flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-[#F6C453]">
            <Zap className="h-3.5 w-3.5" />
            Xem theo sở thích
          </p>
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-white">
            Danh mục phim nổi bật
          </h2>
        </div>
        <Link
          href="/the-loai/hanh-dong"
          className="text-xs sm:text-sm font-medium text-white/60 hover:text-[#F6C453]"
        >
          Xem tất cả
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {quickCollections.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group relative overflow-hidden rounded-xl border border-white/10 bg-[#1f2230] p-3.5 sm:p-4 hover:border-[#F6C453]/40 hover:bg-[#222636]"
            >
              <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${item.accent}`} />
              <div className="relative">
                <span className="mb-3 inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-lg bg-white/10 text-[#F6C453]">
                  <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" />
                </span>
                <p className="text-sm sm:text-[15px] font-semibold text-white">
                  {item.title}
                </p>
                <p className="mt-1 text-[11px] sm:text-xs text-white/65 line-clamp-2">
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-4 sm:mt-5 grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div className="rounded-xl border border-white/10 bg-[#1b1f2b] p-3.5 sm:p-4">
          <div className="mb-3 flex items-center gap-2 text-white">
            <Film className="h-4 w-4 text-[#F6C453]" />
            <p className="text-xs sm:text-sm font-semibold">Thể loại phổ biến</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {visibleGenres.length > 0 ? (
              visibleGenres.map((genre) => (
                <Link
                  key={genre.slug}
                  href={`/the-loai/${genre.slug}`}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[11px] sm:text-xs font-medium text-white/80 hover:border-[#F6C453]/40 hover:text-[#F6C453]"
                >
                  {genre.name}
                </Link>
              ))
            ) : (
              <p className="text-xs text-white/55">
                Hiện chưa có thể loại phù hợp để đề xuất.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#1b1f2b] p-3.5 sm:p-4">
          <div className="mb-3 flex items-center gap-2 text-white">
            <Globe2 className="h-4 w-4 text-[#F6C453]" />
            <p className="text-xs sm:text-sm font-semibold">Khu vực nổi bật</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {countryShortcuts.map((country) => (
              <Link
                key={country.slug}
                href={`/quoc-gia/${country.slug}`}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-2 text-xs sm:text-sm text-white/80 hover:border-[#F6C453]/40 hover:text-[#F6C453]"
              >
                <span>{country.name}</span>
                <span className="text-[10px] sm:text-xs text-white/40">{country.flag}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
