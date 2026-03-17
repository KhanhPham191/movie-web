"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, LogIn } from "lucide-react";
import { useAuth, AUTH_DISABLED } from "@/contexts/auth-context";
import { GENRES, COUNTRIES } from "@/lib/api";
import { analytics } from "@/lib/analytics";

const mainNav = [
  { name: "Trang chủ", href: "/" },
  { name: "Mới & Phổ biến", href: "/danh-sach/phim-moi-cap-nhat" },
];

const movieCategories = [
  { name: "Phim lẻ", href: "/danh-sach/phim-le" },
  { name: "Phim bộ", href: "/danh-sach/phim-bo" },
  { name: "Đang chiếu", href: "/danh-sach/phim-dang-chieu" },
];

interface MobileHamburgerMenuProps {
  onOpenLogin?: () => void;
  onOpenChange?: (open: boolean) => void;
}

export function MobileHamburgerMenu({ onOpenChange }: MobileHamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const { user, signOut, isAuthenticated } = useAuth();

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Notify parent
  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  return (
    <>
      {/* Trigger button */}
      <button
        className="lg:hidden p-1.5 hover:text-gray-300 transition-colors"
        onClick={() => setIsOpen(true)}
        aria-label="Menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] animate-fade-in-backdrop"
            onClick={() => setIsOpen(false)}
          />
          {/* Menu Panel */}
          <div className="lg:hidden fixed top-0 right-0 bottom-0 h-[100vh] w-80 max-w-[85vw] bg-[#0f0f0f] border-l border-white/10 z-[201] overflow-y-auto animate-slide-in-from-right">
            <div className="flex flex-col h-full min-h-[100vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-bold text-white">Menu</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Đóng menu"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 p-4 space-y-6">
                {/* Login Section */}
                {!AUTH_DISABLED && (
                  <div className="space-y-3">
                    {isAuthenticated ? (
                      <>
                        <div className="px-3 py-2 rounded-lg bg-white/5">
                          <p className="text-xs text-gray-400 mb-1">Đăng nhập với</p>
                          <p className="text-sm text-white truncate">
                            {user?.user_metadata?.username ||
                              (user?.email?.replace("@movpey.local", "") || user?.email || "")}
                          </p>
                        </div>
                        <Link
                          href="/tai-khoan"
                          className="block px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          Tài khoản
                        </Link>
                        <Link
                          href="/yeu-thich"
                          className="block px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          Danh sách yêu thích
                        </Link>
                        <button
                          onClick={async () => {
                            await signOut();
                            router.push("/");
                            router.refresh();
                            setIsOpen(false);
                          }}
                          className="w-full px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors text-left"
                        >
                          Đăng xuất
                        </button>
                      </>
                    ) : (
                      <Link
                        href="/dang-nhap"
                        onClick={() => setIsOpen(false)}
                        className="w-full px-4 py-3 rounded-lg bg-[#F6C453] hover:bg-[#F6C453]/90 text-black font-semibold transition-colors flex items-center justify-center gap-2"
                      >
                        <LogIn className="w-5 h-5" />
                        Đăng nhập
                      </Link>
                    )}
                  </div>
                )}

                {/* Main Navigation */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
                    Điều hướng
                  </h3>
                  {mainNav.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="block px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                      onClick={() => {
                        setIsOpen(false);
                        analytics.trackNavigation(item.href, "header_mobile");
                      }}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>

                {/* Movie Categories */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
                    Danh mục phim
                  </h3>
                  {movieCategories.map((cat) => (
                    <Link
                      key={cat.name}
                      href={cat.href}
                      className="block px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      {cat.name}
                    </Link>
                  ))}
                </div>

                {/* Genres */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
                    Thể loại
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {GENRES.map((genre) => (
                      <Link
                        key={genre.slug}
                        href={`/the-loai/${genre.slug}`}
                        className="block px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm transition-colors text-center"
                        onClick={() => setIsOpen(false)}
                      >
                        {genre.name}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Countries */}
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2">
                    Quốc gia
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {COUNTRIES.map((country) => (
                      <Link
                        key={country.slug}
                        href={`/quoc-gia/${country.slug}`}
                        className="block px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm transition-colors text-center"
                        onClick={() => setIsOpen(false)}
                      >
                        {country.name}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
