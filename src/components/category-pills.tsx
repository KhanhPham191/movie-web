"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ChevronDown, ChevronUp, Film, Globe } from "lucide-react";
import { GENRES, COUNTRIES } from "@/lib/api";
import { analytics } from "@/lib/analytics";

// Genre color mapping - each genre gets a unique accent color
const genreColors: Record<string, { bg: string; border: string; text: string; shadow: string }> = {
  "hanh-dong":          { bg: "bg-red-500/12",      border: "border-red-500/40",      text: "text-red-400",      shadow: "shadow-red-500/15" },
  "phieu-luu":          { bg: "bg-amber-500/12",     border: "border-amber-500/40",    text: "text-amber-400",    shadow: "shadow-amber-500/15" },
  "hoat-hinh":          { bg: "bg-sky-500/12",       border: "border-sky-500/40",      text: "text-sky-400",      shadow: "shadow-sky-500/15" },
  "hai":                { bg: "bg-yellow-400/12",    border: "border-yellow-400/40",   text: "text-yellow-300",   shadow: "shadow-yellow-400/15" },
  "hinh-su":            { bg: "bg-slate-400/12",     border: "border-slate-400/40",    text: "text-slate-300",    shadow: "shadow-slate-400/15" },
  "tai-lieu":           { bg: "bg-teal-500/12",      border: "border-teal-500/40",     text: "text-teal-400",     shadow: "shadow-teal-500/15" },
  "chinh-kich":         { bg: "bg-purple-500/12",    border: "border-purple-500/40",   text: "text-purple-400",   shadow: "shadow-purple-500/15" },
  "gia-dinh":           { bg: "bg-green-500/12",     border: "border-green-500/40",    text: "text-green-400",    shadow: "shadow-green-500/15" },
  "gia-tuong":          { bg: "bg-violet-500/12",    border: "border-violet-500/40",   text: "text-violet-400",   shadow: "shadow-violet-500/15" },
  "lich-su":            { bg: "bg-orange-500/12",    border: "border-orange-500/40",   text: "text-orange-400",   shadow: "shadow-orange-500/15" },
  "kinh-di":            { bg: "bg-emerald-600/12",   border: "border-emerald-600/40",  text: "text-emerald-400",  shadow: "shadow-emerald-600/15" },
  "nhac":               { bg: "bg-pink-500/12",      border: "border-pink-500/40",     text: "text-pink-400",     shadow: "shadow-pink-500/15" },
  "bi-an":              { bg: "bg-indigo-500/12",    border: "border-indigo-500/40",   text: "text-indigo-400",   shadow: "shadow-indigo-500/15" },
  "lang-man":           { bg: "bg-rose-500/12",      border: "border-rose-500/40",     text: "text-rose-400",     shadow: "shadow-rose-500/15" },
  "khoa-hoc-vien-tuong":{ bg: "bg-cyan-500/12",      border: "border-cyan-500/40",     text: "text-cyan-400",     shadow: "shadow-cyan-500/15" },
  "gay-can":            { bg: "bg-orange-600/12",    border: "border-orange-600/40",   text: "text-orange-300",   shadow: "shadow-orange-600/15" },
  "chien-tranh":        { bg: "bg-red-700/12",       border: "border-red-700/40",      text: "text-red-300",      shadow: "shadow-red-700/15" },
  "tam-ly":             { bg: "bg-blue-500/12",      border: "border-blue-500/40",     text: "text-blue-400",     shadow: "shadow-blue-500/15" },
  "tinh-cam":           { bg: "bg-fuchsia-500/12",   border: "border-fuchsia-500/40",  text: "text-fuchsia-400",  shadow: "shadow-fuchsia-500/15" },
  "co-trang":           { bg: "bg-amber-600/12",     border: "border-amber-600/40",    text: "text-amber-300",    shadow: "shadow-amber-600/15" },
};

const defaultColor = { bg: "bg-white/[0.05]", border: "border-white/[0.07]", text: "text-white/60", shadow: "" };

// Country flag mapping
const countryFlags: Record<string, string> = {
  "au-my": "🇺🇸",
  "anh": "🇬🇧",
  "trung-quoc": "🇨🇳",
  "han-quoc": "🇰🇷",
  "nhat-ban": "🇯🇵",
  "thai-lan": "🇹🇭",
  "dai-loan": "🇹🇼",
  "hong-kong": "🇭🇰",
  "an-do": "🇮🇳",
};

// Filter out Việt Nam from countries
const filteredCountries = COUNTRIES.filter((c) => c.slug !== "viet-nam");

interface CategoryPillsProps {
  activeCategory?: string;
}

export function CategoryPills({ activeCategory = "" }: CategoryPillsProps) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const [showAllGenres, setShowAllGenres] = useState(false);

  const mobileVisibleCount = 8;

  return (
    <div className="space-y-5 sm:space-y-7">
      {/* ── Genre Section ─────────────────────────────────── */}
      <div className="relative rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] p-4 sm:p-6 overflow-hidden">
        {/* Subtle glow accent */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#F6C453]/[0.04] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-[#D3A13A]/[0.03] rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#F6C453]/10 border border-[#F6C453]/20">
                <Film className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F6C453]" />
              </div>
              <h3 className="text-white text-sm sm:text-base font-bold tracking-tight">
                Thể loại phim
              </h3>
            </div>
            <Link
              href="/the-loai/hanh-dong"
              className="text-xs sm:text-sm text-white/30 hover:text-[#F6C453] transition-colors flex items-center gap-1 group"
            >
              <span>Tất cả</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          <div className="flex flex-wrap gap-2 sm:gap-2.5">
            {GENRES.map((genre, index) => {
              const color = genreColors[genre.slug] || defaultColor;
              return (
                <Link
                  key={genre.slug}
                  href={`/the-loai/${genre.slug}`}
                  onClick={() =>
                    analytics.trackGenreClick(genre.name, genre.slug, isHome)
                  }
                  className={`group relative px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full ${color.bg} backdrop-blur-sm border ${color.border} hover:brightness-125 transition-all duration-300 hover:shadow-lg ${color.shadow} active:scale-[0.97] ${
                    !showAllGenres && index >= mobileVisibleCount
                      ? "hidden sm:inline-flex"
                      : "inline-flex"
                  }`}
                >
                  <span className={`text-xs sm:text-sm font-semibold ${color.text} group-hover:brightness-125 transition-colors whitespace-nowrap`}>
                    {genre.name}
                  </span>
                </Link>
              );
            })}
          </div>

          {/* Mobile expand/collapse */}
          <div className="sm:hidden mt-3.5">
            {!showAllGenres && GENRES.length > mobileVisibleCount && (
              <button
                onClick={() => setShowAllGenres(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F6C453]/10 text-[#F6C453] text-xs font-semibold hover:bg-[#F6C453]/15 transition-colors cursor-pointer active:scale-95"
              >
                <span>Xem thêm</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            )}
            {showAllGenres && (
              <button
                onClick={() => setShowAllGenres(false)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F6C453]/10 text-[#F6C453] text-xs font-semibold hover:bg-[#F6C453]/15 transition-colors cursor-pointer active:scale-95"
              >
                <span>Thu gọn</span>
                <ChevronUp className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Country Section ───────────────────────────────── */}
      <div className="relative rounded-2xl bg-gradient-to-br from-white/[0.03] to-white/[0.01] border border-white/[0.06] p-4 sm:p-6 overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute -top-16 right-1/3 w-32 h-32 bg-[#F6C453]/[0.03] rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="flex items-center gap-2.5 mb-4 sm:mb-5">
            <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[#F6C453]/10 border border-[#F6C453]/20">
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F6C453]" />
            </div>
            <h3 className="text-white text-sm sm:text-base font-bold tracking-tight">
              Quốc gia
            </h3>
          </div>

          <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-9 gap-2 sm:gap-2.5">
            {filteredCountries.map((country) => (
              <Link
                key={country.slug}
                href={`/quoc-gia/${country.slug}`}
                onClick={() =>
                  analytics.trackCountryClick(
                    country.name,
                    country.slug,
                    isHome
                  )
                }
                className="group flex flex-col items-center gap-1.5 sm:gap-2 py-3 sm:py-4 px-2 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-[#F6C453]/40 hover:bg-[#F6C453]/[0.06] transition-all duration-300 hover:shadow-[0_0_20px_rgba(246,196,83,0.06)] active:scale-[0.97]"
              >
                <span className="text-2xl sm:text-3xl leading-none">
                  {countryFlags[country.slug] || "🏴"}
                </span>
                <span className="text-[10px] sm:text-xs font-medium text-white/50 group-hover:text-white whitespace-nowrap transition-colors">
                  {country.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

