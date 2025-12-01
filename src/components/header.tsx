"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Menu, X, Film, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { GENRES, COUNTRIES } from "@/lib/api";

const mainNav = [
  { name: "Trang chủ", href: "/" },
  { name: "Phim lẻ", href: "/danh-sach/phim-le" },
  { name: "Phim bộ", href: "/danh-sach/phim-bo" },
  { name: "Đang chiếu", href: "/danh-sach/phim-dang-chieu" },
];

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tim-kiem?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsSearchOpen(false);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-background/95 backdrop-blur-xl shadow-lg shadow-black/10"
          : "bg-gradient-to-b from-black/80 via-black/40 to-transparent"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300 group-hover:scale-105">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl lg:text-2xl font-bold tracking-tight hidden sm:block">
              <span className="text-blue-500">Phim7</span>
              <span className="text-foreground">.xyz</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 ml-8">
            {mainNav.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className="text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-white/10"
                >
                  {item.name}
                </Button>
              </Link>
            ))}

            {/* Genre Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-white/10 gap-1"
                >
                  Thể loại
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 max-h-80 overflow-y-auto bg-background/95 backdrop-blur-xl border-border/50">
                {GENRES.map((genre) => (
                  <DropdownMenuItem key={genre.slug} asChild>
                    <Link href={`/the-loai/${genre.slug}`} className="cursor-pointer">
                      {genre.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Country Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="text-sm font-medium text-foreground/80 hover:text-foreground hover:bg-white/10 gap-1"
                >
                  Quốc gia
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48 bg-background/95 backdrop-blur-xl border-border/50">
                {COUNTRIES.map((country) => (
                  <DropdownMenuItem key={country.slug} asChild>
                    <Link href={`/quoc-gia/${country.slug}`} className="cursor-pointer">
                      {country.name}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="flex items-center">
              {isSearchOpen ? (
                <form
                  onSubmit={handleSearch}
                  className="flex items-center gap-2 animate-in slide-in-from-right-5"
                >
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Tìm phim..."
                      className="w-40 md:w-64 pl-9 bg-black/50 border-white/20 focus:border-blue-500 focus:bg-black/70 text-sm"
                      autoFocus
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSearchOpen(false)}
                    className="shrink-0 hover:bg-white/10"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </form>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchOpen(true)}
                  className="hover:bg-white/10"
                >
                  <Search className="w-5 h-5" />
                </Button>
              )}
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Sign In Button */}
            <Button className="hidden md:flex bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4">
              Đăng nhập
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-white/10"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-white/10 animate-in slide-in-from-top-5 bg-background/95 backdrop-blur-xl -mx-4 px-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm kiếm phim..."
                  className="pl-10 bg-black/30 border-white/10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>

            {/* Mobile Nav Items */}
            <nav className="flex flex-col gap-1">
              {mainNav.map((item) => (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-foreground/80 hover:text-foreground hover:bg-white/10"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Button>
                </Link>
              ))}
              <Link href="/the-loai/hanh-dong">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-foreground/80 hover:text-foreground hover:bg-white/10"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Thể loại
                </Button>
              </Link>
              <Link href="/quoc-gia/han-quoc">
                <Button
                  variant="ghost"
                  className="w-full justify-start text-foreground/80 hover:text-foreground hover:bg-white/10"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Quốc gia
                </Button>
              </Link>
            </nav>

            {/* Mobile Sign In */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Đăng nhập
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
