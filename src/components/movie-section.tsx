"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MovieCard } from "@/components/movie-card";
import { getImageUrl } from "@/lib/api";
import type { FilmItem } from "@/lib/api";
import { isValidTime } from "@/lib/utils";

interface MovieSectionProps {
  title: string;
  movies: FilmItem[];
  href?: string;
  variant?: "default" | "portrait" | "top10" | "newRelease" | "series" | "cinema";
}

// Chuẩn hoá nhãn tập giống bên movie-card
function formatEpisodeLabel(episode?: string) {
  if (!episode) return "";
  const match = episode.match(/Hoàn tất\s*\(([^)]+)\)/i);
  if (match) return match[1];
  return episode;
}

export function MovieSection({ title, movies, href, variant = "default" }: MovieSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasDragged = useRef(false);
  const dragStartTime = useRef<number>(0);
  const dragDistance = useRef<number>(0);
  const dragState = useRef<{ 
    startX: number; 
    scrollLeft: number; 
    lastX: number; 
    lastTime: number;
    velocities: number[];
  }>({ 
    startX: 0, 
    scrollLeft: 0, 
    lastX: 0,
    lastTime: 0,
    velocities: []
  });
  const animationFrameRef = useRef<number | null>(null);
  const momentumRef = useRef<number | null>(null);

  // Luôn reset scroll về đầu khi section được mount (tránh trường hợp Top 1 bị trôi sang giữa trên mobile)
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [title]);

  if (!movies || movies.length === 0) {
    return null;
  }

  // Smooth scroll với momentum
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    
    const now = performance.now();
    const dx = e.clientX - dragState.current.startX;
    
    // Tính khoảng cách di chuyển
    dragDistance.current = Math.abs(dx);
    
    // Nếu di chuyển > 5px thì coi là drag (tăng threshold để tránh false positive)
    if (dragDistance.current > 5) {
      hasDragged.current = true;
    }
    
    const currentScrollLeft = dragState.current.scrollLeft - dx;
    
    // Tính velocity cho momentum (lưu lại các giá trị gần đây)
    if (dragState.current.lastTime > 0) {
      const timeDelta = now - dragState.current.lastTime;
      const xDelta = e.clientX - dragState.current.lastX;
      if (timeDelta > 0) {
        const velocity = xDelta / timeDelta;
        dragState.current.velocities.push(velocity);
        // Chỉ giữ lại 5 giá trị gần nhất
        if (dragState.current.velocities.length > 5) {
          dragState.current.velocities.shift();
        }
      }
    }
    
    dragState.current.lastX = e.clientX;
    dragState.current.lastTime = now;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      if (scrollRef.current) {
        // Sử dụng transform để tối ưu performance, sau đó sync với scrollLeft
        scrollRef.current.scrollLeft = currentScrollLeft;
      }
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    
    const wasDragging = hasDragged.current;
    const dragDist = dragDistance.current;
    
    setIsDragging(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Momentum scrolling - tính average velocity với cải thiện
    if (scrollRef.current && dragState.current.velocities.length > 0) {
      // Lấy velocity trung bình từ các giá trị gần nhất (weighted average)
      const recentVelocities = dragState.current.velocities.slice(-3);
      const avgVelocity = recentVelocities.reduce((a, b) => a + b, 0) / recentVelocities.length;
      
      if (Math.abs(avgVelocity) > 0.15) {
        let momentum = avgVelocity * 20; // Tăng hệ số để mượt hơn
        const friction = 0.94; // Giảm friction để scroll lâu hơn, mượt hơn
        const minMomentum = 0.5; // Tăng ngưỡng dừng để mượt hơn
        
        const animateMomentum = () => {
          if (!scrollRef.current || Math.abs(momentum) < minMomentum) {
            momentumRef.current = null;
            return;
          }
          
          // Sử dụng easing để mượt hơn
          const currentScroll = scrollRef.current.scrollLeft;
          scrollRef.current.scrollLeft = currentScroll - momentum;
          momentum *= friction;
          momentumRef.current = requestAnimationFrame(animateMomentum);
        };
        
        momentumRef.current = requestAnimationFrame(animateMomentum);
      }
    }
    
    // Nếu đã drag, prevent click trong 300ms sau khi thả chuột
    if (wasDragging || dragDist > 5) {
      hasDragged.current = true;
      // Reset sau 300ms để cho phép click bình thường sau đó
      setTimeout(() => {
        hasDragged.current = false;
        dragDistance.current = 0;
      }, 300);
    } else {
      // Nếu không drag, reset ngay
      hasDragged.current = false;
      dragDistance.current = 0;
    }
    
    dragState.current.velocities = [];
    dragState.current.lastX = 0;
    dragState.current.lastTime = 0;
  }, [isDragging]);

  // Touch handlers đã bị tắt - để browser tự xử lý scroll trên iPad

  // Get card width based on variant
  const getCardWidth = () => {
    // Dùng clamp để card tự co giãn mượt trên màn 4K/ultra-wide
    switch (variant) {
      case "top10":
        return "w-[clamp(150px,15vw,230px)] xl:w-[clamp(180px,12vw,260px)]";
      case "portrait":
        return "w-[clamp(150px,15vw,230px)] xl:w-[clamp(175px,12vw,255px)]";
      case "newRelease":
        return "w-[clamp(180px,16vw,270px)] xl:w-[clamp(210px,13vw,300px)]";
      case "series":
        return "w-[clamp(190px,16vw,285px)] xl:w-[clamp(220px,13vw,315px)]";
      default:
        return "w-[clamp(200px,17vw,320px)] xl:w-[clamp(230px,14vw,360px)]";
    }
  };

  return (
    <section className="relative py-4 xs:py-5 sm:py-6 lg:py-8 group/section">
      {/* Premium Section Header */}
      <div className="px-2 xs:px-3 sm:px-4 md:px-8 lg:px-12 mb-3 sm:mb-4 md:mb-6">
        {href ? (
          <Link href={href} className="group/title block">
            <div className="flex items-center gap-3 sm:gap-4 relative">
              <div className="h-[2px] w-8 sm:w-10 rounded-full bg-gradient-to-r from-[#F6C453] via-[#F3B13C] to-[#D3A13A] shadow-[0_0_12px_rgba(243,177,60,0.45)]" />
              <div className="flex items-center gap-2 sm:gap-3">
                <h2 className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-extrabold text-white tracking-tight relative">
                  <span className="relative z-10">{title}</span>
                </h2>
                <span className="hidden sm:flex items-center gap-1.5 text-[#F6C453] text-xs sm:text-sm font-medium opacity-0 max-w-0 group-hover/title:opacity-100 group-hover/title:max-w-[120px] transition-all duration-300 overflow-hidden whitespace-nowrap">
                  Xem tất cả
                  <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform group-hover/title:translate-x-1" />
                </span>
              </div>
              <div className="flex-1 h-px bg-gradient-to-r from-[#F6C453]/60 via-[#D3A13A]/40 to-transparent" />
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-3 sm:gap-4 relative">
            <div className="h-[2px] w-8 sm:w-10 rounded-full bg-gradient-to-r from-[#F6C453] via-[#F3B13C] to-[#D3A13A] shadow-[0_0_12px_rgba(243,177,60,0.45)]" />
            <h2 className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-extrabold text-white tracking-tight">
              {title}
            </h2>
            <div className="flex-1 h-px bg-gradient-to-r from-[#F6C453]/60 via-[#D3A13A]/40 to-transparent" />
          </div>
        )}
      </div>

      {/* Scrollable Row */}
      <div className="relative">
        <div
          ref={scrollRef}
          onMouseDown={(e) => {
            // Chỉ hoạt động với chuột trái (button 0)
            if (e.button !== 0 || !scrollRef.current) return;
            
            // Dừng momentum nếu đang chạy
            if (momentumRef.current) {
              cancelAnimationFrame(momentumRef.current);
              momentumRef.current = null;
            }
            
            // Reset drag flag và tracking
            hasDragged.current = false;
            dragDistance.current = 0;
            dragStartTime.current = performance.now();
            
            e.preventDefault();
            setIsDragging(true);
            dragState.current = { 
              startX: e.clientX, 
              scrollLeft: scrollRef.current.scrollLeft,
              lastX: e.clientX,
              lastTime: performance.now(),
              velocities: []
            };
          }}
          onMouseMove={(e) => {
            if (!isDragging) return;
            e.preventDefault();
            handleMouseMove(e.nativeEvent);
          }}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={(e) => {
            // Nếu đã drag thì prevent click vào movie card
            if (hasDragged.current || dragDistance.current > 5) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          }}
          onClickCapture={(e) => {
            // Capture phase để chặn sớm hơn
            if (hasDragged.current || dragDistance.current > 5) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          }}
          style={{
            scrollBehavior: 'auto', // Để iOS tự xử lý với native momentum
            overscrollBehaviorX: 'contain',
            WebkitOverflowScrolling: 'touch', // Quan trọng cho iOS momentum scrolling
            touchAction: 'pan-x pan-y',
            scrollSnapType: 'none', // Tắt snap để lướt liên tục mượt hơn
            // Tối ưu cho iPad/iOS - giảm thiểu để browser tự tối ưu
            WebkitTransform: 'translate3d(0, 0, 0)',
            transform: 'translate3d(0, 0, 0)',
          }}
          className={`flex items-start justify-start gap-3 sm:gap-4 overflow-x-auto scrollbar-hide px-3 sm:px-4 md:px-12 pb-12 sm:pb-16 pt-2 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          {movies.slice(0, 10).map((movie, index) => (
            <div
              key={`${movie.slug}-${index}`}
              className={`shrink-0 flex flex-col ${
                variant === "cinema"
                  ? "w-[clamp(240px,18vw,360px)] xl:w-[clamp(280px,14vw,420px)]"
                  : getCardWidth()
              } lg:basis-[calc((100%-64px)/5)] lg:max-w-[calc((100%-64px)/5)] 2xl:basis-[calc((100%-80px)/5)] 2xl:max-w-[calc((100%-80px)/5)]`}
              onClick={(e) => {
                // Prevent click nếu đã drag
                if (hasDragged.current || dragDistance.current > 5) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              onClickCapture={(e) => {
                // Capture phase để chặn sớm hơn
                if (hasDragged.current || dragDistance.current > 5) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            >
              {variant === "cinema" ? (
                <CinemaCard movie={movie} />
              ) : (
                <MovieCard
                  movie={movie}
                  index={index}
                  variant={variant}
                  rank={variant === "top10" || variant === "newRelease" ? index + 1 : undefined}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Cinema card UI theo thiết kế mới
function CinemaCard({ movie }: { movie: FilmItem }) {
  const primaryImage = getImageUrl(movie.poster_url || movie.thumb_url);
  const posterImage = getImageUrl(movie.thumb_url || movie.poster_url);
  const year =
    movie.created && !Number.isNaN(new Date(movie.created).getFullYear())
      ? new Date(movie.created).getFullYear()
      : undefined;
  const episodeLabel = formatEpisodeLabel(movie.current_episode);

  return (
    <Link href={`/phim/${movie.slug}`} className="group block h-full cursor-pointer">
      <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-[#0b0b0f] shadow-[0_15px_35px_rgba(0,0,0,0.45)] transition-transform duration-300 group-hover:-translate-y-1">
        {/* Top artwork */}
        <div className="relative aspect-[4/5] w-full overflow-hidden">
          <Image
            src={primaryImage}
            alt={movie.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 25vw"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/25 to-[#0b0b0f] opacity-70" />
        </div>

        {/* Info panel */}
        <div className="relative -mt-12 rounded-t-2xl bg-[#0f111a] px-3 pb-3 pt-4 shadow-[0_-10px_30px_rgba(0,0,0,0.55)]">
          <div className="flex items-start gap-3">
            <div className="relative aspect-[2/3] w-14 overflow-hidden rounded-lg border border-white/10 bg-black/60 shadow-lg shadow-black/60">
              <Image src={posterImage} alt={movie.name} fill className="object-cover" sizes="64px" />
              {movie.language && (
                <Badge className="absolute bottom-1 left-1 bg-white text-black text-[10px] font-semibold px-1.5 py-0.5 border-0">
                  {movie.language}
                </Badge>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-white line-clamp-1">{movie.name}</h3>
              {movie.original_name && movie.original_name !== movie.name && (
                <p className="text-xs text-gray-300 line-clamp-1">{movie.original_name}</p>
              )}
              <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-gray-200">
                {year && <span>{year}</span>}
                {isValidTime(movie.time) && (
                  <>
                    <span className="text-white/30">•</span>
                    <span>{movie.time}</span>
                  </>
                )}
                {episodeLabel && (
                  <>
                    <span className="text-white/30">•</span>
                    <span>{episodeLabel}</span>
                  </>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                {movie.quality && (
                  <Badge className="bg-[#FF2EBC]/20 text-[#FF2EBC] border border-[#FF2EBC]/40 text-[10px] font-semibold">
                    {movie.quality.toUpperCase()}
                  </Badge>
                )}
                {movie.language && !movie.language.toLowerCase().includes("vietsub") && (
                  <Badge className="bg-white/10 text-white border border-white/20 text-[10px] font-semibold">
                    {movie.language}
                  </Badge>
                )}
                {episodeLabel && (
                  <Badge className="bg-gradient-to-r from-[#F6C453] to-[#D3A13A] text-black text-[10px] font-semibold border-0">
                    {episodeLabel}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Top 10 Section Component
export function Top10Section({ title, movies, href }: { title: string; movies: FilmItem[]; href?: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasDragged = useRef(false);
  const dragStartTime = useRef<number>(0);
  const dragDistance = useRef<number>(0);
  const dragState = useRef<{ 
    startX: number; 
    scrollLeft: number; 
    lastX: number;
    lastTime: number;
    velocities: number[];
  }>({ 
    startX: 0, 
    scrollLeft: 0,
    lastX: 0,
    lastTime: 0,
    velocities: []
  });
  const animationFrameRef = useRef<number | null>(null);
  const momentumRef = useRef<number | null>(null);

  // Reset scroll về đầu cho dãy Top 10 khi mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
    }
  }, [title]);

  if (!movies || movies.length === 0) return null;

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    
    const now = performance.now();
    const dx = e.clientX - dragState.current.startX;
    
    // Tính khoảng cách di chuyển
    dragDistance.current = Math.abs(dx);
    
    // Nếu di chuyển > 5px thì coi là drag (tăng threshold để tránh false positive)
    if (dragDistance.current > 5) {
      hasDragged.current = true;
    }
    
    const currentScrollLeft = dragState.current.scrollLeft - dx;
    
    // Tính velocity cho momentum (lưu lại các giá trị gần đây)
    if (dragState.current.lastTime > 0) {
      const timeDelta = now - dragState.current.lastTime;
      const xDelta = e.clientX - dragState.current.lastX;
      if (timeDelta > 0) {
        const velocity = xDelta / timeDelta;
        dragState.current.velocities.push(velocity);
        // Chỉ giữ lại 5 giá trị gần nhất
        if (dragState.current.velocities.length > 5) {
          dragState.current.velocities.shift();
        }
      }
    }
    
    dragState.current.lastX = e.clientX;
    dragState.current.lastTime = now;
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    animationFrameRef.current = requestAnimationFrame(() => {
      if (scrollRef.current) {
        // Sử dụng transform để tối ưu performance, sau đó sync với scrollLeft
        scrollRef.current.scrollLeft = currentScrollLeft;
      }
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    // Momentum scrolling - tính average velocity với cải thiện
    if (scrollRef.current && dragState.current.velocities.length > 0) {
      // Lấy velocity trung bình từ các giá trị gần nhất (weighted average)
      const recentVelocities = dragState.current.velocities.slice(-3);
      const avgVelocity = recentVelocities.reduce((a, b) => a + b, 0) / recentVelocities.length;
      
      if (Math.abs(avgVelocity) > 0.15) {
        let momentum = avgVelocity * 20; // Tăng hệ số để mượt hơn
        const friction = 0.94; // Giảm friction để scroll lâu hơn, mượt hơn
        const minMomentum = 0.5; // Tăng ngưỡng dừng để mượt hơn
        
        const animateMomentum = () => {
          if (!scrollRef.current || Math.abs(momentum) < minMomentum) {
            momentumRef.current = null;
            return;
          }
          
          // Sử dụng easing để mượt hơn
          const currentScroll = scrollRef.current.scrollLeft;
          scrollRef.current.scrollLeft = currentScroll - momentum;
          momentum *= friction;
          momentumRef.current = requestAnimationFrame(animateMomentum);
        };
        
        momentumRef.current = requestAnimationFrame(animateMomentum);
      }
    }
    
    // Nếu đã drag, prevent click trong 300ms sau khi thả chuột
    const wasDragging = hasDragged.current;
    const dragDist = dragDistance.current;
    
    if (wasDragging || dragDist > 5) {
      hasDragged.current = true;
      // Reset sau 300ms để cho phép click bình thường sau đó
      setTimeout(() => {
        hasDragged.current = false;
        dragDistance.current = 0;
      }, 300);
    } else {
      // Nếu không drag, reset ngay
      hasDragged.current = false;
      dragDistance.current = 0;
    }
    
    dragState.current.velocities = [];
    dragState.current.lastX = 0;
    dragState.current.lastTime = 0;
  }, [isDragging]);

  // Touch handlers đã bị tắt - để browser tự xử lý scroll trên iPad

  return (
    <section className="relative py-4 group/section">
      {/* Header */}
      <div className="px-3 sm:px-4 md:px-12 mb-2">
        <Link href={href || "#"} className="group/title inline-flex items-center gap-1 cursor-pointer">
          <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white">
            {title}
          </h2>
          <span className="hidden sm:flex items-center text-[#F6C453] text-xs sm:text-sm font-medium opacity-0 max-w-0 group-hover/title:opacity-100 group-hover/title:max-w-[120px] transition-all duration-300 overflow-hidden whitespace-nowrap">
            Xem tất cả
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </span>
        </Link>
      </div>

      {/* Top 10 Cards */}
      <div className="relative">
        <div
          ref={scrollRef}
          onMouseDown={(e) => {
            // Chỉ hoạt động với chuột trái (button 0)
            if (e.button !== 0 || !scrollRef.current) return;
            
            // Dừng momentum nếu đang chạy
            if (momentumRef.current) {
              cancelAnimationFrame(momentumRef.current);
              momentumRef.current = null;
            }
            
            // Reset drag flag và tracking
            hasDragged.current = false;
            dragDistance.current = 0;
            dragStartTime.current = performance.now();
            
            e.preventDefault();
            setIsDragging(true);
            dragState.current = { 
              startX: e.clientX, 
              scrollLeft: scrollRef.current.scrollLeft,
              lastX: e.clientX,
              lastTime: performance.now(),
              velocities: []
            };
          }}
          onMouseMove={(e) => {
            if (!isDragging) return;
            e.preventDefault();
            handleMouseMove(e.nativeEvent);
          }}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={(e) => {
            // Nếu đã drag thì prevent click vào movie card
            if (hasDragged.current || dragDistance.current > 5) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          }}
          onClickCapture={(e) => {
            // Capture phase để chặn sớm hơn
            if (hasDragged.current || dragDistance.current > 5) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          }}
          style={{
            scrollBehavior: 'auto', // Để iOS tự xử lý với native momentum
            overscrollBehaviorX: 'contain',
            WebkitOverflowScrolling: 'touch', // Quan trọng cho iOS momentum scrolling
            touchAction: 'pan-x pan-y',
            scrollSnapType: 'none', // Tắt snap để lướt liên tục mượt hơn
            // Tối ưu cho iPad/iOS - giảm thiểu để browser tự tối ưu
            WebkitTransform: 'translate3d(0, 0, 0)',
            transform: 'translate3d(0, 0, 0)',
          }}
          className={`flex items-start gap-3 sm:gap-4 overflow-x-auto scrollbar-hide px-3 sm:px-4 md:px-12 pb-12 sm:pb-16 pt-2 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          {movies.slice(0, 10).map((movie, index) => (
            <div 
              key={`${movie.slug}-${index}`} 
              className="shrink-0 flex flex-col w-[180px] sm:w-[190px] md:w-[210px] lg:w-[240px] lg:basis-[calc((100%-64px)/5)] lg:max-w-[calc((100%-64px)/5)] 2xl:basis-[calc((100%-80px)/5)] 2xl:max-w-[calc((100%-80px)/5)]"
              onClick={(e) => {
                // Prevent click nếu đã drag
                if (hasDragged.current || dragDistance.current > 5) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              onClickCapture={(e) => {
                // Capture phase để chặn sớm hơn
                if (hasDragged.current || dragDistance.current > 5) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            >
              <MovieCard movie={movie} index={index} variant="top10" rank={index + 1} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
