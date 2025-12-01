"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, ChevronDown, X, Film } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Navigation removed - using CategoryPills below instead

export function Header() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/tim-kiem?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setIsSearchOpen(false);
    }
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-transparent transition-all duration-500"
    >
      <div className="flex items-center justify-between h-14 sm:h-16 lg:h-[68px] px-3 sm:px-4 md:px-12">
        {/* Left Side - Only Logo */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-blue-600 flex items-center justify-center">
              <Film className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-lg sm:text-xl font-bold text-blue-500 hidden sm:block">
              Phim7
            </span>
          </Link>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-1.5 sm:gap-2 md:gap-4 shrink-0">
          {/* Search */}
          <div className="flex items-center">
            {isSearchOpen ? (
              <form 
                onSubmit={handleSearch}
                className="flex items-center bg-black/80 border border-white/50 animate-in slide-in-from-right-5 rounded"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 ml-2 shrink-0" />
                <Input
                  type="search"
                  placeholder="Tìm phim..."
                  className="w-32 sm:w-48 md:w-64 border-0 bg-transparent text-xs sm:text-sm focus-visible:ring-0 placeholder:text-gray-500 py-1.5"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 sm:h-8 sm:w-8 shrink-0"
                  onClick={() => setIsSearchOpen(false)}
                >
                  <X className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </form>
            ) : (
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-1.5 sm:p-2 hover:text-gray-300 transition-colors"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>

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
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-blue-600 flex items-center justify-center">
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
