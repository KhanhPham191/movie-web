"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Menu, X, Film, Tv, Star, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";

const navItems = [
  { name: "Phim lẻ", href: "/danh-sach/phim-le", icon: Film },
  { name: "Phim bộ", href: "/danh-sach/phim-bo", icon: Tv },
  { name: "Đang chiếu", href: "/danh-sach/phim-dang-chieu", icon: Star },
  { name: "TV Shows", href: "/danh-sach/tv-shows", icon: Clock },
];

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

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
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg shadow-amber-500/25 group-hover:shadow-amber-500/40 transition-shadow">
              <Film className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl md:text-2xl font-bold tracking-tight">
              <span className="gradient-text">Cine</span>
              <span className="text-foreground">Verse</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link key={item.name} href={item.href}>
                <Button
                  variant="ghost"
                  className="gap-2 text-muted-foreground hover:text-foreground hover:bg-accent"
                >
                  <item.icon className="w-4 h-4" />
                  {item.name}
                </Button>
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="hidden md:flex items-center">
              {isSearchOpen ? (
                <form onSubmit={handleSearch} className="flex items-center gap-2 animate-slide-in">
                  <Input
                    type="search"
                    placeholder="Tìm kiếm phim..."
                    className="w-64 bg-secondary/50 border-border focus:border-primary"
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSearchOpen(false)}
                    className="shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </form>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchOpen(true)}
                  className="hover:bg-accent"
                >
                  <Search className="w-5 h-5" />
                </Button>
              )}
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* User Button */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex hover:bg-accent"
            >
              <User className="w-5 h-5" />
            </Button>

            {/* Sign In Button */}
            <Button className="hidden md:flex bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-lg shadow-amber-500/25">
              Đăng nhập
            </Button>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
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
          <div className="lg:hidden py-4 border-t border-border/50 animate-fade-in">
            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Tìm kiếm phim..."
                  className="pl-10 bg-secondary/50 border-border"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>

            {/* Mobile Nav Items */}
            <nav className="flex flex-col gap-1">
              {navItems.map((item, index) => (
                <Link key={item.name} href={item.href}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.name}
                  </Button>
                </Link>
              ))}
            </nav>

            {/* Mobile Sign In */}
            <div className="mt-4 pt-4 border-t border-border/50">
              <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white">
                Đăng nhập
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
