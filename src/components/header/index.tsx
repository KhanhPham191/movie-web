"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ChevronDown, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, AUTH_DISABLED } from "@/contexts/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SignupModal } from "@/components/signup-modal";
import { useScrolled } from "@/hooks/use-scrolled";
import { HeaderSearch } from "@/components/header/header-search";
import { NotificationBell } from "@/components/header/notification-bell";
import { MobileHamburgerMenu } from "@/components/header/mobile-hamburger-menu";
import { analytics } from "@/lib/analytics";

const mainNav = [
  { name: "Trang chủ", href: "/" },
  { name: "Mới & Phổ biến", href: "/danh-sach/phim-moi-cap-nhat" },
];

export function Header() {
  const isScrolled = useScrolled();
  const [isMounted, setIsMounted] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMobileHamburgerOpen, setIsMobileHamburgerOpen] = useState(false);
  const router = useRouter();
  const { user, signOut, isAuthenticated } = useAuth();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleMobileSearchChange = useCallback((open: boolean) => {
    setIsMobileSearchOpen(open);
  }, []);

  const handleHamburgerChange = useCallback((open: boolean) => {
    setIsMobileHamburgerOpen(open);
  }, []);

  const handleOpenLogin = useCallback(() => {
    router.push("/dang-nhap");
  }, [router]);

  const shouldDisableTransform = isMobileHamburgerOpen || isMobileSearchOpen;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 will-change-transform ${
        isScrolled
          ? "bg-black/60 backdrop-blur-md"
          : "bg-gradient-to-b from-black/40 via-black/10 to-transparent"
      }`}
      style={{ transform: shouldDisableTransform ? undefined : "translateZ(0)" }}
    >
      <div
        className={`flex items-center justify-between px-2 xs:px-3 sm:px-4 md:px-8 lg:px-12 transition-all duration-500 ${
          isScrolled
            ? "h-10 xs:h-11 sm:h-12 lg:h-14"
            : "h-12 xs:h-14 sm:h-16 md:h-20 lg:h-[80px]"
        }`}
      >
        {/* Left Side */}
        <div className="flex items-center gap-2 sm:gap-4 lg:gap-10 min-w-0">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-1 xs:gap-1.5 shrink-0"
            onClick={() => analytics.trackReturnHomeLogo()}
          >
            <div className="w-9 h-9 xs:w-10 xs:h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 lg:w-13 lg:h-13 rounded-xl overflow-hidden flex items-center justify-center">
              <Image
                src="/logo.svg"
                alt="MovPey logo"
                width={64}
                height={64}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <div className="hidden xs:flex flex-col leading-tight">
              <span className="text-base xs:text-lg sm:text-xl font-extrabold text-[#F6C453] tracking-tight">
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
                onClick={() => analytics.trackNavigation(item.href, "header_desktop")}
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
                  <Button
                    variant="ghost"
                    className="text-xs sm:text-sm font-medium gap-1 px-1.5 sm:px-2 h-8"
                  >
                    <span className="hidden xs:inline">Duyệt</span>
                    <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-[#0f0f0f]/95 backdrop-blur border-gray-800">
                  {mainNav.map((item) => (
                    <DropdownMenuItem key={item.name} asChild>
                      <Link
                        href={item.href}
                        className="text-gray-200 hover:text-white"
                        onClick={() => analytics.trackNavigation(item.href, "header_dropdown")}
                      >
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
          {/* Search (desktop + scrolled + mobile) */}
          <HeaderSearch
            isScrolled={isScrolled}
            onMobileSearchOpenChange={handleMobileSearchChange}
          />

          {/* Notifications */}
          <NotificationBell />

          {/* Mobile Hamburger Menu */}
          <MobileHamburgerMenu
            onOpenLogin={handleOpenLogin}
            onOpenChange={handleHamburgerChange}
          />

          {/* Desktop Profile Dropdown or Login Button */}
          {isMounted && !AUTH_DISABLED && (
            <>
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="hidden lg:flex items-center gap-1 sm:gap-2 group shrink-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-[linear-gradient(135deg,#F6C453,#D3A13A)] flex items-center justify-center">
                        <span className="text-xs sm:text-sm font-bold">
                          {(
                            user?.user_metadata?.username ||
                            user?.email?.replace("@movpey.local", "") ||
                            user?.user_metadata?.name ||
                            user?.email ||
                            "P"
                          )
                            ?.charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                      <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-white group-hover:rotate-180 transition-transform hidden md:block" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-48 bg-[#0f0f0f]/95 backdrop-blur border-gray-800"
                  >
                    <div className="px-2 py-1.5 border-b border-gray-700">
                      <p className="text-xs text-gray-400">Đăng nhập với</p>
                      <p className="text-sm text-white truncate">
                        {user?.user_metadata?.username ||
                          (user?.email?.replace("@movpey.local", "") || user?.email || "")}
                      </p>
                    </div>
                    <DropdownMenuItem asChild>
                      <Link href="/tai-khoan" className="text-gray-200 hover:text-white cursor-pointer">
                        Tài khoản
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/yeu-thich" className="text-gray-200 hover:text-white cursor-pointer">
                        Danh sách yêu thích
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-gray-200 hover:text-white cursor-pointer border-t border-gray-700 mt-2 pt-2"
                      onClick={async () => {
                        await signOut();
                        router.push("/");
                        router.refresh();
                      }}
                    >
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  variant="outline"
                  className="hidden lg:flex items-center gap-2 bg-white/5 border-white/20 text-white hover:bg-white/10"
                  onClick={() => router.push("/dang-nhap")}
                >
                  <LogIn className="w-4 h-4" />
                  Đăng nhập
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Signup Modal */}
      {!AUTH_DISABLED && (
        <SignupModal
          open={isSignupModalOpen}
          onOpenChange={setIsSignupModalOpen}
          onSwitchToLogin={() => router.push("/dang-nhap")}
        />
      )}
    </header>
  );
}
