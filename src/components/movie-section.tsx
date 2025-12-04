"use client";

import { useRef, useState, useCallback } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { MovieCard } from "@/components/movie-card";
import type { FilmItem } from "@/lib/api";

interface MovieSectionProps {
  title: string;
  movies: FilmItem[];
  href?: string;
  variant?: "default" | "portrait" | "top10" | "newRelease" | "series" | "cinema";
}

export function MovieSection({ title, movies, href, variant = "default" }: MovieSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const hasDragged = useRef(false);
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

  if (!movies || movies.length === 0) {
    return null;
  }

  // Smooth scroll với momentum
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    
    const now = performance.now();
    const dx = e.clientX - dragState.current.startX;
    
    // Nếu di chuyển > 1px thì coi là drag
    if (Math.abs(dx) > 1) {
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
    
    // Momentum scrolling - tính average velocity
    if (scrollRef.current && dragState.current.velocities.length > 0) {
      const avgVelocity = dragState.current.velocities.reduce((a, b) => a + b, 0) / dragState.current.velocities.length;
      
      if (Math.abs(avgVelocity) > 0.1) {
        let momentum = avgVelocity * 15; // Nhân với hệ số để tăng tốc độ
        const friction = 0.92;
        
        const animateMomentum = () => {
          if (!scrollRef.current || Math.abs(momentum) < 0.3) {
            momentumRef.current = null;
            return;
          }
          
          scrollRef.current.scrollLeft -= momentum;
          momentum *= friction;
          momentumRef.current = requestAnimationFrame(animateMomentum);
        };
        
        momentumRef.current = requestAnimationFrame(animateMomentum);
      }
    }
    
    dragState.current.velocities = [];
    dragState.current.lastX = 0;
    dragState.current.lastTime = 0;
  }, [isDragging]);

  // Get card width based on variant
  const getCardWidth = () => {
    switch (variant) {
      case "top10":
        return "w-[110px] xs:w-[130px] sm:w-[155px] md:w-[175px] lg:w-[195px]";
      case "portrait":
        return "w-[105px] xs:w-[125px] sm:w-[145px] md:w-[165px] lg:w-[195px]";
      case "newRelease":
        return "w-[150px] xs:w-[170px] sm:w-[195px] md:w-[215px] lg:w-[235px]";
      case "series":
        return "w-[160px] xs:w-[180px] sm:w-[205px] md:w-[225px] lg:w-[245px]";
      case "cinema":
        return "w-[270px] xs:w-[310px] sm:w-[365px] md:w-[425px] lg:w-[465px]";
      default:
        return "w-[170px] xs:w-[195px] sm:w-[225px] md:w-[265px] lg:w-[305px]";
    }
  };

  return (
    <section className="relative py-3 xs:py-4 sm:py-5 group/section">
      {/* Section Header */}
      <div className="px-2 xs:px-3 sm:px-4 md:px-8 lg:px-12 mb-2 sm:mb-3 md:mb-4">
        {href ? (
          <Link
            href={href}
            className="group/title inline-flex items-center gap-1"
          >
            <h2 className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white">
              {title}
            </h2>
            <span className="hidden sm:flex items-center text-[#fb743E] text-xs sm:text-sm font-medium opacity-0 max-w-0 group-hover/title:opacity-100 group-hover/title:max-w-[120px] transition-all duration-300 overflow-hidden whitespace-nowrap">
              Xem tất cả
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </span>
          </Link>
        ) : (
          <div className="inline-flex items-center gap-1">
            <h2 className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white">
              {title}
            </h2>
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
            
            // Reset drag flag
            hasDragged.current = false;
            
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
            if (hasDragged.current) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          style={{
            scrollBehavior: isDragging ? 'auto' : 'smooth',
            willChange: isDragging ? 'scroll-position' : 'auto',
          }}
          className={`flex items-start gap-3 sm:gap-4 overflow-x-auto scrollbar-hide px-3 sm:px-4 md:px-12 pb-12 sm:pb-16 pt-2 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          {movies.slice(0, 10).map((movie, index) => (
            <div
              key={`${movie.slug}-${index}`}
              className={`shrink-0 flex flex-col ${getCardWidth()}`}
            >
              <MovieCard 
                movie={movie} 
                index={index} 
                variant={variant}
                rank={variant === "top10" || variant === "newRelease" ? index + 1 : undefined}
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

  if (!movies || movies.length === 0) return null;

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    
    const now = performance.now();
    const dx = e.clientX - dragState.current.startX;
    
    // Nếu di chuyển > 1px thì coi là drag
    if (Math.abs(dx) > 1) {
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
    
    // Momentum scrolling - tính average velocity
    if (scrollRef.current && dragState.current.velocities.length > 0) {
      const avgVelocity = dragState.current.velocities.reduce((a, b) => a + b, 0) / dragState.current.velocities.length;
      
      if (Math.abs(avgVelocity) > 0.1) {
        let momentum = avgVelocity * 15; // Nhân với hệ số để tăng tốc độ
        const friction = 0.92;
        
        const animateMomentum = () => {
          if (!scrollRef.current || Math.abs(momentum) < 0.3) {
            momentumRef.current = null;
            return;
          }
          
          scrollRef.current.scrollLeft -= momentum;
          momentum *= friction;
          momentumRef.current = requestAnimationFrame(animateMomentum);
        };
        
        momentumRef.current = requestAnimationFrame(animateMomentum);
      }
    }
    
    dragState.current.velocities = [];
    dragState.current.lastX = 0;
    dragState.current.lastTime = 0;
    
    // Reset hasDragged sau một khoảng thời gian ngắn để cho phép click bình thường nếu không drag
    const wasDragging = hasDragged.current;
    if (!wasDragging) {
      setTimeout(() => {
        hasDragged.current = false;
      }, 0);
    }
  }, [isDragging]);

  return (
    <section className="relative py-4 group/section">
      {/* Header */}
      <div className="px-3 sm:px-4 md:px-12 mb-2">
        <Link href={href || "#"} className="group/title inline-flex items-center gap-1">
          <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white">
            {title}
          </h2>
          <span className="hidden sm:flex items-center text-[rgb(255,220,120)] text-xs sm:text-sm font-medium opacity-0 max-w-0 group-hover/title:opacity-100 group-hover/title:max-w-[120px] transition-all duration-300 overflow-hidden whitespace-nowrap">
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
            
            // Reset drag flag
            hasDragged.current = false;
            
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
            if (hasDragged.current) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          style={{
            scrollBehavior: isDragging ? 'auto' : 'smooth',
            willChange: isDragging ? 'scroll-position' : 'auto',
          }}
          className={`flex items-start gap-3 sm:gap-4 overflow-x-auto scrollbar-hide px-3 sm:px-4 md:px-12 pb-12 sm:pb-16 pt-2 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          {movies.slice(0, 10).map((movie, index) => (
            <div key={`${movie.slug}-${index}`} className="shrink-0 flex flex-col w-[120px] sm:w-[140px] md:w-[160px] lg:w-[180px]">
              <MovieCard movie={movie} index={index} variant="top10" rank={index + 1} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
