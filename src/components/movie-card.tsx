"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { getFilmDetail, type FilmDetail } from "@/lib/api";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Play, Plus, ThumbsUp, ChevronDown, Volume2, VolumeX, Info, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { FilmItem } from "@/lib/api";
import { getImageUrl } from "@/lib/api";
import { isValidTime } from "@/lib/utils";
import { analytics } from "@/lib/analytics";
import { useFavorites } from "@/contexts/favorites-context";
import { useAuth } from "@/contexts/auth-context";

// Module-level cache: slug -> first episode slug (avoids re-fetching getFilmDetail)
const episodeSlugCache = new Map<string, string | null>();

interface MovieCardProps {
  movie: FilmItem;
  index?: number;
  variant?: "default" | "portrait" | "top10" | "newRelease" | "series" | "cinema";
  rank?: number;
  disableTilt?: boolean;
  /** Mark image as priority (above-fold, first 3 cards) */
  priority?: boolean;
  /** Shared drag state from parent carousel to block hover popup after drag */
  hasDraggedRef?: React.MutableRefObject<boolean>;
  /** Shared drag distance from parent carousel to block hover popup after drag */
  dragDistanceRef?: React.MutableRefObject<number>;
}

// Chuẩn hoá text số tập: "Hoàn tất (20/20)" -> "20/20"
function formatEpisodeLabel(episode?: string) {
  if (!episode) return "";
  const match = episode.match(/Hoàn tất\s*\(([^)]+)\)/i);
  if (match) return match[1]; // chỉ lấy "20/20"
  return episode;
}

function isPhimBoMovie(movie: FilmItem): boolean {
  if (movie.film_type?.toLowerCase() === "series") return true;
  return (movie.category || []).some(
    (c) => c.slug === "phim-bo" || /phim\s*bộ/i.test(c.name || "")
  );
}

/**
 * Phim lẻ: OPhim `film_type === "single"` (danh sách phim-le không có genre "phim-lẻ"),
 * hoặc category / heuristic cũ.
 */
function isPhimLeMovie(movie: FilmItem): boolean {
  const ft = movie.film_type?.toLowerCase();
  if (ft === "single") return true;
  if (ft === "series") return false;
  const cats = movie.category || [];
  if (cats.some((c) => c.slug === "phim-le" || /phim\s*lẻ/i.test(c.name || ""))) return true;
  if (isPhimBoMovie(movie)) return false;
  return movie.total_episodes === 1;
}

/** Badge tập trên card: phim lẻ không hiện FULL / số tập (chỉ phim bộ hiện). */
function getMovieCardEpisodeBadgeText(movie: FilmItem): string {
  if (isPhimLeMovie(movie)) return "";
  return formatEpisodeLabel(movie.current_episode);
}

// Parse episode info: extract "Phần X" and "Tập Y" separately
function parseEpisodeInfo(episode?: string): { part?: string; episode?: string } {
  if (!episode) return {};
  const partMatch = episode.match(/Phần\s*(\d+)/i);
  const epMatch = episode.match(/Tập\s*(\d+)/i) || episode.match(/(\d+)\s*\/\s*\d+/);
  return {
    part: partMatch ? `Phần ${partMatch[1]}` : undefined,
    episode: epMatch ? `Tập ${epMatch[1]}` : undefined,
  };
}

function getShortDescription(description?: string, maxLength: number = 120) {
  if (!description) return "";
  const clean = description.replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, Math.max(0, maxLength - 3))}...`;
}

/** Badge góc poster (cinema): không hiện Full HD / Vietsub — chỉ phần còn lại nếu có. */
function getCinemaCardBadgeText(quality?: string): string | null {
  if (!quality?.trim()) return null;
  const s = quality
    .replace(/\bfull\s*hd\b/gi, "")
    .replace(/\bfhd\b/gi, "")
    .replace(/\bhd\b/gi, "")
    .replace(/\b720p\b/gi, "")
    .replace(/\b1080p\b/gi, "")
    .replace(/\b2160p\b/gi, "")
    .replace(/\b4k\b/gi, "")
    .replace(/\bvietsub\b/gi, "")
    .replace(/\bvs\b/gi, "")
    .replace(/\btm\b/gi, "")
    .replace(/\blt\b/gi, "")
    .replace(/\blồng\s*tiếng\b/gi, "")
    .replace(/\bthuyết\s*minh\b/gi, "")
    .replace(/^\s*[-–—/|]\s*/g, "")
    .replace(/\s*[-–—/|]\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return s.length > 0 ? s.toUpperCase() : null;
}

/** Chất lượng nguồn cho popup / tooltip (HD, Cam, FHD, …). */
function getQualityStatusLabel(quality?: string): string | null {
  if (!quality?.trim()) return null;
  const q = quality.toLowerCase();
  if (/\bcam\b|camrip|hdcam|ts\b|telesync|workprint/.test(q)) return "Cam";
  if (/\b4k\b|2160p|uhd\b/.test(q)) return "4K";
  if (/\bfhd\b|1080p|bluray|blu-ray|bd\b|full\s*hd\b/.test(q)) return "FHD";
  if (/\bhd\b|720p/.test(q)) return "HD";
  return quality.trim().toUpperCase();
}

function getImdbScore(movie: FilmItem): string | null {
  // Prefer explicit IMDb numeric value; fallback to vote_average (0-10 scale).
  const parseScore = (value: unknown): number | null => {
    if (value == null) return null;
    const asString = String(value).trim();
    if (!asString) return null;
    const n = Number(asString);
    if (!Number.isFinite(n) || n <= 0 || n > 10) return null;
    return n;
  };

  const imdbScore = parseScore(movie.imdb);
  if (imdbScore != null) return imdbScore.toFixed(1);

  const voteAverageScore = parseScore(movie.vote_average);
  if (voteAverageScore != null) return voteAverageScore.toFixed(1);

  return null;
}

/**
 * Tách cụm ngôn ngữ — KHÔNG dùng \\s+ làm delimiter (sẽ cắt đôi "Thuyết Minh").
 * OPhim hay trả: "Vietsub + Thuyết Minh", "Vietsub | LT", ...
 */
function splitLanguageSegments(raw: string): string[] {
  const n = raw.normalize("NFC").trim();
  return n
    .split(/\s*[+|/&]\s*|(?:\s*,\s*)|(?:\s*·\s*)|(?:\s+và\s+)|(?:\s*[-–—]\s*)/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function langKeyToLabel(key: string): string | null {
  const k = key.toLowerCase().trim();
  if (k === "vs") return "Vietsub";
  if (k === "tm") return "Thuyết minh";
  if (k === "lt") return "Lồng tiếng";
  return null;
}

/** Gộp chuỗi `lang` + mảng `lang_keys` từ OPhim (ưu tiên đủ vs/tm/lt). */
function getPopupLanguageLine(language?: string, langKeys?: string[]): string | null {
  const labels = new Set<string>();

  if (langKeys?.length) {
    for (const k of langKeys) {
      const label = langKeyToLabel(k);
      if (label) labels.add(label);
    }
  }

  if (language?.trim()) {
    const full = language.normalize("NFC").trim();
    const lower = full.toLowerCase();
    const segments = splitLanguageSegments(full);
    const chunks = segments.length ? segments : [full];

    const isVietsubChunk = (s: string) => {
      const l = s.toLowerCase();
      return (
        l.includes("vietsub") ||
        /\bviet\s*sub\b/i.test(s) ||
        /\bvs\b/.test(l) ||
        l.includes("phụ đề") ||
        l.includes("subtitle") ||
        l.includes("subteam")
      );
    };
    const isThuyetMinhChunk = (s: string) => {
      const l = s.toLowerCase();
      return (
        l.includes("thuyết minh") ||
        l.includes("thuyet minh") ||
        /\btm\b/.test(l) ||
        /^tm$/i.test(s.trim())
      );
    };
    const isLongTiengChunk = (s: string) => {
      const l = s.toLowerCase();
      return (
        l.includes("lồng tiếng") ||
        l.includes("long tieng") ||
        l.includes("lồng") ||
        /\blt\b/.test(l) ||
        /^lt$/i.test(s.trim()) ||
        /\bvo\b/.test(l) ||
        l.includes("dubbing")
      );
    };

    for (const c of chunks) {
      if (isVietsubChunk(c)) labels.add("Vietsub");
      if (isThuyetMinhChunk(c)) labels.add("Thuyết minh");
      if (isLongTiengChunk(c)) labels.add("Lồng tiếng");
    }
    if (!labels.size) {
      if (isVietsubChunk(full)) labels.add("Vietsub");
      if (isThuyetMinhChunk(full)) labels.add("Thuyết minh");
      if (isLongTiengChunk(full)) labels.add("Lồng tiếng");
    }
    if (/vietsub/i.test(full) && /lt|lồng|long\s*tieng/i.test(lower)) {
      labels.add("Vietsub");
      labels.add("Lồng tiếng");
    }
  }

  const order = ["Vietsub", "Thuyết minh", "Lồng tiếng"] as const;
  const ordered = order.filter((x) => labels.has(x));
  return ordered.length ? ordered.join(" · ") : null;
}

export function MovieCard({
  movie,
  index = 0,
  variant = "default",
  rank,
  disableTilt = false,
  priority = false,
  hasDraggedRef,
  dragDistanceRef,
}: MovieCardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isHome = pathname === '/';
  const isFilmDetail = pathname?.startsWith('/phim/') || false;
  const { isFavorited, toggleFavorite, pendingSlugs } = useFavorites();
  const { isAuthenticated } = useAuth();
  const favorited = isFavorited(movie.slug);
  const favPending = pendingSlugs.has(movie.slug);
  const [isHovered, setIsHovered] = useState(false);
  const [isPortraitImage, setIsPortraitImage] = useState(false);
  const cardRef = useRef<HTMLAnchorElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [popupPosition, setPopupPosition] = useState<{ left: number; top: number; transformX: number; transformY: number } | null>(null);
  const positionFrameRef = useRef<number | null>(null);
  const hoverDelayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isNavigatingRef = useRef(false);
  // Use thumb_url for movie cards as primary image
  const imageUrl = getImageUrl(movie.thumb_url || movie.poster_url);
  const popupBackdropUrl = useMemo(() => getImageUrl(movie.poster_url), [movie.thumb_url, movie.poster_url]);
  const shortDescription = useMemo(() => getShortDescription(movie.description, 140), [movie.description]);
  const year = useMemo(() => {
    const parsed = movie.created ? new Date(movie.created).getFullYear() : undefined;
    return !Number.isNaN(parsed) ? parsed : undefined;
  }, [movie.created]);
  const shouldShowPopup = variant !== "portrait";
  const imdbScore = useMemo(() => getImdbScore(movie), [movie]);
  /** Tooltip gốc (mobile / hover): chất lượng + phụ đề — không dán lên poster. */
  const cardTooltipSummary = useMemo(() => {
    const parts: string[] = [];
    const q = getQualityStatusLabel(movie.quality);
    const lang = getPopupLanguageLine(movie.language, movie.lang_keys);
    if (q) parts.push(`Chất lượng: ${q}`);
    if (lang) parts.push(`Phụ đề / thoại: ${lang}`);
    return parts.length ? parts.join(" · ") : undefined;
  }, [movie.quality, movie.language, movie.lang_keys]);
  const episodeBadgeText = getMovieCardEpisodeBadgeText(movie);

  const selectFirstEpisodeSlug = (detail?: FilmDetail | null) => {
    const eps = detail?.episodes || [];
    if (!eps.length) return null;
    const serverPriority = ["vietsub", "lồng", "long", "thuyết", "thuyet", "tm"];
    const normalize = (s: string) => s.toLowerCase();
    const pickServer =
      eps.find((s) => serverPriority.some((p) => normalize(s.server_name || "").includes(p))) ||
      eps[0];
    const firstEpisode = pickServer?.items?.[0];
    return firstEpisode?.slug || null;
  };

  const handleMovieClick = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    // Track movie click event
    analytics.trackMovieClick(movie.name, movie.slug, variant || 'default', isHome, isFilmDetail);
  };

  const handleWatchNow = async (e: React.MouseEvent, fromPopup: boolean = false) => {
    e.preventDefault();
    e.stopPropagation();
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    
    // Track watch now event - check if from popup
    if (fromPopup && isHome) {
      analytics.trackHomePopupWatchNow(movie.name, movie.slug);
    } else if (fromPopup && isFilmDetail) {
      analytics.trackFilmDetailPopupWatchNow(movie.name, movie.slug);
    } else {
      analytics.trackWatchNow(movie.name, movie.slug, variant || 'default', isHome, isFilmDetail);
    }
    
    try {
      // Check cache first to avoid redundant API call
      // Chỉ dùng cache nếu có giá trị hợp lệ (string), bỏ qua null (lỗi trước đó)
      let epSlug = episodeSlugCache.get(movie.slug) || undefined;
      if (epSlug === undefined) {
        const detailRes = await getFilmDetail(movie.slug);
        epSlug = selectFirstEpisodeSlug(detailRes.movie) || undefined;
        // Chỉ cache khi tìm được episode slug, không cache null để retry lần sau
        if (epSlug) {
          episodeSlugCache.set(movie.slug, epSlug);
        }
      }
      if (epSlug) {
        // Dùng router.push thay vì window.location.href để client-side navigation nhanh hơn
        router.push(`/xem-phim/${movie.slug}/${epSlug}`);
      } else {
        // Fallback: chuyển đến trang chi tiết phim nếu không tìm được episode
        router.push(`/phim/${movie.slug}`);
      }
    } catch (err) {
      // Fallback khi API lỗi: chuyển đến trang chi tiết phim
      router.push(`/phim/${movie.slug}`);
    } finally {
      isNavigatingRef.current = false;
    }
  };
  
  const updatePopupPosition = useCallback(() => {
    if (!isHovered || !shouldShowPopup || !cardRef.current) return;
    
    const cardRect = cardRef.current.getBoundingClientRect();
    
    // Popup dimensions (estimated - typical popup size)
    const popupWidth = Math.min(480, window.innerWidth * 0.82);
    const popupHeight = 450; // Estimated height including image and content
    
    // Viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const padding = 16; // Padding from viewport edges
    
    // Center position of card
    const cardCenterX = cardRect.left + cardRect.width / 2;
    const cardCenterY = cardRect.top + cardRect.height / 2;
    
    // Calculate transform offsets to keep popup within viewport
    let transformX = 0;
    let transformY = 0;
    
    // Check horizontal boundaries
    const halfPopupWidth = popupWidth / 2;
    if (cardCenterX - halfPopupWidth < padding) {
      // Popup would overflow left edge - shift right
      transformX = padding - (cardCenterX - halfPopupWidth);
    } else if (cardCenterX + halfPopupWidth > viewportWidth - padding) {
      // Popup would overflow right edge - shift left
      transformX = (viewportWidth - padding) - (cardCenterX + halfPopupWidth);
    }
    
    // Check vertical boundaries
    const halfPopupHeight = popupHeight / 2;
    if (cardCenterY - halfPopupHeight < padding) {
      // Popup would overflow top edge - shift down
      transformY = padding - (cardCenterY - halfPopupHeight);
    } else if (cardCenterY + halfPopupHeight > viewportHeight - padding) {
      // Popup would overflow bottom edge - shift up
      transformY = (viewportHeight - padding) - (cardCenterY + halfPopupHeight);
    }
    
    setPopupPosition({
      left: cardCenterX,
      top: cardCenterY,
      transformX,
      transformY,
    });
  }, [isHovered, shouldShowPopup]);
  
  // Refine popup position after it renders to get accurate dimensions
  useEffect(() => {
    if (!isHovered || !popupPosition || !popupRef.current || !cardRef.current) return;
    
    const refinePosition = () => {
      if (!popupRef.current || !cardRef.current) return;
      
      const popupRect = popupRef.current.getBoundingClientRect();
      const cardRect = cardRef.current.getBoundingClientRect();
      
      // Actual popup dimensions
      const popupWidth = popupRect.width;
      const popupHeight = popupRect.height;
      
      // Viewport dimensions
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 16;
      
      // Card center position
      const cardCenterX = cardRect.left + cardRect.width / 2;
      const cardCenterY = cardRect.top + cardRect.height / 2;
      
      // Calculate transform offsets
      let transformX = 0;
      let transformY = 0;
      
      // Check horizontal boundaries
      const halfPopupWidth = popupWidth / 2;
      if (cardCenterX - halfPopupWidth < padding) {
        transformX = padding - (cardCenterX - halfPopupWidth);
      } else if (cardCenterX + halfPopupWidth > viewportWidth - padding) {
        transformX = (viewportWidth - padding) - (cardCenterX + halfPopupWidth);
      }
      
      // Check vertical boundaries
      const halfPopupHeight = popupHeight / 2;
      if (cardCenterY - halfPopupHeight < padding) {
        transformY = padding - (cardCenterY - halfPopupHeight);
      } else if (cardCenterY + halfPopupHeight > viewportHeight - padding) {
        transformY = (viewportHeight - padding) - (cardCenterY + halfPopupHeight);
      }
      
      // Only update if transform changed significantly (avoid infinite loop)
      if (Math.abs(transformX - popupPosition.transformX) > 2 || Math.abs(transformY - popupPosition.transformY) > 2) {
        setPopupPosition({
          left: cardCenterX,
          top: cardCenterY,
          transformX,
          transformY,
        });
      }
    };
    
    // Small delay to ensure popup is rendered and measured
    const timeoutId = setTimeout(refinePosition, 50);
    return () => clearTimeout(timeoutId);
  }, [isHovered, popupPosition]);

  useEffect(() => {
    if (!isHovered || !shouldShowPopup) {
      setPopupPosition(null);
      return;
    }

    // Calculate position once on hover, then update on scroll/resize events only
    updatePopupPosition();

    const handleScrollOrResize = () => {
      // Use rAF to batch with browser paint — but only one frame, not a loop
      if (positionFrameRef.current) cancelAnimationFrame(positionFrameRef.current);
      positionFrameRef.current = requestAnimationFrame(() => {
        updatePopupPosition();
        positionFrameRef.current = null;
      });
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    
    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      if (positionFrameRef.current) {
        cancelAnimationFrame(positionFrameRef.current);
        positionFrameRef.current = null;
      }
    };
  }, [isHovered, shouldShowPopup, updatePopupPosition]);

  useEffect(() => {
    setIsPortraitImage(false);
  }, [imageUrl]);

  useEffect(() => {
    return () => {
      if (hoverDelayRef.current) {
        clearTimeout(hoverDelayRef.current);
        hoverDelayRef.current = null;
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
    };
  }, []);

  const handleMouseEnterWithDelay = () => {
    const wasDragging = hasDraggedRef?.current || (dragDistanceRef?.current || 0) > 5;
    if (wasDragging) return;
    if (hoverDelayRef.current) clearTimeout(hoverDelayRef.current);
    hoverDelayRef.current = setTimeout(() => {
      setIsHovered(true);
      // Track popup show event when hover displays popup
      analytics.trackMoviePopupShow(movie.name, movie.slug, isHome, isFilmDetail);
    }, 500);
  };

  const handleMouseLeaveWithCancel = (e?: React.MouseEvent) => {
    if (hoverDelayRef.current) {
      clearTimeout(hoverDelayRef.current);
      hoverDelayRef.current = null;
    }
    const nextTarget = e?.relatedTarget as Node | null;
    if (nextTarget && popupRef.current && popupRef.current.contains(nextTarget)) {
      return;
    }
    setIsHovered(false);
  };

  const popupContent = useMemo(() => {
    if (!isHovered || !popupPosition || !shouldShowPopup) return null;
    const episodeInfo = parseEpisodeInfo(movie.current_episode);
    const popupLangLine = getPopupLanguageLine(movie.language, movie.lang_keys);
    const popupQuality = getQualityStatusLabel(movie.quality);
    const isActive = isHovered && !!popupPosition;

    return (
      <div
        ref={popupRef}
        className="pointer-events-auto fixed z-[9999] w-[min(480px,82vw)] hidden lg:block transition-all duration-320 ease-[cubic-bezier(0.22,0.61,0.36,1)]"
        style={{
          left: `${popupPosition.left}px`,
          top: `${popupPosition.top}px`,
          transform: `translate(calc(-50% + ${popupPosition.transformX}px), calc(-50% + ${popupPosition.transformY}px)) translateY(${isActive ? "0px" : "10px"}) scale(${isActive ? 1 : 0.95})`,
          opacity: isActive ? 1 : 0,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={(e) => {
          const nextTarget = e?.relatedTarget as Node | null;
          if (nextTarget && cardRef.current && cardRef.current.contains(nextTarget)) {
            return;
          }
          setIsHovered(false);
        }}
      >
        <div className="rounded-xl border border-white/15 bg-[#050509]/95 overflow-hidden shadow-[0_18px_40px_rgba(0,0,0,0.85)] backdrop-blur-md">
          {popupBackdropUrl && (
            <div className="relative aspect-video w-full overflow-hidden bg-[#0a0a0a]">
              <Image
                src={popupBackdropUrl}
                alt={movie.name}
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 0px, 480px"
                loading="lazy"
              />
            </div>
          )}

          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1">
              <h3 className="text-[18px] font-bold text-white line-clamp-2">
                {movie.name}
              </h3>
              {movie.original_name && movie.original_name !== movie.name && (
                <p className="text-[14px] text-[#F6C453] line-clamp-1">
                  {movie.original_name}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {imdbScore && (
                <span className="inline-flex items-center rounded-sm bg-[#F5C518] px-2.5 py-1.5 text-[12px] font-bold text-black">
                  IMDb {imdbScore}
                </span>
              )}
              <span className="inline-flex items-center rounded-sm bg-black/80 px-2.5 py-1.5 text-[12px] font-semibold text-white border border-white/20">
                T16
              </span>
              {year && (
                <span className="inline-flex items-center rounded-sm bg-white px-2.5 py-1.5 text-[12px] font-semibold text-black">
                  {year}
                </span>
              )}
              {!isPhimLeMovie(movie) && episodeInfo.part && (
                <span className="inline-flex items-center rounded-sm bg-white px-2.5 py-1.5 text-[12px] font-semibold text-black">
                  {episodeInfo.part}
                </span>
              )}
              {!isPhimLeMovie(movie) && episodeInfo.episode && (
                <span className="inline-flex items-center rounded-sm bg-white px-2.5 py-1.5 text-[12px] font-semibold text-black">
                  {episodeInfo.episode}
                </span>
              )}
            </div>

            {movie.category && movie.category.length > 0 && (
              <div className="flex flex-wrap items-center gap-1 text-[13px] text-white">
                {movie.category.slice(0, 4).map((cat, i) => (
                  <span key={`${cat.id}-${i}`}>
                    {cat.name}
                    {i < Math.min(movie.category.length, 4) - 1 && (
                      <span className="mx-2 text-gray-500">•</span>
                    )}
                  </span>
                ))}
              </div>
            )}

            {(popupLangLine || popupQuality) && (
              <div className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[12px] leading-relaxed text-gray-200">
                {popupQuality && (
                  <p>
                    <span className="text-gray-500">Chất lượng:</span> {popupQuality}
                  </p>
                )}
                {popupLangLine && (
                  <p className={popupQuality ? "mt-1" : ""}>
                    <span className="text-gray-500">Phụ đề / thoại:</span> {popupLangLine}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                data-popup-button
                className="pointer-events-auto cursor-pointer bg-[#F6C453] hover:bg-[#F6C453]/90 text-black font-bold text-base rounded-md flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
                style={{ width: "139.52px", height: "46px" }}
                onClick={(e) => handleWatchNow(e, true)}
              >
                <Play className="w-5 h-5 fill-black shrink-0" />
                <span>Xem ngay</span>
              </button>
              <button
                type="button"
                data-popup-button
                disabled={favPending}
                className={`pointer-events-auto font-semibold text-base px-5 py-3.5 rounded-md flex items-center justify-center gap-2 transition-all whitespace-nowrap shrink-0 ${
                  favorited
                    ? "bg-[#F6C453]/15 hover:bg-[#F6C453]/25 text-[#F6C453] border border-[#F6C453]/40"
                    : "bg-[#1a1a1a] hover:bg-[#252525] text-white border border-white/20"
                } ${favPending ? "opacity-60 cursor-not-allowed" : ""}`}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isAuthenticated) {
                    window.location.href = "/dang-nhap";
                    return;
                  }
                  if (isHome) analytics.trackHomePopupLike(movie.name, movie.slug);
                  else if (isFilmDetail) analytics.trackFilmDetailPopupLike(movie.name, movie.slug);
                  toggleFavorite({
                    movie_slug: movie.slug,
                    movie_name: movie.name,
                    movie_thumb: movie.thumb_url || movie.poster_url || "",
                    movie_poster: movie.poster_url || undefined,
                    movie_year: movie.year ? Number(movie.year) : undefined,
                    movie_quality: movie.quality || undefined,
                  });
                }}
              >
                <Heart className={`w-5 h-5 shrink-0 transition-all ${favorited ? "fill-[#F6C453] text-[#F6C453]" : ""}`} />
                <span>{favorited ? "Đã thích" : "Thích"}</span>
              </button>
              <Link
                href={`/phim/${movie.slug}`}
                data-popup-button
                className="pointer-events-auto bg-[#1a1a1a] hover:bg-[#252525] text-white border border-white/20 font-semibold text-base px-5 py-3.5 rounded-md flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (isHome) {
                      analytics.trackHomePopupDetail(movie.name, movie.slug);
                    } else if (isFilmDetail) {
                      analytics.trackFilmDetailPopupDetail(movie.name, movie.slug);
                    } else {
                      analytics.trackDetailFilms(movie.name, movie.slug, 'popup', isFilmDetail);
                    }
                  }}
              >
                <Info className="w-5 h-5 shrink-0" />
                <span>Chi tiết</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }, [
    isHovered,
    popupPosition,
    shouldShowPopup,
    popupBackdropUrl,
    variant,
    movie.name,
    movie.original_name,
    movie.current_episode,
    movie.film_type,
    movie.category,
    movie.quality,
    movie.language,
    movie.lang_keys,
    year,
    imdbScore,
    favorited,
    favPending,
    isAuthenticated,
    toggleFavorite,
  ]);

  // Top 10 variant - Netflix style with badge
  if (variant === "top10" && rank) {
    return (
      <Link
        href={`/phim/${movie.slug}`}
        className="cursor-pointer"
        onClick={handleMovieClick}
        title={cardTooltipSummary}
      >
        <div className="group relative flex flex-col h-full">
          {/* Poster */}
          <div 
            className="relative aspect-[2/3] w-full rounded-[10px] overflow-hidden transition-all duration-200 sm:duration-500 ease-out sm:group-hover:scale-[1.03] bg-muted flex-shrink-0 border border-transparent sm:group-hover:border-[rgba(246,196,83,0.3)]"
            style={{
              willChange: "transform",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: "translateZ(0)",
            }}
          >
            {/* Overlay vàng khi hover */}
            <div className="absolute inset-0 bg-[rgba(246,196,83,0.15)] opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 sm:duration-500 ease-in-out pointer-events-none z-10" />
            {/* Hover Overlay - Subtle */}
            <div className="absolute inset-0 bg-black/20 opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 sm:duration-500 ease-in-out z-10" />
            <Image
              src={imageUrl}
              alt={movie.name}
              fill
              className="object-cover object-center transition-transform duration-200 sm:duration-500 ease-in-out sm:group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 150px, (max-width: 1024px) 200px, 250px"
              {...(priority ? { priority: true } : { loading: "lazy" })}
            />
            
            {/* Rank Badge - Top Left Corner */}
            <div className="absolute top-0 left-0 w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center rounded-br-md shadow-lg z-20">
              <span className="text-white font-black text-xl md:text-2xl">{rank}</span>
            </div>
            
            {/* Top 10 Badge - Bottom */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 z-20">
              <div className="flex items-center gap-1">
                <div className="w-6 h-6 bg-red-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">T</span>
                </div>
                <span className="text-white text-xs font-semibold">Top 10</span>
              </div>
            </div>
            
            {/* Play Button - Center on Hover */}
            <div className="absolute inset-0 flex items-center justify-center z-30 opacity-0 sm:group-hover:opacity-100 transition-all duration-200 sm:duration-500 ease-in-out">
              <div className="relative transform scale-0 sm:group-hover:scale-100 transition-transform duration-200 sm:duration-500 ease-in-out">
                <div className="absolute inset-0 bg-[#F6C453] rounded-full blur-lg opacity-50 sm:group-hover:opacity-70 transition-opacity duration-200 sm:duration-500 ease-in-out" />
                <button
                  type="button"
                  className="relative w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-[#F6C453] flex items-center justify-center shadow-xl cursor-pointer"
                  aria-label="Phát phim"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`/phim/${movie.slug}`);
                  }}
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white fill-white ml-0.5" />
                </button>
              </div>
            </div>
          </div>
          
          {/* Title below */}
          <div className="mt-2 space-y-1 flex-shrink-0">
            <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5rem] sm:group-hover:text-[#F6C453] transition-colors duration-200 sm:duration-500 ease-in-out">
              {movie.name}
            </h3>
            {movie.original_name && movie.original_name !== movie.name && (
              <p className="text-sm text-[#F6C453]/95 font-semibold leading-snug line-clamp-1">
                {movie.original_name}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // Portrait variant (vertical poster)
  if (variant === "portrait") {
    return (
      <Link
        href={`/phim/${movie.slug}`}
        className="cursor-pointer"
        onClick={handleMovieClick}
        title={cardTooltipSummary}
      >
        <div 
          className="group relative flex flex-col h-full"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="relative aspect-[2/3] w-full rounded-[10px] overflow-hidden bg-muted transition-all duration-200 sm:duration-500 ease-in-out sm:group-hover:scale-[1.03] group-hover:z-10 flex-shrink-0 border border-transparent sm:group-hover:border-[rgba(246,196,83,0.3)]">
            {/* Overlay vàng khi hover */}
            <div className="absolute inset-0 bg-[rgba(246,196,83,0.15)] opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 sm:duration-500 ease-in-out pointer-events-none z-10" />
            {/* Hover Overlay - Subtle */}
            <div className="absolute inset-0 bg-black/20 opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 sm:duration-500 ease-in-out z-10" />
            <Image
              src={imageUrl}
              alt={movie.name}
              fill
              className="object-cover object-center transition-transform duration-200 sm:duration-500 ease-in-out sm:group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 150px, (max-width: 1024px) 200px, 250px"
              {...(priority ? { priority: true } : { loading: "lazy" })}
            />
            {episodeBadgeText && (
              <Badge className="absolute bottom-2 right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 text-[10px] sm:text-[11px] font-bold px-2.5 py-1 shadow-lg z-20">
                {episodeBadgeText}
              </Badge>
            )}
            
            {/* Play Button - Center on Hover */}
            <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out">
                <div className="relative transform scale-0 group-hover:scale-100 transition-transform duration-500 ease-in-out">
                <div className="absolute inset-0 bg-[#F6C453] rounded-full blur-lg opacity-50 group-hover:opacity-70 transition-opacity duration-500 ease-in-out" />
                <button
                  type="button"
                  className="relative w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-[#F6C453] flex items-center justify-center shadow-xl cursor-pointer"
                  aria-label="Phát phim"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`/phim/${movie.slug}`);
                  }}
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white fill-white ml-0.5" />
                </button>
              </div>
            </div>
          </div>
          <div className="mt-2 space-y-1 flex-shrink-0">
            <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5rem] sm:group-hover:text-[#F6C453] transition-colors duration-200 sm:duration-500 ease-in-out">
              {movie.name}
            </h3>
            {movie.original_name && movie.original_name !== movie.name && (
              <p className="text-sm text-[#F6C453]/95 font-semibold leading-snug line-clamp-1">
                {movie.original_name}
              </p>
            )}
          </div>
        </div>
      </Link>
    );
  }

  // New Release variant - poster + big rank + info, giống layout Top mới
  // Áp dụng cho Top 10 phim lẻ và Top 10 phim bộ
  if (variant === "newRelease") {
    // Xác định hướng nghiêng xen kẽ: số lẻ nghiêng trái, số chẵn nghiêng phải
    const order = rank ?? index + 1;
    const isTiltLeft = order % 2 === 1; // Card lẻ (1, 3, 5...) nghiêng trái
    // Use thumb_url for main card image and hover popup
    const thumbUrl = getImageUrl(movie.thumb_url);
    
    // Clip-path polygon từ tramphim - tạo hình dạng nghiêng với góc bo tròn
    // Clip-path gốc nghiêng về bên phải, đảo ngược bằng scaleX(-1) để nghiêng trái
    const clipPathPolygon = "polygon(5.761% 100%, 94.239% 100%, 94.239% 100%, 95.174% 99.95%, 96.06% 99.803%, 96.887% 99.569%, 97.642% 99.256%, 98.313% 98.87%, 98.889% 98.421%, 99.357% 97.915%, 99.706% 97.362%, 99.925% 96.768%, 100% 96.142%, 100% 3.858%, 100% 3.858%, 99.913% 3.185%, 99.662% 2.552%, 99.263% 1.968%, 98.731% 1.442%, 98.08% .984%, 97.328% .602%, 96.488% .306%, 95.577% .105%, 94.609% .008%, 93.6% .024%, 5.121% 6.625%, 5.121% 6.625%, 4.269% 6.732%, 3.468% 6.919%, 2.728% 7.178%, 2.058% 7.503%, 1.467% 7.887%, .962% 8.323%, .555% 8.805%, .253% 9.326%, .065% 9.88%, 0% 10.459%, 0% 96.142%, 0% 96.142%, .075% 96.768%, .294% 97.362%, .643% 97.915%, 1.111% 98.421%, 1.687% 98.87%, 2.358% 99.256%, 3.113% 99.569%, 3.94% 99.803%, 4.826% 99.95%, 5.761% 100%)";

    return (
      <>
        {/* Hover Popup Detail - render qua portal để fixed không bị ảnh hưởng transform của carousel */}
        {popupContent &&
          (typeof window !== "undefined"
            ? createPortal(popupContent, document.body)
            : popupContent)}
        <Link
          ref={cardRef}
          href={`/phim/${movie.slug}`}
          className="relative block cursor-pointer"
          onClick={handleMovieClick}
          title={cardTooltipSummary}
        >
          <div
            className="group relative flex flex-col items-start h-full pt-4 sm:pt-5"
            onMouseEnter={handleMouseEnterWithDelay}
            onMouseLeave={handleMouseLeaveWithCancel}
          >
            {/* Poster - Sử dụng clip-path polygon để tạo hình dạng nghiêng như tramphim */}
            <div
            className="relative aspect-[2/3] w-full bg-muted transition-all duration-200 sm:duration-500 ease-in-out sm:group-hover:shadow-2xl flex-shrink-0"
            style={{
              clipPath: clipPathPolygon,
              transform: `scale(${isHovered ? 1.01 : 1}) ${isTiltLeft ? 'scaleX(-1)' : ''}`,
              transformStyle: "preserve-3d",
              transformOrigin: "center center",
              boxShadow: `0 8px 24px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 0 0 1px rgba(246,196,83,0.3)`,
            }}
          >
            {/* Inner container với overflow-hidden - đảo ngược lại nội dung cho card nghiêng trái */}
            <div 
              className="absolute inset-0 overflow-hidden"
              style={{
                transform: isTiltLeft ? 'scaleX(-1)' : 'none',
              }}
            >
              {/* Overlay vàng khi hover */}
              <div className="absolute inset-0 bg-[rgba(246,196,83,0.15)] opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 sm:duration-500 ease-in-out pointer-events-none z-10" />
              {/* Hover Overlay - Subtle */}
              <div className="absolute inset-0 bg-black/20 opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 sm:duration-500 ease-in-out z-10" />
            <Image
              src={imageUrl}
              alt={movie.name}
              fill
              className="object-cover object-center transition-transform duration-200 sm:duration-500 ease-in-out sm:group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 150px, (max-width: 1024px) 200px, 250px"
              {...(priority ? { priority: true } : { loading: "lazy" })}
            />
              {episodeBadgeText && (
                <Badge className="absolute bottom-2 right-2 bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 text-[10px] sm:text-[11px] font-bold px-2.5 py-1 shadow-lg z-20">
                  {episodeBadgeText}
                </Badge>
              )}
              
              {/* Play Button - Center on Hover */}
              <div className="absolute inset-0 flex items-center justify-center z-30 opacity-0 sm:group-hover:opacity-100 transition-all duration-200 sm:duration-500 ease-in-out">
                <div className="relative transform scale-0 sm:group-hover:scale-100 transition-transform duration-200 sm:duration-500 ease-in-out">
                  <div className="absolute inset-0 bg-[#F6C453] rounded-full blur-lg opacity-50 sm:group-hover:opacity-70 transition-opacity duration-200 sm:duration-500 ease-in-out" />
                  <button
                    type="button"
                    className="relative w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-[#F6C453] flex items-center justify-center shadow-xl"
                    aria-label="Phát phim"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      router.push(`/phim/${movie.slug}`);
                    }}
                  >
                    <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white fill-white ml-0.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Rank + Info - Giảm spacing và kích thước rank để compact hơn */}
          <div className="mt-2 flex items-start gap-1.5 w-full flex-shrink-0">
            {rank && (
              <div className="text-3xl xs:text-4xl sm:text-5xl md:text-6xl font-black leading-none flex-shrink-0 text-transparent bg-clip-text bg-gradient-to-b from-[#F6C453] to-[#FFF8F0] drop-shadow-[0_0_10px_rgba(246,196,83,0.65)]">
                {rank}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm xs:text-base font-semibold text-white line-clamp-2 min-h-[2.25rem] sm:group-hover:text-[#F6C453] transition-colors duration-200 sm:duration-500 ease-in-out">
                {movie.name}
              </h3>
              {movie.original_name && movie.original_name !== movie.name && (
                <p className="text-xs xs:text-sm text-[#F6C453]/95 font-semibold leading-snug line-clamp-1">
                  {movie.original_name}
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>
      </>
    );
  }

  // Series variant - poster + info, không popup chi tiết khi hover
  if (variant === "series") {
    // Use thumb_url for main card and popup
    const thumbUrl = getImageUrl(movie.thumb_url || movie.poster_url);

    return (
      <>
        {popupContent &&
          (typeof window !== "undefined"
            ? createPortal(popupContent, document.body)
            : popupContent)}
        <Link
          ref={cardRef}
          href={`/phim/${movie.slug}`}
          className="cursor-pointer"
          title={cardTooltipSummary}
        >
          <div
            className="group relative flex flex-col items-start h-full"
            onMouseEnter={handleMouseEnterWithDelay}
            onMouseLeave={handleMouseLeaveWithCancel}
          >
            {/* Poster */}
            <div
            className="relative aspect-[2/3] w-full rounded-[10px] overflow-hidden bg-muted transition-all duration-200 sm:duration-300 ease-in-out sm:group-hover:shadow-2xl flex-shrink-0 border border-transparent sm:group-hover:border-[rgba(246,196,83,0.3)]"
            style={{
              transform: isHovered ? "scale(1.01)" : "none",
              transformStyle: "flat",
            }}
          >
            {/* Overlay vàng khi hover */}
            <div className="absolute inset-0 bg-[rgba(246,196,83,0.15)] opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 sm:duration-500 ease-in-out pointer-events-none z-10" />
            {/* Hover Overlay - Subtle */}
            <div className="absolute inset-0 bg-black/20 opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 sm:duration-500 ease-in-out z-10" />
            <Image
              src={imageUrl}
              alt={movie.name}
              fill
              className="object-cover object-center transition-transform duration-200 sm:duration-500 ease-in-out sm:group-hover:scale-[1.03]"
              sizes="(max-width: 640px) 150px, (max-width: 1024px) 200px, 250px"
              {...(priority ? { priority: true } : { loading: "lazy" })}
            />
            {episodeBadgeText && (
              <Badge className="absolute bottom-2 right-2 bg-gradient-to-r from-red-600 via-orange-500 to-orange-400 text-white border-0 text-[10px] sm:text-[11px] font-bold px-2.5 py-1 shadow-lg z-20">
                {episodeBadgeText}
              </Badge>
            )}
            
            {/* Play Button - Center on Hover */}
            <div className="absolute inset-0 flex items-center justify-center z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out">
              <div className="relative transform scale-0 group-hover:scale-100 transition-transform duration-500 ease-in-out">
                <div className="absolute inset-0 bg-[#F6C453] rounded-full blur-lg opacity-50 group-hover:opacity-70 transition-opacity duration-500 ease-in-out" />
                <button
                  type="button"
                  className="relative w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-[#F6C453] flex items-center justify-center shadow-xl cursor-pointer"
                  aria-label="Phát phim"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    router.push(`/phim/${movie.slug}`);
                  }}
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-white fill-white ml-0.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="mt-3 w-full flex-shrink-0">
            <h3 className="text-sm xs:text-base font-semibold text-white line-clamp-2 min-h-[2.5rem] sm:group-hover:text-[#F6C453] transition-colors duration-200 sm:duration-500 ease-out">
              {movie.name}
            </h3>
            {movie.original_name && movie.original_name !== movie.name && (
              <p className="text-sm text-[#F6C453]/95 font-semibold leading-snug line-clamp-1">
                {movie.original_name}
              </p>
            )}
          </div>
        </div>
        </Link>
      </>
    );
  }

  // Cinema — poster 2:3 kiểu rạp: khung poster, không dải màu trên đầu; gradient chỉ ở đáy để đọc chữ
  if (variant === "cinema") {
    const posterUrl = getImageUrl(movie.thumb_url || movie.poster_url);
    const shortDescription = getShortDescription(movie.description, 88);
    const cinemaBadgeText = getCinemaCardBadgeText(movie.quality);

    const year =
      movie.created && !Number.isNaN(new Date(movie.created).getFullYear())
        ? new Date(movie.created).getFullYear()
        : undefined;

    return (
      <>
        {popupContent &&
          (typeof window !== "undefined"
            ? createPortal(popupContent, document.body)
            : popupContent)}
        <Link
          ref={cardRef}
          href={`/phim/${movie.slug}`}
          className="relative block cursor-pointer h-full"
          onClick={handleMovieClick}
          title={cardTooltipSummary}
        >
          <div
            className="group relative w-full max-w-full h-full flex flex-col"
            onMouseEnter={handleMouseEnterWithDelay}
            onMouseLeave={handleMouseLeaveWithCancel}
          >
            <div
              className="relative aspect-[2/3] w-full rounded-xl overflow-hidden bg-[#0b0b0b] flex-shrink-0 border border-white/[0.12] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.04),0_12px_40px_rgba(0,0,0,0.55)] md:transition-all md:duration-300 md:group-hover:scale-[1.03] md:group-hover:shadow-[inset_0_0_0_1px_rgba(246,196,83,0.2),0_20px_56px_rgba(0,0,0,0.7)] md:group-hover:border-[rgba(246,196,83,0.35)]"
            >
              <div className="absolute inset-0 bg-[rgba(246,196,83,0.05)] opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-[6]" />

              <Image
                src={posterUrl}
                alt={movie.name}
                fill
                className="object-cover object-center"
                sizes="(max-width: 640px) 42vw, (max-width: 1024px) 22vw, 200px"
                {...(priority ? { priority: true } : { loading: "lazy" })}
              />

              {cinemaBadgeText && (
                <div
                  className="absolute top-2.5 left-2.5 sm:top-3 sm:left-3 flex items-center gap-1 z-20 max-w-[calc(100%-1.25rem)]"
                  title={cardTooltipSummary}
                >
                  <Badge className="bg-black/60 text-white border border-white/20 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 shadow-lg backdrop-blur-sm truncate max-w-full">
                    {cinemaBadgeText}
                  </Badge>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-[#030303] via-[#030303]/92 to-transparent pt-16 pb-3 px-2.5 sm:px-3 sm:pb-3.5">
                <h3 className="text-[13px] sm:text-sm font-extrabold text-white leading-tight line-clamp-2 tracking-tight [text-shadow:0_2px_10px_rgba(0,0,0,0.95)]">
                  {movie.name}
                </h3>
                {movie.original_name && movie.original_name !== movie.name && (
                  <p className="mt-0.5 text-[10px] sm:text-[11px] text-[#F6C453]/95 font-semibold leading-snug line-clamp-1">
                    {movie.original_name}
                  </p>
                )}
                {shortDescription && (
                  <p className="mt-1 text-[10px] sm:text-[11px] text-gray-300/95 line-clamp-2 leading-snug">
                    {shortDescription}
                  </p>
                )}
                {(year || isValidTime(movie.time)) && (
                  <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] sm:text-[11px] text-gray-200">
                    {year && (
                      <span className="rounded border border-white/15 bg-white/5 px-1.5 py-0.5 font-medium">
                        {year}
                      </span>
                    )}
                    {isValidTime(movie.time) && (
                      <span className="font-semibold text-white">{movie.time}</span>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </Link>
      </>
    );
  }

  // Default variant - Netflix 2024 horizontal thumbnail
  return (
    <div
      className="group relative flex flex-col h-full premium-hover"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        href={`/phim/${movie.slug}`}
        className="cursor-pointer"
        onClick={handleMovieClick}
        title={cardTooltipSummary}
      >
        <div
          className={`relative rounded-[10px] overflow-hidden bg-muted transition-all duration-200 sm:duration-300 ease-out flex-shrink-0 border border-transparent ${
            isHovered
              ? "scale-[1.05] sm:scale-[1.25] md:scale-[1.35] z-50 shadow-2xl shadow-black/80 border-[rgba(246,196,83,0.3)] rounded-t-[10px] rounded-b-none"
              : "scale-100 z-10 sm:group-hover:border-[rgba(246,196,83,0.3)]"
          }`}
          style={{
            transformOrigin: index === 0 ? "left center" : "center center",
            willChange: "transform",
            backfaceVisibility: "hidden",
            WebkitBackfaceVisibility: "hidden",
            transform: "translateZ(0)",
          }}
        >
          {/* Overlay vàng khi hover */}
          <div className={`absolute inset-0 bg-[rgba(246,196,83,0.15)] transition-opacity duration-200 sm:duration-300 pointer-events-none z-10 ${
            isHovered ? "opacity-100" : "opacity-0 sm:group-hover:opacity-100"
          }`} />
          {/* Thumbnail - 16:9 using poster_url (crop center) */}
          <div className="relative aspect-video w-full overflow-hidden rounded-[10px]">
            <Image
              src={imageUrl}
              alt={movie.name}
              fill
              className="object-cover object-center"
              sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 20vw"
              loading="lazy"
            />

            {/* Episode badge */}
            {!isHovered && episodeBadgeText && (
              <div className="absolute bottom-2 right-2">
                <Badge className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0 text-[10px] sm:text-[11px] font-bold px-2.5 py-1 shadow-lg">
                  {episodeBadgeText}
                </Badge>
              </div>
            )}

            {/* Progress bar (simulated) */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-600/50">
              <div className="h-full bg-red-600 w-0" />
            </div>
          </div>

          {/* Hover Content Panel */}
          {isHovered && (
            <div className="absolute left-0 right-0 top-full bg-[#0f0f1f] rounded-b-md p-3 space-y-3">
              {/* Action Buttons Row */}
              <div className="flex items-center gap-2">
                <Button
                  size="icon"
                  className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F6C453] to-[#D3A13A] hover:brightness-110 text-white border-0 cursor-pointer"
                  onClick={(e) => e.preventDefault()}
                >
                  <Play className="w-5 h-5 fill-white" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="w-9 h-9 rounded-full border-gray-400 hover:border-white bg-transparent"
                  onClick={(e) => e.preventDefault()}
                >
                  <Plus className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="w-9 h-9 rounded-full border-gray-400 hover:border-white bg-transparent"
                  onClick={(e) => e.preventDefault()}
                >
                  <ThumbsUp className="w-5 h-5" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="w-9 h-9 rounded-full border-gray-400 hover:border-white bg-transparent ml-auto"
                  onClick={(e) => e.preventDefault()}
                >
                  <ChevronDown className="w-5 h-5" />
                </Button>
              </div>

              {/* Meta Info Row */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-green-500 font-semibold">97% Phù hợp</span>
                {isValidTime(movie.time) && <span className="text-gray-400">{movie.time}</span>}
              </div>

              {/* Genres */}
              <div className="flex flex-wrap items-center gap-1 text-xs text-gray-300">
                {movie.category?.slice(0, 3).map((cat, i) => (
                  <span key={`${cat.id}-${i}`}>
                    {cat.name}
                    {i < Math.min((movie.category?.length || 0), 3) - 1 && (
                      <span className="mx-1 text-gray-600">•</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Title below (when not hovered) */}
      {!isHovered && (
        <div className="mt-2 flex-shrink-0 space-y-0.5">
          <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5rem] text-gray-300 sm:group-hover:text-white transition-colors duration-200">
            {movie.name}
          </h3>
          {movie.original_name && movie.original_name !== movie.name && (
            <p className="text-sm text-[#F6C453]/95 font-semibold leading-snug line-clamp-1">
              {movie.original_name}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
