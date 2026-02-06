"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { GENRES } from "@/lib/api";

interface GenreSectionProps {
  genres?: { name: string; slug: string }[];
}

export function GenreSection({ genres }: GenreSectionProps) {
  const pathname = usePathname();
  const displayGenres = genres && genres.length > 0 ? genres : GENRES;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const activeRef = useRef<HTMLAnchorElement>(null);

  // Lấy slug hiện tại từ pathname để highlight active genre
  const currentSlug = pathname?.startsWith("/the-loai/")
    ? pathname.replace("/the-loai/", "").split("?")[0]
    : null;

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);
    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
    };
  }, []);

  // Scroll active genre vào view
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const active = activeRef.current;
      const containerRect = container.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();

      if (activeRect.left < containerRect.left || activeRect.right > containerRect.right) {
        active.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    }
  }, [currentSlug]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.6;
    el.scrollBy({ left: direction === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section className="py-4 sm:py-5">
      <div className="container mx-auto px-4">
        <div className="relative group/scroll">
          {/* Scroll Arrows */}
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#191b24]/90 border border-[#F6C453]/30 flex items-center justify-center text-white shadow-lg backdrop-blur-md hover:bg-[#F6C453]/20 hover:border-[#F6C453] transition-all duration-200 -ml-1 cursor-pointer"
              aria-label="Cuộn trái"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#191b24]/90 border border-[#F6C453]/30 flex items-center justify-center text-white shadow-lg backdrop-blur-md hover:bg-[#F6C453]/20 hover:border-[#F6C453] transition-all duration-200 -mr-1 cursor-pointer"
              aria-label="Cuộn phải"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {/* Fade edges */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#191b24] to-transparent z-10 pointer-events-none" />
          )}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#191b24] to-transparent z-10 pointer-events-none" />
          )}

          {/* Genre Pills */}
          <div
            ref={scrollRef}
            className="flex gap-2 sm:gap-2.5 overflow-x-auto scrollbar-hide scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {/* Tất cả */}
            <Link
              href="/"
              className={`shrink-0 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                !currentSlug
                  ? "bg-gradient-to-r from-[#F6C453] to-[#D3A13A] text-[#1a1a2e] shadow-[0_2px_12px_rgba(246,196,83,0.35)]"
                  : "bg-white/[0.06] text-gray-300 border border-white/[0.08] hover:bg-[#F6C453]/15 hover:text-[#F6C453] hover:border-[#F6C453]/40"
              }`}
            >
              Tất cả
            </Link>

            {displayGenres.map((genre) => {
              const isActive = currentSlug === genre.slug;
              return (
                <Link
                  key={genre.slug}
                  ref={isActive ? activeRef : undefined}
                  href={`/the-loai/${genre.slug}`}
                  className={`shrink-0 px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 whitespace-nowrap ${
                    isActive
                      ? "bg-gradient-to-r from-[#F6C453] to-[#D3A13A] text-[#1a1a2e] shadow-[0_2px_12px_rgba(246,196,83,0.35)]"
                      : "bg-white/[0.06] text-gray-300 border border-white/[0.08] hover:bg-[#F6C453]/15 hover:text-[#F6C453] hover:border-[#F6C453]/40"
                  }`}
                >
                  {genre.name}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
