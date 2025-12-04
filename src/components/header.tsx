"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Search, Bell, ChevronDown } from "lucide-react";
import { getImageUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const mainNav = [
  { name: "Trang chủ", href: "/" },
  { name: "Mới & Phổ biến", href: "/danh-sach/phim-moi-cap-nhat" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    { name: string; slug: string; thumb: string }[]
  >([]);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const scrolledSearchInputRef = useRef<HTMLInputElement | null>(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 0;
      setIsScrolled(scrolled);
      if (!scrolled) {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tim-kiem?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSuggestions([]);
      setIsSuggestOpen(false);
    }
  };

  // Autocomplete suggestions (desktop)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setIsSuggestOpen(false);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(
          `https://phim.nguonc.com/api/films/search?keyword=${encodeURIComponent(
            searchQuery.trim()
          )}&page=1`,
          { headers: { Accept: "application/json" } }
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const data = await res.json();
        const items: any[] = Array.isArray(data?.items) ? data.items : [];
        const mapped = items.slice(0, 8).map((m) => ({
          name: m?.name ?? "",
          slug: m?.slug ?? "",
          thumb: getImageUrl(m?.thumb_url || m?.poster_url || ""),
        }));
        setSuggestions(mapped);
        setIsSuggestOpen(mapped.length > 0);
      } catch {
        setSuggestions([]);
        setIsSuggestOpen(false);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    }
  }, [searchQuery]);

  // Auto focus input khi header đã scroll và ô search thu gọn được mở ra
  useEffect(() => {
    if (isSearchOpen && isScrolled && scrolledSearchInputRef.current) {
      scrolledSearchInputRef.current.focus();
    }
  }, [isSearchOpen, isScrolled]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-[#0f0f0f]"
          : "bg-gradient-to-b from-black/80 via-black/40 to-transparent"
      }`}
    >
      <div className={`flex items-center justify-between px-2 xs:px-3 sm:px-4 md:px-8 lg:px-12 transition-all duration-500 ${
        isScrolled
          ? "h-10 xs:h-11 sm:h-12 lg:h-14"
          : "h-12 xs:h-14 sm:h-16 md:h-20 lg:h-[80px]"
      }`}>
        {/* Left Side */}
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-10 min-w-0">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 xs:gap-1.5 shrink-0">
            <div className="w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 lg:w-11 lg:h-11 rounded-xl overflow-hidden flex items-center justify-center">
              <Image
                src="/movpey-logo.ico"
                alt="MovPey logo"
                width={64}
                height={64}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="hidden xs:flex flex-col leading-tight">
              <span className="text-base xs:text-lg sm:text-xl font-extrabold text-[#fb743E] tracking-tight">
                MovPey
              </span>
              <span className="text-[9px] xs:text-[10px] sm:text-xs font-medium text-gray-200 tracking-wide">
                Phim xịn mỗi ngày
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-5">
            {mainNav.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-gray-200 hover:text-white transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Mobile Menu Dropdown */}
          {isMounted && (
            <div className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-xs sm:text-sm font-medium gap-1 px-1.5 sm:px-2 h-8">
                    <span className="hidden xs:inline">Duyệt</span>
                    <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-[#0f0f0f]/95 backdrop-blur border-gray-800">
                  {mainNav.map((item) => (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link href={item.href} className="text-gray-200 hover:text-white">
                        {item.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 shrink-0">
          {/* Desktop search */}
          {!isScrolled ? (
            <div className="relative hidden sm:block mr-2">
              <form
                onSubmit={handleSearch}
                className="flex items-center bg-white/5 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 w-56 md:w-72 lg:w-96 transition-all duration-300 outline-none focus-visible:outline-none focus-within:outline-none focus-within:ring-0"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 shrink-0" />
                <input
                  type="search"
                  placeholder="Tìm phim, diễn viên, thể loại..."
                  className="flex-1 bg-transparent text-xs sm:text-sm placeholder:text-gray-500 px-0 border-none focus:border-none outline-none focus:outline-none focus-visible:outline-none"
                  style={{ outline: "none", boxShadow: "none" }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>

              {/* Autocomplete dropdown */}
              {isSuggestOpen && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 rounded-xl bg-[#0f0f0f]/95 border border-white/10 shadow-xl max-h-[320px] overflow-y-auto text-xs sm:text-sm z-50">
                  {suggestions.map((s) => (
                    <button
                      key={s.slug || s.name}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-white/5 flex items-center gap-2"
                      onClick={() => {
                        if (s.slug) {
                          router.push(`/phim/${s.slug}`);
                        } else if (s.name) {
                          router.push(`/tim-kiem?q=${encodeURIComponent(s.name)}`);
                        }
                        setIsSuggestOpen(false);
                        setSuggestions([]);
                        setSearchQuery("");
                      }}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-9 h-12 rounded-md overflow-hidden bg-white/5 shrink-0">
                        {s.thumb && (
                          <Image
                            src={s.thumb}
                            alt={s.name || "Poster"}
                            fill
                            sizes="48px"
                            className="object-cover"
                          />
                        )}
                      </div>

                      {/* Title */}
                      <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                        <span className="truncate">
                          {s.name || "Không rõ tên phim"}
                        </span>
                        <span className="text-[10px] text-[#fb743E] uppercase tracking-wide shrink-0">
                          Xem
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center">
              <button
                className="p-1.5 hover:text-gray-300 transition-colors"
                onClick={() => setIsSearchOpen((prev) => !prev)}
              >
                <Search className="w-4 h-4" />
              </button>
              <form
                onSubmit={handleSearch}
                className={`flex items-center bg-white/5 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 ml-2 transition-all duration-300 outline-none focus-visible:outline-none focus-within:outline-none focus-within:ring-0 ${
                  isSearchOpen ? 'w-48 md:w-64 lg:w-80 opacity-100' : 'w-0 opacity-0 border-transparent px-0 pointer-events-none'
                }`}
              >
                <input
                  type="search"
                  placeholder="Tìm phim, diễn viên, thể loại..."
                  className="flex-1 bg-transparent text-xs sm:text-sm placeholder:text-gray-500 px-0 border-none focus:border-none outline-none focus:outline-none focus-visible:outline-none"
                  style={{ outline: 'none', boxShadow: 'none' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  ref={scrolledSearchInputRef}
                />
              </form>
            </div>
          )}

          {/* Mobile search icon */}
          <button
            className="sm:hidden p-1.5 hover:text-gray-300 transition-colors"
            onClick={() => setIsMobileSearchOpen(true)}
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Notifications */}
          <button className="hidden md:block p-2 hover:text-gray-300 transition-colors relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full" />
          </button>

          {/* Profile Dropdown */}
          {isMounted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-1 sm:gap-2 group shrink-0">
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-[linear-gradient(135deg,#fb743E,#ff9d6b)] flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-bold">P</span>
                  </div>
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-white group-hover:rotate-180 transition-transform hidden md:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-[#0f0f0f]/95 backdrop-blur border-gray-800">
                <DropdownMenuItem className="text-gray-200 hover:text-white cursor-pointer">
                  Quản lý hồ sơ
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-200 hover:text-white cursor-pointer">
                  Tài khoản
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-200 hover:text-white cursor-pointer">
                  Trung tâm trợ giúp
                </DropdownMenuItem>
                <DropdownMenuItem className="text-gray-200 hover:text-white cursor-pointer border-t border-gray-700 mt-2 pt-2">
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Mobile search overlay */}
      {isMobileSearchOpen && (
        <div className="sm:hidden fixed inset-x-0 top-0 z-50 bg-[#0f0f0f] border-b border-white/10 mobile-search">
          <div className="px-3 py-2 flex items-center gap-2">
            <button
              className="px-2 py-1 text-sm text-gray-300 active:scale-95"
              onClick={() => setIsMobileSearchOpen(false)}
            >
              ✕
            </button>
            <form
              onSubmit={(e) => {
                handleSearch(e);
                setIsMobileSearchOpen(false);
              }}
              className="flex-1 flex items-center bg-white/5 rounded-full px-3 py-1.5 border-0 outline-none focus-within:outline-none focus-within:border-0"
              style={{ border: "none", borderWidth: 0 }}
            >
              <Search className="w-4 h-4 text-gray-400 mr-2" />
              <input
                autoFocus
                type="search"
                placeholder="Tìm phim, diễn viên, thể loại..."
                className="flex-1 bg-transparent text-sm placeholder:text-gray-500 border-0 border-transparent outline-none focus:outline-none focus-visible:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          {/* Autocomplete dropdown - mobile */}
          {isSuggestOpen && suggestions.length > 0 && (
            <div className="px-3 pb-2">
              <div className="mt-1 rounded-xl bg-[#0f0f0f]/95 border border-white/10 shadow-xl max-h-[60vh] overflow-y-auto text-xs sm:text-sm">
                {suggestions.map((s) => (
                  <button
                    key={s.slug || s.name}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-white/5 flex items-center gap-2"
                    onClick={() => {
                      if (s.slug) {
                        router.push(`/phim/${s.slug}`);
                      } else if (s.name) {
                        router.push(
                          `/tim-kiem?q=${encodeURIComponent(s.name)}`
                        );
                      }
                      setIsSuggestOpen(false);
                      setSuggestions([]);
                      setSearchQuery("");
                      setIsMobileSearchOpen(false);
                    }}
                  >
                    <div className="relative w-9 h-12 rounded-md overflow-hidden bg-white/5 shrink-0">
                      {s.thumb && (
                        <Image
                          src={s.thumb}
                          alt={s.name || "Poster"}
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                      <span className="truncate">
                        {s.name || "Không rõ tên phim"}
                      </span>
                      <span className="text-[10px] text-[#fb743E] uppercase tracking-wide shrink-0">
                        Xem
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
