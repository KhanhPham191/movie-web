"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { useRouter, usePathname } from "next/navigation";
import { Search } from "lucide-react";
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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const scrolledSearchInputRef = useRef<HTMLInputElement | null>(null);

  const hideSearch =
    pathname?.startsWith("/dang-nhap") ||
    pathname?.startsWith("/dang-ky") ||
    pathname?.startsWith("/quen-mat-khau") ||
    pathname?.startsWith("/dat-lai-mat-khau");

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

  // Autocomplete
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      setIsSuggestOpen(false);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      try {
        const items = await searchFilmsMerged(searchQuery.trim());
        const mapped = items.map((m) => {
          const imageUrl = m?.poster_url || m?.thumb_url || "";
          const thumb = imageUrl ? getImageUrl(imageUrl) : "";
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

        const sorted = mapped
          .sort((a, b) => b.score - a.score)
          .slice(0, 8)
          .map(({ score, ...rest }) => rest);

        setSuggestions(sorted);
        setIsSuggestOpen(sorted.length > 0);
      } catch {
        setSuggestions([]);
        setIsSuggestOpen(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // Auto focus scrolled search input
  useEffect(() => {
    if (isSearchOpen && isScrolled && scrolledSearchInputRef.current) {
      setTimeout(() => scrolledSearchInputRef.current?.focus(), 100);
    }
  }, [isSearchOpen, isScrolled]);

  // Clear on route change
  useEffect(() => {
    setSearchQuery("");
    setSuggestions([]);
    setIsSuggestOpen(false);
    setIsSearchOpen(false);
    setIsMobileSearchOpen(false);
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }, [pathname]);

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

  const handleSuggestionClick = (s: Suggestion) => {
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
    setIsSearchOpen(false);
    setIsMobileSearchOpen(false);
  };

  // Shared autocomplete dropdown
  const renderSuggestions = (suggestions: Suggestion[]) => (
    <>
      {suggestions.map((s) => (
        <button
          key={s.slug || s.name}
          type="button"
          className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3"
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
            />
          </form>
          {isSuggestOpen && suggestions.length > 0 && (
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
            className={`relative transition-all duration-300 ${
              isSearchOpen ? "w-56 md:w-72 lg:w-96 opacity-100" : "w-0 opacity-0 pointer-events-none"
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
                ref={scrolledSearchInputRef}
              />
            </form>

            {isSearchOpen && isSuggestOpen && suggestions.length > 0 && (
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
                style={{ fontSize: "16px" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          </div>

          {isSuggestOpen && suggestions.length > 0 && (
            <div className="px-3 pb-2">
              <div className="mt-2 rounded-xl bg-[#0f0f0f]/95 border border-white/10 shadow-xl max-h-[60vh] overflow-y-auto text-sm sm:text-base">
                {renderSuggestions(suggestions)}
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
