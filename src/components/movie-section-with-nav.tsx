"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MovieCard } from "@/components/movie-card";
import type { FilmItem } from "@/lib/api";

interface MovieSectionWithNavProps {
  title: string;
  movies: FilmItem[];
  href?: string;
  variant?: "default" | "portrait" | "top10" | "newRelease" | "series" | "cinema";
  showViewAll?: boolean;
  disableTilt?: boolean;
}

// Chuẩn hoá nhãn tập giống bên movie-card
function formatEpisodeLabel(episode?: string) {
  if (!episode) return "";
  const match = episode.match(/Hoàn tất\s*\(([^)]+)\)/i);
  if (match) return match[1];
  return episode;
}

export function MovieSectionWithNav({ 
  title, 
  movies, 
  href, 
  variant = "default",
  showViewAll = true,
  disableTilt = false
}: MovieSectionWithNavProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasDragged = useRef(false);
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

  // Check scroll position
  const checkScrollPosition = useCallback(() => {
    // Function kept for potential future use
  }, []);

  // Reset scroll về đầu khi section được mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
      checkScrollPosition();
    }
  }, [title, checkScrollPosition]);

  // Listen to scroll events
  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    checkScrollPosition();
    
    scrollElement.addEventListener('scroll', checkScrollPosition);
    
    return () => {
      scrollElement.removeEventListener('scroll', checkScrollPosition);
    };
  }, [checkScrollPosition, movies]);

  if (!movies || movies.length === 0) {
    return null;
  }

  // Smooth scroll với momentum
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    
    const now = performance.now();
    const dx = e.clientX - dragState.current.startX;
    
    dragDistance.current = Math.abs(dx);
    
    if (dragDistance.current > 5) {
      hasDragged.current = true;
    }
    
    const currentScrollLeft = dragState.current.scrollLeft - dx;
    
    if (dragState.current.lastTime > 0) {
      const timeDelta = now - dragState.current.lastTime;
      const xDelta = e.clientX - dragState.current.lastX;
      if (timeDelta > 0) {
        const velocity = xDelta / timeDelta;
        dragState.current.velocities.push(velocity);
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
        scrollRef.current.scrollLeft = currentScrollLeft;
        checkScrollPosition();
      }
    });
  }, [isDragging, checkScrollPosition]);

  const handleMouseUp = useCallback(() => {
    if (!isDragging) return;
    
    const wasDragging = hasDragged.current;
    const dragDist = dragDistance.current;
    
    setIsDragging(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (scrollRef.current && dragState.current.velocities.length > 0) {
      const recentVelocities = dragState.current.velocities.slice(-3);
      const avgVelocity = recentVelocities.reduce((a, b) => a + b, 0) / recentVelocities.length;
      
      if (Math.abs(avgVelocity) > 0.15) {
        let momentum = avgVelocity * 20;
        const friction = 0.94;
        const minMomentum = 0.5;
        
        const animateMomentum = () => {
          if (!scrollRef.current || Math.abs(momentum) < minMomentum) {
            momentumRef.current = null;
            checkScrollPosition();
            return;
          }
          
          const currentScroll = scrollRef.current.scrollLeft;
          scrollRef.current.scrollLeft = currentScroll - momentum;
          momentum *= friction;
          momentumRef.current = requestAnimationFrame(animateMomentum);
        };
        
        momentumRef.current = requestAnimationFrame(animateMomentum);
      }
    }
    
    if (wasDragging || dragDist > 5) {
      hasDragged.current = true;
      setTimeout(() => {
        hasDragged.current = false;
        dragDistance.current = 0;
      }, 300);
    } else {
      hasDragged.current = false;
      dragDistance.current = 0;
    }
    
    dragState.current.velocities = [];
    dragState.current.lastX = 0;
    dragState.current.lastTime = 0;
  }, [isDragging, checkScrollPosition]);

  // Get card width based on variant
  const getCardWidth = () => {
    switch (variant) {
      case "top10":
        return "w-[clamp(150px,15vw,230px)] xl:w-[clamp(180px,12vw,260px)]";
      case "portrait":
        return "w-[clamp(150px,15vw,230px)] xl:w-[clamp(175px,12vw,255px)]";
      case "newRelease":
        // Đồng bộ kích thước với các danh mục khác trên mobile
        return "w-[clamp(200px,17vw,320px)] xl:w-[clamp(230px,14vw,360px)]";
      case "series":
        return "w-[clamp(190px,16vw,285px)] xl:w-[clamp(220px,13vw,315px)]";
      default:
        return "w-[clamp(200px,17vw,320px)] xl:w-[clamp(230px,14vw,360px)]";
    }
  };

  return (
    // Giảm padding dọc để thu hẹp khoảng trống giữa các section
    <section className="relative py-2 xs:py-3 sm:py-4 lg:py-5 group/section">
      {/* Premium Section Header */}
      <div className="px-2 xs:px-3 sm:px-4 md:px-8 lg:px-12 mb-3 sm:mb-4 md:mb-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4 relative flex-1 min-w-0">
            <div className="h-[2px] w-8 sm:w-10 rounded-full bg-gradient-to-r from-[#F6C453] via-[#F3B13C] to-[#D3A13A] shadow-[0_0_12px_rgba(243,177,60,0.45)] shrink-0" />
            {href && showViewAll ? (
              <Link href={href} className="group/title block min-w-0">
                <h2 className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-extrabold text-white tracking-tight line-clamp-1">
                  {title}
                </h2>
              </Link>
            ) : (
              <h2 className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-extrabold text-white tracking-tight line-clamp-1">
                {title}
              </h2>
            )}
            <div className="flex-1 h-px bg-gradient-to-r from-[#F6C453]/60 via-[#D3A13A]/40 to-transparent" />
          </div>
          
          {/* View All Link */}
          {href && showViewAll && (
            <Link 
              href={href}
              className="hidden sm:flex items-center gap-1.5 text-[#F6C453] text-xs sm:text-sm font-medium hover:text-[#D3A13A] transition-colors shrink-0 whitespace-nowrap"
            >
              Xem toàn bộ
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Scrollable Row */}
      <div className="relative">
        <div
          ref={scrollRef}
          onMouseDown={(e) => {
            if (e.button !== 0 || !scrollRef.current) return;
            
            if (momentumRef.current) {
              cancelAnimationFrame(momentumRef.current);
              momentumRef.current = null;
            }
            
            hasDragged.current = false;
            dragDistance.current = 0;
            
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
            if (hasDragged.current || dragDistance.current > 5) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          }}
          onClickCapture={(e) => {
            if (hasDragged.current || dragDistance.current > 5) {
              e.preventDefault();
              e.stopPropagation();
              return false;
            }
          }}
          style={{
            scrollBehavior: 'auto',
            overscrollBehaviorX: 'contain',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x pan-y',
            scrollSnapType: 'none',
            WebkitTransform: 'translate3d(0, 0, 0)',
            transform: 'translate3d(0, 0, 0)',
          }}
          // Giảm padding dưới của hàng phim để khoảng cách với section kế tiếp bớt trống
          // Tăng padding-top cho newRelease để tránh clipping khi card nghiêng nhiều hơn
          className={`flex items-start justify-start gap-3 sm:gap-4 overflow-x-auto scrollbar-hide px-3 sm:px-4 md:px-12 pb-6 sm:pb-8 ${variant === "newRelease" ? "pt-6 sm:pt-8" : "pt-1"} select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          {movies.slice(0, 20).map((movie, index) => (
            <div
              key={`${movie.slug}-${index}`}
              className={`shrink-0 flex flex-col ${
                variant === "cinema"
                  ? "w-[clamp(240px,18vw,360px)] xl:w-[clamp(280px,14vw,420px)]"
                  : getCardWidth()
              } lg:basis-[calc((100%-64px)/5)] lg:max-w-[calc((100%-64px)/5)] 2xl:basis-[calc((100%-80px)/5)] 2xl:max-w-[calc((100%-80px)/5)]`}
              onClick={(e) => {
                if (hasDragged.current || dragDistance.current > 5) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              onClickCapture={(e) => {
                if (hasDragged.current || dragDistance.current > 5) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
            >
              <MovieCard
                movie={movie}
                index={index}
                variant={variant}
                rank={variant === "top10" || variant === "newRelease" ? index + 1 : undefined}
                disableTilt={disableTilt}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
