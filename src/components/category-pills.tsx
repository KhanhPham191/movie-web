"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GENRES, COUNTRIES } from "@/lib/api";

interface CategoryPillsProps {
  activeCategory?: string;
}

const categories = [
  { name: "Tất cả", slug: "", href: "/" },
  { name: "Phim lẻ", slug: "phim-le", href: "/danh-sach/phim-le" },
  { name: "Phim bộ", slug: "phim-bo", href: "/danh-sach/phim-bo" },
  { name: "Đang chiếu", slug: "phim-dang-chieu", href: "/danh-sach/phim-dang-chieu" },
];

export function CategoryPills({ activeCategory = "" }: CategoryPillsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 200;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    setShowLeftArrow(container.scrollLeft > 10);
    setShowRightArrow(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
  };

  return (
    <div className="sticky top-14 sm:top-16 lg:top-[68px] z-40 bg-transparent backdrop-blur-sm">
      <div className="relative flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 md:px-12 py-2 sm:py-3">
        {/* Main Categories */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Genre Dropdown */}
          {isMounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="h-7 sm:h-8 px-2 sm:px-3 bg-transparent border-white/40 hover:border-white hover:bg-white/10 text-xs sm:text-sm font-medium gap-0.5 sm:gap-1"
                >
                  <span className="hidden xs:inline">Thể loại</span>
                  <span className="xs:hidden">TL</span>
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 max-h-80 overflow-y-auto bg-[#141414] border-gray-700">
                {GENRES.map((genre) => (
                  <DropdownMenuItem key={genre.slug} asChild>
                    <Link href={`/the-loai/${genre.slug}`} className="cursor-pointer text-gray-200 hover:text-white">
                      {genre.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Country Dropdown */}
          {isMounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  className="h-7 sm:h-8 px-2 sm:px-3 bg-transparent border-white/40 hover:border-white hover:bg-white/10 text-xs sm:text-sm font-medium gap-0.5 sm:gap-1"
                >
                  <span className="hidden xs:inline">Quốc gia</span>
                  <span className="xs:hidden">QG</span>
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-[#141414] border-gray-700">
                {COUNTRIES.map((country) => (
                  <DropdownMenuItem key={country.slug} asChild>
                    <Link href={`/quoc-gia/${country.slug}`} className="cursor-pointer text-gray-200 hover:text-white">
                      {country.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Divider */}
        <div className="w-px h-5 sm:h-6 bg-white/20 shrink-0 hidden sm:block" />

        {/* Scrollable Pills */}
        <div className="relative flex-1 overflow-hidden min-w-0">
          {/* Left Arrow */}
          {showLeftArrow && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-0 bottom-0 z-10 w-6 sm:w-8 flex items-center justify-start bg-gradient-to-r from-background to-transparent"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}

          {/* Pills */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide scroll-smooth px-0.5 sm:px-1"
          >
            {categories.map((cat) => (
              <Link key={cat.slug} href={cat.href}>
                <Button
                  variant={activeCategory === cat.slug ? "default" : "ghost"}
                  className={`h-7 sm:h-8 px-2.5 sm:px-4 text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 rounded-full ${
                    activeCategory === cat.slug
                      ? "bg-white text-black hover:bg-white/90"
                      : "bg-white/10 hover:bg-white/20 text-white"
                  }`}
                >
                  {cat.name}
                </Button>
              </Link>
            ))}
            
            {/* Quick Genre Pills - Hide on very small screens */}
            <div className="hidden sm:flex gap-1.5 sm:gap-2">
              {GENRES.slice(0, 6).map((genre) => (
                <Link key={genre.slug} href={`/the-loai/${genre.slug}`}>
                  <Button
                    variant="ghost"
                    className="h-7 sm:h-8 px-2.5 sm:px-4 text-xs sm:text-sm font-medium whitespace-nowrap shrink-0 rounded-full bg-white/10 hover:bg-white/20 text-white"
                  >
                    {genre.name}
                  </Button>
                </Link>
              ))}
            </div>
          </div>

          {/* Right Arrow */}
          {showRightArrow && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-0 bottom-0 z-10 w-6 sm:w-8 flex items-center justify-end bg-gradient-to-l from-background to-transparent"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

