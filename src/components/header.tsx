"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Search, Bell, ChevronDown, LogIn, Menu, X } from "lucide-react";
import {
  getImageUrl,
  type FilmItem,
  getNewlyUpdatedFilms,
  searchFilmsMerged,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { useAuth, AUTH_DISABLED } from "@/contexts/auth-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoginModal } from "@/components/login-modal";
import { SignupModal } from "@/components/signup-modal";
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

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileHamburgerOpen, setIsMobileHamburgerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<
    { name: string; slug: string; thumb: string; current_episode?: string; quality?: string; time?: string }[]
  >([]);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const scrolledSearchInputRef = useRef<HTMLInputElement | null>(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<FilmItem[]>([]);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut, isAuthenticated } = useAuth();

  // Ẩn search bar trên các trang auth
  const hideSearch = pathname?.startsWith('/dang-nhap') || 
                     pathname?.startsWith('/dang-ky') || 
                     pathname?.startsWith('/quen-mat-khau') ||
                     pathname?.startsWith('/dat-lai-mat-khau');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileHamburgerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileHamburgerOpen]);

  // Fetch latest film updates (max 10) when opening notifications
  useEffect(() => {
    if (!isNotificationOpen || notifications.length > 0 || isLoadingNotifications) return;

    const fetchNotifications = async () => {
      try {
        setIsLoadingNotifications(true);
        const res = await getNewlyUpdatedFilms(1);
        const items: FilmItem[] = Array.isArray(res?.items) ? res.items : [];
        setNotifications(items.slice(0, 10));
        setHasNewNotifications(items.length > 0);
      } catch (error) {
        setNotifications([]);
      } finally {
        setIsLoadingNotifications(false);
      }
    };

    fetchNotifications();
  }, [isNotificationOpen, notifications.length, isLoadingNotifications]);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 0;
      setIsScrolled(scrolled);
      
      // Chỉ đóng search khi scroll về đầu trang và không có suggestions đang mở và không có query
      if (!scrolled && !isSuggestOpen && !searchQuery.trim()) {
        setIsSearchOpen(false);
      }
      // Khi scroll xuống, giữ nguyên search state và suggestions
      // Không reset bất cứ gì khi scroll
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isSuggestOpen, searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      analytics.trackSearch(searchQuery.trim());
      router.push(`/tim-kiem?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
      setSuggestions([]);
      setIsSuggestOpen(false);
    }
  };

  // Hàm chuẩn hóa chuỗi để so sánh (bỏ dấu, lowercase)
  const normalizeString = (str: string): string => {
    return str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  // Hàm tính điểm relevance cho kết quả tìm kiếm
  const calculateRelevanceScore = (movieName: string, query: string): number => {
    const normalizedName = normalizeString(movieName);
    const normalizedQuery = normalizeString(query);

    // Exact match - điểm cao nhất
    if (normalizedName === normalizedQuery) {
      return 1000;
    }

    // Starts with query - điểm cao
    if (normalizedName.startsWith(normalizedQuery)) {
      return 500 + (normalizedQuery.length / normalizedName.length) * 100;
    }

    // Contains query - điểm trung bình
    if (normalizedName.includes(normalizedQuery)) {
      const position = normalizedName.indexOf(normalizedQuery);
      const positionScore = (normalizedName.length - position) / normalizedName.length * 50;
      return 200 + positionScore;
    }

    // Tất cả từ trong query đều có trong tên - điểm thấp hơn
    const queryWords = normalizedQuery.split(/\s+/).filter(w => w.length > 0);
    const allWordsMatch = queryWords.every(word => normalizedName.includes(word));
    if (allWordsMatch) {
      return 100;
    }

    // Một số từ khớp
    const matchedWords = queryWords.filter(word => normalizedName.includes(word)).length;
    if (matchedWords > 0) {
      return (matchedWords / queryWords.length) * 50;
    }

    return 0;
  };

  // Hiển thị thời gian dạng "x phút/giờ/ngày trước"
  const formatTimeAgo = (dateStr?: string): string => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return "";

    const now = Date.now();
    const diffMs = Math.max(0, now - date.getTime());
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 1) return "Vừa xong";
    if (diffMinutes < 60) return `${diffMinutes} phút trước`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours} giờ trước`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} ngày trước`;

    // Nếu quá 7 ngày, hiển thị ngày/tháng/năm
    return date.toLocaleDateString("vi-VN");
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
        const items = await searchFilmsMerged(searchQuery.trim());
        
        // Map và tính điểm relevance
        const mapped = items.map((m) => {
          const imageUrl = m?.poster_url || m?.thumb_url || "";
          const thumb = imageUrl ? getImageUrl(imageUrl) : "";
          // Nếu getImageUrl trả về logo.svg (fallback), coi như không có ảnh
          const finalThumb = thumb && thumb !== "/logo.svg" ? thumb : "";
          
          return {
            name: m?.name ?? "",
            slug: m?.slug ?? "",
            thumb: finalThumb,
            current_episode: m?.current_episode ?? "",
            quality: m?.quality ?? "",
            time: m?.time ?? "",
            score: calculateRelevanceScore(m?.name ?? "", searchQuery.trim()),
          };
        });

        // Sắp xếp theo điểm relevance giảm dần, sau đó lấy top 8
        const sorted = mapped
          .sort((a, b) => b.score - a.score)
          .slice(0, 8)
          .map(({ score, ...rest }) => rest); // Bỏ score khỏi kết quả cuối

        setSuggestions(sorted);
        setIsSuggestOpen(sorted.length > 0);
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
      // Delay nhỏ để đảm bảo input đã render
      setTimeout(() => {
        scrolledSearchInputRef.current?.focus();
      }, 100);
    }
  }, [isSearchOpen, isScrolled]);

  // Clear search autocomplete khi chuyển trang
  useEffect(() => {
    setSearchQuery("");
    setSuggestions([]);
    setIsSuggestOpen(false);
    setIsSearchOpen(false);
    setIsMobileSearchOpen(false);
    // Clear debounce timeout nếu có
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, [pathname]);

  const shouldDisableTransform = isMobileHamburgerOpen || isMobileSearchOpen;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 will-change-transform ${
        isScrolled
          ? "bg-black/60 backdrop-blur-md"
          : "bg-gradient-to-b from-black/40 via-black/10 to-transparent"
      }`}
      // Avoid creating a containing block for fixed-position mobile overlays
      style={{ transform: shouldDisableTransform ? undefined : 'translateZ(0)' }}
    >
      <div className={`flex items-center justify-between px-2 xs:px-3 sm:px-4 md:px-8 lg:px-12 transition-all duration-500 ${
        isScrolled
          ? "h-10 xs:h-11 sm:h-12 lg:h-14"
          : "h-12 xs:h-14 sm:h-16 md:h-20 lg:h-[80px]"
      }`}>
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
                onClick={() => analytics.trackNavigation(item.href, 'header_desktop')}
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
                      <Link 
                        href={item.href} 
                        className="text-gray-200 hover:text-white"
                        onClick={() => analytics.trackNavigation(item.href, 'header_dropdown')}
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
          {/* Desktop search */}
          {!isScrolled && !hideSearch && (
            <div className="relative hidden sm:block mr-2">
              <form
                onSubmit={handleSearch}
                className="flex items-center bg-white/5 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 w-56 md:w-72 lg:w-96 transition-all duration-300 outline-none focus-visible:outline-none focus-within:outline-none focus-within:ring-0"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 mr-2 shrink-0" />
                <input
                  type="search"
                  placeholder="Tìm phim, diễn viên, thể loại..."
                  className="flex-1 bg-transparent text-base sm:text-sm placeholder:text-gray-500 px-0 border-none focus:border-none outline-none focus:outline-none focus-visible:outline-none"
                  style={{ outline: "none", boxShadow: "none", fontSize: '16px' }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
              {/* Autocomplete dropdown */}
              {isSuggestOpen && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 mt-2 rounded-xl bg-[#0f0f0f]/95 border border-white/10 shadow-xl max-h-[400px] overflow-y-auto text-sm sm:text-base z-50">
                  {suggestions.map((s) => (
                    <button
                      key={s.slug || s.name}
                      type="button"
                      className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3"
                      onClick={() => {
                        if (s.slug) {
                          analytics.trackSearchSuggestionClick(searchQuery, s.name);
                          router.push(`/phim/${s.slug}`);
                        } else if (s.name) {
                          analytics.trackSearch(searchQuery);
                          router.push(`/tim-kiem?q=${encodeURIComponent(s.name)}`);
                        }
                        setIsSuggestOpen(false);
                        setSuggestions([]);
                        setSearchQuery("");
                      }}
                    >
                      {/* Thumbnail */}
                      <div className="relative w-12 h-16 sm:w-14 sm:h-20 rounded-md overflow-hidden bg-white/5 shrink-0">
                        {s.thumb && s.thumb !== "/logo.svg" ? (
                          <Image
                            src={s.thumb}
                            alt={s.name || "Poster"}
                            fill
                            sizes="56px"
                            className="object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = "/logo.svg";
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-white/5">
                            <span className="text-xs text-white/40">No image</span>
                          </div>
                        )}
                      </div>

                      {/* Title & Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="truncate font-semibold text-sm sm:text-base">
                            {s.name || "Không rõ tên phim"}
                          </span>
                          <span className="text-xs text-[#F6C453] uppercase tracking-wide shrink-0">
                            Xem
                          </span>
                        </div>
                        {/* Số tập, chất lượng và thời lượng */}
                        <div className="flex items-center gap-2 flex-wrap">
                          {s.current_episode && (
                            <span className="text-xs text-white/70">
                              {s.current_episode}
                            </span>
                          )}
                          {s.quality && (
                            <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/80">
                              {s.quality}
                            </span>
                          )}
                          {s.time && (
                            <span className="text-xs text-white/60">
                              {s.time}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Scrolled search - khi đã scroll và không ẩn search */}
          {isScrolled && !hideSearch && (
            <div className="hidden sm:flex items-center relative">
              {!isSearchOpen && (
                <button
                  className="p-1.5 hover:text-gray-300 transition-colors"
                  onClick={() => setIsSearchOpen(true)}
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
              <div className={`relative transition-all duration-300 ${
                isSearchOpen ? 'w-56 md:w-72 lg:w-96 opacity-100' : 'w-0 opacity-0 pointer-events-none'
              }`}>
                <form
                  onSubmit={handleSearch}
                  className="flex items-center bg-white/5 backdrop-blur-md border border-white/20 rounded-full px-3 py-1.5 w-full transition-all duration-300 outline-none focus-visible:outline-none focus-within:outline-none focus-within:ring-0"
                >
                  <button
                    type="button"
                    className="p-0 mr-2 hover:text-gray-300 transition-colors shrink-0"
                    onClick={() => {
                      setIsSearchOpen(false);
                      setSearchQuery("");
                      setSuggestions([]);
                      setIsSuggestOpen(false);
                    }}
                  >
                    <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                  </button>
                  <input
                    type="search"
                    placeholder="Tìm phim, diễn viên, thể loại..."
                    className="flex-1 bg-transparent text-base sm:text-sm placeholder:text-gray-500 px-0 border-none focus:border-none outline-none focus:outline-none focus-visible:outline-none"
                    style={{ outline: 'none', boxShadow: 'none', fontSize: '16px' }}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    ref={scrolledSearchInputRef}
                  />
                </form>

                {/* Autocomplete dropdown - khi scroll */}
                {isSearchOpen && isSuggestOpen && suggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-2 rounded-xl bg-[#0f0f0f]/95 border border-white/10 shadow-xl max-h-[400px] overflow-y-auto text-sm sm:text-base z-50">
                    {suggestions.map((s) => (
                      <button
                        key={s.slug || s.name}
                        type="button"
                        className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3"
                        onClick={() => {
                          if (s.slug) {
                            router.push(`/phim/${s.slug}`);
                          } else if (s.name) {
                            router.push(`/tim-kiem?q=${encodeURIComponent(s.name)}`);
                          }
                          setIsSuggestOpen(false);
                          setSuggestions([]);
                          setSearchQuery("");
                          setIsSearchOpen(false);
                        }}
                      >
                        {/* Thumbnail */}
                        <div className="relative w-12 h-16 sm:w-14 sm:h-20 rounded-md overflow-hidden bg-white/5 shrink-0">
                          {s.thumb && s.thumb !== "/logo.svg" ? (
                            <Image
                              src={s.thumb}
                              alt={s.name || "Poster"}
                              fill
                              sizes="56px"
                              className="object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "/logo.svg";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-white/5">
                              <span className="text-xs text-white/40">No image</span>
                            </div>
                          )}
                        </div>

                        {/* Title & Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="truncate font-semibold text-sm sm:text-base">
                              {s.name || "Không rõ tên phim"}
                            </span>
                            <span className="text-xs text-[#F6C453] uppercase tracking-wide shrink-0">
                              Xem
                            </span>
                          </div>
                          {/* Số tập, chất lượng và thời lượng */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {s.current_episode && (
                              <span className="text-xs text-white/70">
                                {s.current_episode}
                              </span>
                            )}
                            {s.quality && (
                              <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/80">
                                {s.quality}
                              </span>
                            )}
                            {s.time && (
                              <span className="text-xs text-white/60">
                                {s.time}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Mobile search icon */}
          {!hideSearch && (
            <button
              className="sm:hidden p-1.5 hover:text-gray-300 transition-colors"
              onClick={() => setIsMobileSearchOpen(true)}
            >
              <Search className="w-4 h-4" />
            </button>
          )}

          {/* Notifications */}
          {isMounted && (
            <DropdownMenu open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  className="hidden md:block p-2 hover:text-gray-300 transition-colors relative outline-none outline-offset-0 ring-0 focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0 data-[state=open]:outline-none data-[state=open]:ring-0 data-[state=open]:ring-offset-0 data-[state=open]:border-transparent"
                  style={{ outline: "none", boxShadow: "none" }}
                >
                  <Bell className="w-5 h-5" />
                  {hasNewNotifications && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full" />
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-[#0f0f0f]/95 backdrop-blur border-gray-800">
                <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-white">Thông báo</h3>
                  <button
                    type="button"
                    className="text-xs text-[#F6C453] hover:text-white transition-colors"
                    onClick={() => {
                      setHasNewNotifications(false);
                    }}
                  >
                    Xem tất cả
                  </button>
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  {isLoadingNotifications ? (
                    <div className="px-4 py-8 text-center text-sm text-gray-400">
                      Đang tải thông báo...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center">
                      <Bell className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">Chưa có thông báo mới</p>
                    </div>
                  ) : (
                    <div className="py-2">
                      {notifications.map((n) => (
                        <button
                          key={n.slug}
                          type="button"
                          className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3"
                          onClick={() => {
                            if (n.slug) {
                              router.push(`/phim/${n.slug}`);
                              setIsNotificationOpen(false);
                            }
                          }}
                        >
                          <div className="relative w-12 h-16 sm:w-14 sm:h-20 rounded-md overflow-hidden bg-white/5 shrink-0">
                            {getImageUrl(n.poster_url || n.thumb_url) && (
                              <Image
                                src={getImageUrl(n.poster_url || n.thumb_url)}
                                alt={n.name || "Poster"}
                                fill
                                sizes="56px"
                                className="object-cover"
                              />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <span className="truncate font-semibold text-sm text-white">
                                {n.name || "Phim mới"}
                              </span>
                              {n.quality && (
                                <span className="text-[11px] px-2 py-0.5 rounded bg-white/10 text-white/80 uppercase">
                                  {n.quality}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-white/70 flex items-center gap-2 flex-wrap">
                              {n.current_episode && <span>{n.current_episode}</span>}
                              {n.time && <span>{n.time}</span>}
                              {n.modified && (
                                <span className="text-white/50">
                                  {formatTimeAgo(n.modified)}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Mobile Hamburger Menu Button */}
          <button
            className="lg:hidden p-1.5 hover:text-gray-300 transition-colors"
            onClick={() => setIsMobileHamburgerOpen(true)}
            aria-label="Menu"
          >
            <Menu className="w-6 h-6" />
          </button>

          {/* Desktop Profile Dropdown or Login Button */}
          {isMounted && !AUTH_DISABLED && (
            <>
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="hidden lg:flex items-center gap-1 sm:gap-2 group shrink-0">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded bg-[linear-gradient(135deg,#F6C453,#D3A13A)] flex items-center justify-center">
                        <span className="text-xs sm:text-sm font-bold">
                          {(user?.user_metadata?.username || 
                            user?.email?.replace('@movpey.local', '') || 
                            user?.user_metadata?.name || 
                            user?.email || 
                            'P')?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <ChevronDown className="w-3 h-3 sm:w-4 sm:h-4 text-white group-hover:rotate-180 transition-transform hidden md:block" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-[#0f0f0f]/95 backdrop-blur border-gray-800">
                    <div className="px-2 py-1.5 border-b border-gray-700">
                      <p className="text-xs text-gray-400">Đăng nhập với</p>
                      <p className="text-sm text-white truncate">
                        {user?.user_metadata?.username || 
                         (user?.email?.replace('@movpey.local', '') || user?.email || '')}
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
                  onClick={() => setIsLoginModalOpen(true)}
                >
                  <LogIn className="w-4 h-4" />
                  Đăng nhập
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile search overlay */}
      {isMobileSearchOpen && !hideSearch && (
        <div className="sm:hidden fixed inset-x-0 top-0 z-[100] bg-[#0f0f0f] border-b border-white/10 mobile-search">
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
                className="flex-1 bg-transparent text-base placeholder:text-gray-500 border-0 border-transparent outline-none focus:outline-none focus-visible:outline-none"
                style={{ fontSize: '16px' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          {/* Autocomplete dropdown - mobile */}
          {isSuggestOpen && suggestions.length > 0 && (
            <div className="px-3 pb-2">
              <div className="mt-2 rounded-xl bg-[#0f0f0f]/95 border border-white/10 shadow-xl max-h-[60vh] overflow-y-auto text-sm sm:text-base">
                {suggestions.map((s) => (
                  <button
                    key={s.slug || s.name}
                    type="button"
                    className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3"
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
                    <div className="relative w-12 h-16 sm:w-14 sm:h-20 rounded-md overflow-hidden bg-white/5 shrink-0">
                      {s.thumb && s.thumb !== "/logo.svg" ? (
                        <Image
                          src={s.thumb}
                          alt={s.name || "Poster"}
                          fill
                          sizes="56px"
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = "/logo.svg";
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                          <span className="text-xs text-white/40">No image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="truncate font-semibold text-sm sm:text-base">
                          {s.name || "Không rõ tên phim"}
                        </span>
                        <span className="text-xs text-[#F6C453] uppercase tracking-wide shrink-0">
                          Xem
                        </span>
                      </div>
                      {/* Số tập, chất lượng và thời lượng */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {s.current_episode && (
                          <span className="text-xs text-white/70">
                            {s.current_episode}
                          </span>
                        )}
                        {s.quality && (
                          <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/80">
                            {s.quality}
                          </span>
                        )}
                        {s.time && (
                          <span className="text-xs text-white/60">
                            {s.time}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Hamburger Menu Overlay */}
      {isMobileHamburgerOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] animate-fade-in-backdrop"
            onClick={() => setIsMobileHamburgerOpen(false)}
          />
          {/* Menu Panel */}
          <div className="lg:hidden fixed top-0 right-0 bottom-0 h-[100vh] w-80 max-w-[85vw] bg-[#0f0f0f] border-l border-white/10 z-[201] overflow-y-auto animate-slide-in-from-right">
            <div className="flex flex-col h-full min-h-[100vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h2 className="text-lg font-bold text-white">Menu</h2>
                <button
                  onClick={() => setIsMobileHamburgerOpen(false)}
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
                           (user?.email?.replace('@movpey.local', '') || user?.email || '')}
                        </p>
                      </div>
                      <Link
                        href="/tai-khoan"
                        className="block px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                        onClick={() => setIsMobileHamburgerOpen(false)}
                      >
                        Tài khoản
                      </Link>
                      <Link
                        href="/yeu-thich"
                        className="block px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
                        onClick={() => setIsMobileHamburgerOpen(false)}
                      >
                        Danh sách yêu thích
                      </Link>
                      <button
                        onClick={async () => {
                          await signOut();
                          router.push("/");
                          router.refresh();
                          setIsMobileHamburgerOpen(false);
                        }}
                        className="w-full px-4 py-3 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors text-left"
                      >
                        Đăng xuất
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setIsMobileHamburgerOpen(false);
                        setIsLoginModalOpen(true);
                      }}
                      className="w-full px-4 py-3 rounded-lg bg-[#F6C453] hover:bg-[#F6C453]/90 text-black font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <LogIn className="w-5 h-5" />
                      Đăng nhập
                    </button>
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
                        setIsMobileHamburgerOpen(false);
                        analytics.trackNavigation(item.href, 'header_mobile');
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
                      onClick={() => setIsMobileHamburgerOpen(false)}
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
                        onClick={() => setIsMobileHamburgerOpen(false)}
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
                        onClick={() => setIsMobileHamburgerOpen(false)}
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

      {/* Login Modal */}
      {!AUTH_DISABLED && (
        <LoginModal 
          open={isLoginModalOpen} 
          onOpenChange={setIsLoginModalOpen}
          onSwitchToSignup={() => setIsSignupModalOpen(true)}
        />
      )}
      
      {/* Signup Modal */}
      {!AUTH_DISABLED && (
        <SignupModal 
          open={isSignupModalOpen} 
          onOpenChange={setIsSignupModalOpen}
          onSwitchToLogin={() => setIsLoginModalOpen(true)}
        />
      )}
    </header>
  );
}
