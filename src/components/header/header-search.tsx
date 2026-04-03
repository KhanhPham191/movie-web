"use client";

import { useState, useEffect, useRef, useDeferredValue, useCallback } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import { getImageUrl, searchFilmsMerged } from "@/lib/api";
import { analytics } from "@/lib/analytics";

interface HeaderSearchProps {
  isScrolled: boolean;
  onMobileSearchOpenChange?: (open: boolean) => void;
}

function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function calculateRelevanceScore(movieName: string, query: string): number {
  const normalizedName = normalizeString(movieName);
  const normalizedQuery = normalizeString(query);

  if (normalizedName === normalizedQuery) return 1000;
  if (normalizedName.startsWith(normalizedQuery))
    return 500 + (normalizedQuery.length / normalizedName.length) * 100;
  if (normalizedName.includes(normalizedQuery)) {
    const position = normalizedName.indexOf(normalizedQuery);
    return 200 + ((normalizedName.length - position) / normalizedName.length) * 50;
  }
  const queryWords = normalizedQuery.split(/\s+/).filter((w) => w.length > 0);
  const allWordsMatch = queryWords.every((word) => normalizedName.includes(word));
  if (allWordsMatch) return 100;
  const matchedWords = queryWords.filter((word) => normalizedName.includes(word)).length;
  if (matchedWords > 0) return (matchedWords / queryWords.length) * 50;
  return 0;
}

type Suggestion = {
  name: string;
  slug: string;
  thumb: string;
  current_episode?: string;
  quality?: string;
  time?: string;
};

export function HeaderSearch({ isScrolled, onMobileSearchOpenChange }: HeaderSearchProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isSuggestOpen, setIsSuggestOpen] = useState(false);
  const [isFetchingSuggestions, setIsFetchingSuggestions] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeSuggestionRequestRef = useRef(0);
  const suggestionCacheRef = useRef<Map<string, Suggestion[]>>(new Map());
  const scrolledSearchInputRef = useRef<HTMLInputElement | null>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const hideSearch =
    pathname?.startsWith("/dang-nhap") ||
    pathname?.startsWith("/dang-ky") ||
    pathname?.startsWith("/quen-mat-khau") ||
    pathname?.startsWith("/dat-lai-mat-khau");

  const closeSearchUI = useCallback(() => {
    setIsSuggestOpen(false);
    setSuggestions([]);
    setIsSearchOpen(false);
    setIsMobileSearchOpen(false);
    setIsFetchingSuggestions(false);
  }, []);

  const submitSearch = useCallback((term: string) => {
    const cleaned = term.trim();
    if (!cleaned) return;

    analytics.trackSearch(cleaned);
    router.push(`/tim-kiem?q=${encodeURIComponent(cleaned)}`);
    setSearchQuery("");
    setSuggestions([]);
    setIsSuggestOpen(false);
    setIsFetchingSuggestions(false);
  }, [router]);

  // Close search when scrolling to top (only when idle)
  useEffect(() => {
    if (!isScrolled && !isSuggestOpen && !searchQuery.trim()) {
      setIsSearchOpen(false);
    }
  }, [isScrolled, isSuggestOpen, searchQuery]);

  // Notify parent when mobile search opens/closes
  useEffect(() => {
    onMobileSearchOpenChange?.(isMobileSearchOpen);
  }, [isMobileSearchOpen, onMobileSearchOpenChange]);

  // Lock body scroll while mobile search is open to avoid jitter behind overlay.
  useEffect(() => {
    if (!isMobileSearchOpen) return;

    const previousOverflow = document.body.style.overflow;
    const previousTouchAction = document.body.style.touchAction;
    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.touchAction = previousTouchAction;
    };
  }, [isMobileSearchOpen]);

  // Allow quick close with Escape on both desktop and mobile.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      closeSearchUI();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closeSearchUI]);

  // Autocomplete
  useEffect(() => {
    const query = deferredSearchQuery.trim();

    if (query.length < 2) {
      setSuggestions([]);
      setIsSuggestOpen(false);
      setIsFetchingSuggestions(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    const normalizedQuery = normalizeString(query);
    const cached = suggestionCacheRef.current.get(normalizedQuery);
    if (cached) {
      setSuggestions(cached);
      setIsSuggestOpen(true);
      setIsFetchingSuggestions(false);
      return;
    }

    const requestId = ++activeSuggestionRequestRef.current;
    setIsSuggestOpen(true);
    setIsFetchingSuggestions(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const items = await searchFilmsMerged(query);
        const mapped = items.map((m) => {
          const imageUrl = m?.thumb_url || m?.poster_url || "";
          const thumb = imageUrl ? getImageUrl(imageUrl) : "";
          const finalThumb = thumb && thumb !== "/logo.svg" ? thumb : "";
          return {
            name: m?.name ?? "",
            slug: m?.slug ?? "",
            thumb: finalThumb,
            current_episode: m?.current_episode ?? "",
            quality: m?.quality ?? "",
            time: m?.time ?? "",
            score: calculateRelevanceScore(m?.name ?? "", query),
          };
        });

        const sorted = mapped
          .sort((a, b) => b.score - a.score)
          .slice(0, 8)
          .map(({ score, ...rest }) => rest);

        if (activeSuggestionRequestRef.current !== requestId) {
          return;
        }

        suggestionCacheRef.current.set(normalizedQuery, sorted);
        setSuggestions(sorted);
        setIsSuggestOpen(true);
      } catch {
        if (activeSuggestionRequestRef.current !== requestId) {
          return;
        }
        setSuggestions([]);
        setIsSuggestOpen(true);
      } finally {
        if (activeSuggestionRequestRef.current === requestId) {
          setIsFetchingSuggestions(false);
        }
      }
    }, 180);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [deferredSearchQuery]);

  // Auto focus scrolled search input
  useEffect(() => {
    if (isSearchOpen && isScrolled && scrolledSearchInputRef.current) {
      requestAnimationFrame(() => scrolledSearchInputRef.current?.focus());
    }
  }, [isSearchOpen, isScrolled]);

  // Auto focus mobile search input after overlay opens.
  useEffect(() => {
    if (!isMobileSearchOpen) return;
    requestAnimationFrame(() => mobileSearchInputRef.current?.focus());
  }, [isMobileSearchOpen]);

  // Clear on route change
  useEffect(() => {
    setSearchQuery("");
    setSuggestions([]);
    setIsSuggestOpen(false);
    setIsSearchOpen(false);
    setIsMobileSearchOpen(false);
    setIsFetchingSuggestions(false);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    activeSuggestionRequestRef.current += 1;
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    submitSearch(searchQuery);
    setIsMobileSearchOpen(false);
    setIsSearchOpen(false);
  };

  const handleSuggestionClick = (s: Suggestion) => {
    if (s.slug) {
      analytics.trackSearchSuggestionClick(searchQuery, s.name);
      router.push(`/phim/${s.slug}`);
    } else if (s.name) {
      analytics.trackSearch(searchQuery);
      router.push(`/tim-kiem?q=${encodeURIComponent(s.name)}`);
    }
    closeSearchUI();
    setSearchQuery("");
  };

  // Shared autocomplete dropdown
  const renderSuggestions = (items: Suggestion[]) => {
    if (isFetchingSuggestions) {
      return (
        <div className="px-4 py-5 flex items-center gap-2 text-white/70 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          Đang tìm phim phù hợp...
        </div>
      );
    }

    if (items.length === 0) {
      return (
        <div className="px-4 py-4 text-sm text-white/65">
          Không có gợi ý phù hợp. Nhấn Enter để tìm toàn bộ kết quả.
        </div>
      );
    }

    return (
      <>
        {items.map((s) => (
          <button
            key={s.slug || s.name}
            type="button"
            className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 touch-manipulation"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => handleSuggestionClick(s)}
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
              <div className="flex items-center gap-2 flex-wrap">
                {s.current_episode && (
                  <span className="text-xs text-white/70">{s.current_episode}</span>
                )}
                {s.quality && (
                  <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/80">
                    {s.quality}
                  </span>
                )}
                {s.time && <span className="text-xs text-white/60">{s.time}</span>}
              </div>
            </div>
          </button>
        ))}
      </>
    );
  };

  const trimmedQuery = searchQuery.trim();
  const showSuggestPanel = trimmedQuery.length >= 2 && isSuggestOpen;

  if (hideSearch) return null;

  return (
    <>
      {/* Desktop search — not scrolled */}
      {!isScrolled && (
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
              style={{ outline: "none", boxShadow: "none", fontSize: "16px" }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim().length >= 2) {
                  setIsSuggestOpen(true);
                }
              }}
            />
          </form>
          {showSuggestPanel && (
            <div className="absolute left-0 right-0 mt-2 rounded-xl bg-[#0f0f0f]/95 border border-white/10 shadow-xl max-h-[400px] overflow-y-auto text-sm sm:text-base z-50">
              {renderSuggestions(suggestions)}
            </div>
          )}
        </div>
      )}

      {/* Desktop search — scrolled */}
      {isScrolled && (
        <div className="hidden sm:flex items-center relative">
          {!isSearchOpen && (
            <button
              className="p-1.5 hover:text-gray-300 transition-colors"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search className="w-4 h-4" />
            </button>
          )}
          <div
            className={`absolute right-0 top-1/2 z-50 w-56 md:w-72 lg:w-96 -translate-y-1/2 origin-right transition-all duration-200 ${
              isSearchOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
            }`}
          >
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
                style={{ outline: "none", boxShadow: "none", fontSize: "16px" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) {
                    setIsSuggestOpen(true);
                  }
                }}
                ref={scrolledSearchInputRef}
              />
            </form>

            {isSearchOpen && showSuggestPanel && (
              <div className="absolute left-0 right-0 mt-2 rounded-xl bg-[#0f0f0f]/95 border border-white/10 shadow-xl max-h-[400px] overflow-y-auto text-sm sm:text-base z-50">
                {renderSuggestions(suggestions)}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile search icon */}
      <button
        className="sm:hidden p-1.5 hover:text-gray-300 transition-colors"
        onClick={() => setIsMobileSearchOpen(true)}
      >
        <Search className="w-4 h-4" />
      </button>

      {/* Mobile search overlay */}
      {isMobileSearchOpen && (
        <>
          <button
            type="button"
            className="sm:hidden fixed inset-0 z-[99] bg-black/65 backdrop-blur-[2px]"
            aria-label="Đóng tìm kiếm"
            onClick={() => setIsMobileSearchOpen(false)}
          />

          <div className="sm:hidden fixed inset-x-0 top-0 z-[100] bg-[#0f0f0f] border-b border-white/10 mobile-search pb-[max(8px,env(safe-area-inset-bottom))]">
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
                  ref={mobileSearchInputRef}
                  type="search"
                  placeholder="Tìm phim, diễn viên, thể loại..."
                  className="flex-1 bg-transparent text-base placeholder:text-gray-500 border-0 border-transparent outline-none focus:outline-none focus-visible:outline-none"
                  style={{ fontSize: "16px" }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchQuery.trim().length >= 2) {
                      setIsSuggestOpen(true);
                    }
                  }}
                />
                {isFetchingSuggestions && (
                  <Loader2 className="w-4 h-4 text-gray-400 ml-2 animate-spin" />
                )}
              </form>
            </div>

            {showSuggestPanel && (
              <div className="px-3 pb-2">
                <div className="mt-2 rounded-xl bg-[#0f0f0f]/95 border border-white/10 shadow-xl max-h-[65dvh] overflow-y-auto overscroll-contain text-sm sm:text-base">
                  {renderSuggestions(suggestions)}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
