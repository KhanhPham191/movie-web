"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MovieCard } from "@/components/movie-card";
import type { FilmItem } from "@/lib/api";

interface MovieSectionProps {
  title: string;
  movies: FilmItem[];
  href?: string;
  variant?: "default" | "portrait" | "top10" | "newRelease" | "series" | "cinema";
  /** Number of first cards to load with priority (above-fold) */
  priorityCount?: number;
}

export function MovieSection({ title, movies, href, variant = "default", priorityCount = 0 }: MovieSectionProps) {
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

  if (!movies || movies.length === 0) {
    return null;
  }

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
      case "cinema":
        return "w-[clamp(152px,15.5vw,238px)] xl:w-[clamp(178px,12.5vw,260px)]";
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
                  ? `${getCardWidth()} lg:basis-[calc((100%-64px)/5)] lg:max-w-[calc((100%-64px)/5)] 2xl:basis-[calc((100%-80px)/5)] 2xl:max-w-[calc((100%-80px)/5)]`
                  : `${getCardWidth()} lg:basis-[calc((100%-64px)/5)] lg:max-w-[calc((100%-64px)/5)] 2xl:basis-[calc((100%-80px)/5)] 2xl:max-w-[calc((100%-80px)/5)]`
              }`}
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
              <MovieCard
                movie={movie}
                index={index}
                variant={variant}
                rank={variant === "top10" || variant === "newRelease" ? index + 1 : undefined}
                priority={index < priorityCount}
                hasDraggedRef={hasDragged}
                dragDistanceRef={dragDistance}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
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

  if (!movies || movies.length === 0) return null;

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
