"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, ChevronDown, Film } from "lucide-react";
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
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-[#141414]"
          : "bg-gradient-to-b from-black/80 via-black/40 to-transparent"
      }`}
    >
      <div className={`flex items-center justify-between px-2 xs:px-3 sm:px-4 md:px-8 lg:px-12 transition-all duration-500 ${isScrolled ? "h-10 sm:h-12 lg:h-14" : "h-14 sm:h-18 md:h-20 lg:h-[80px]"}`}>
        {/* Left Side */}
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-10 min-w-0">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 xs:gap-1.5 shrink-0">
            <div className="w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 rounded bg-[linear-gradient(135deg,rgb(255,220,120),rgb(250,236,185))] flex items-center justify-center">
              <Film className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-base xs:text-lg sm:text-xl font-bold text-[rgb(255,220,120)] hidden xs:block">
              Phim7
            </span>
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
                <DropdownMenuContent className="w-56 bg-[#141414]/95 backdrop-blur border-gray-800">
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
            <form
              onSubmit={handleSearch}
              className="hidden sm:flex items-center bg-white/5 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 w-56 md:w-72 lg:w-96 mr-2 transition-all duration-300 outline-none focus-visible:outline-none focus-within:outline-none focus-within:ring-0"
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
                />
              </form>
            </div>
          )}

          {/* Mobile search icon */}
          <button
            className="sm:hidden p-1.5 hover:text-gray-300 transition-colors"
            onClick={() => {
              const q = prompt('Nhập tên phim cần tìm:') || '';
              if (q.trim()) {
                window.location.href = `/tim-kiem?q=${encodeURIComponent(q.trim())}`;
              }
            }}
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
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-[linear-gradient(135deg,rgb(255,220,120),rgb(250,236,185))] flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-bold">P</span>
                  </div>
                  <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-white group-hover:rotate-180 transition-transform hidden md:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-[#141414]/95 backdrop-blur border-gray-800">
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
    </header>
  );
}
