"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CurrentlyWatchingCard } from "@/components/currently-watching-card";
import { getCurrentlyWatching, type CurrentlyWatching } from "@/lib/supabase/movies";
import { useAuth } from "@/contexts/auth-context";

export function CurrentlyWatchingSection() {
  const [items, setItems] = useState<CurrentlyWatching[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(false);
  const { isAuthenticated } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousItemsRef = useRef<CurrentlyWatching[]>([]);
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

  // Smooth scroll với momentum - Phải đặt trước early returns
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
    
    dragState.current.velocities = [];
    dragState.current.lastX = 0;
    dragState.current.lastTime = 0;
  }, [isDragging]);

  // Touch handlers đã bị tắt - để browser tự xử lý scroll trên iPad

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await getCurrentlyWatching();
        if (error) {
          setItems([]);
        } else {
          // Filter ra các phim đã xem xong (progress >= 100%)
          const filtered = (data || []).filter((item) => {
            // Nếu không có total_duration, vẫn hiển thị
            if (!item.total_duration || item.total_duration <= 0) {
              return true;
            }
            // Tính progress
            const progress = (item.watch_time / item.total_duration) * 100;
            // Chỉ hiển thị nếu progress < 100% (chưa xem xong)
            return progress < 100;
          });
          setItems(filtered);
          previousItemsRef.current = filtered;
        }
      } catch (error) {
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Refresh khi focus lại tab/window với debounce để tránh gọi quá nhiều
    let focusTimeout: NodeJS.Timeout | null = null;
    const handleFocus = () => {
      // Clear timeout cũ nếu có
      if (focusTimeout) {
        clearTimeout(focusTimeout);
      }
      // Debounce 2 giây để tránh gọi quá nhiều khi user switch tabs nhanh
      focusTimeout = setTimeout(() => {
      fetchData();
      }, 2000);
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      if (focusTimeout) {
        clearTimeout(focusTimeout);
      }
    };
  }, [isAuthenticated]);

  // Kick off enter animation when data sẵn sàng
  useEffect(() => {
    if (!isLoading && items.length > 0) {
      const timer = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(timer);
    } else {
      setIsVisible(false);
    }
  }, [isLoading, items.length]);

  // Ẩn hoàn toàn nếu chưa đăng nhập
  if (!isAuthenticated) {
    return null;
  }

  const hasContent = items.length > 0 || previousItemsRef.current.length > 0;
  const displayItems = items.length > 0 ? items : previousItemsRef.current;

  return (
    <section
      className={`relative py-6 xs:py-7 sm:py-8 group/section px-0 transition-opacity duration-400 ease-out ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      style={{ minHeight: hasContent ? undefined : 240 }}
    >
      
      {/* Premium Section Header */}
      <div className="relative px-2 xs:px-3 sm:px-4 md:px-8 lg:px-12 mb-4 sm:mb-5 md:mb-6">
        <div className="inline-flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            {/* Premium accent line with glow */}
            <div className="relative">
              <div className="absolute inset-0 w-1.5 h-10 sm:h-12 bg-gradient-to-b from-[#F6C453] to-[#D3A13A] rounded-full blur-sm opacity-75" />
              <div className="relative w-1.5 h-10 sm:h-12 bg-gradient-to-b from-[#F6C453] to-[#D3A13A] rounded-full" />
            </div>
            <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Bạn đang xem
            </h2>
          </div>
          {/* Premium Badge */}
          <div className="relative group/badge">
            <div className="absolute inset-0 bg-gradient-to-r from-[#F6C453]/30 to-[#D3A13A]/30 rounded-full blur-md group-hover/badge:blur-lg transition-all" />
            <div className="relative inline-flex px-1 py-0.5 xs:px-1.5 xs:py-0.5 sm:px-2.5 sm:py-1.5 md:px-3 md:py-1.5 bg-gradient-to-r from-[#F6C453]/20 to-[#D3A13A]/20 backdrop-blur-md border-[0.5px] xs:border border-[#F6C453]/40 rounded-full">
              <span className="text-[9px] xs:text-[10px] sm:text-xs text-[#F6C453] font-bold uppercase tracking-tight xs:tracking-wide sm:tracking-wider bg-gradient-to-r from-[#F6C453] to-[#D3A13A] bg-clip-text text-transparent whitespace-nowrap">
                Xem tiếp
              </span>
            </div>
          </div>
        </div>
        <p className="mt-1.5 sm:mt-2 text-[10px] xs:text-xs text-gray-400">
          Tiếp tục xem các phim bạn đã bắt đầu
        </p>
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
            scrollSnapType: 'x proximity', // Đổi từ mandatory sang proximity để mượt hơn
            // Tối ưu cho iPad/iOS - giảm thiểu để browser tự tối ưu
            WebkitTransform: 'translate3d(0, 0, 0)',
            transform: 'translate3d(0, 0, 0)',
          }}
          className={`flex items-start gap-3 sm:gap-4 overflow-x-auto scrollbar-hide px-3 sm:px-4 md:px-12 pb-12 sm:pb-16 pt-2 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          {displayItems.slice(0, 10).map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="shrink-0 flex flex-col w-[135px] xs:w-[140px] sm:w-[145px] md:w-[165px] lg:w-[195px] scroll-snap-align-start"
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
              <CurrentlyWatchingCard item={item} index={index} />
            </div>
          ))}

          {displayItems.length === 0 &&
            Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`cw-skeleton-${index}`}
                className="shrink-0 flex flex-col w-[135px] xs:w-[140px] sm:w-[145px] md:w-[165px] lg:w-[195px] scroll-snap-align-start"
              >
                <div className="w-full aspect-[2/3] rounded-2xl bg-white/5 animate-pulse" />
                <div className="mt-3 h-4 w-4/5 rounded bg-white/5 animate-pulse" />
                <div className="mt-2 h-3 w-2/3 rounded bg-white/5 animate-pulse" />
              </div>
            ))}
        </div>
      </div>
    </section>
  );
}
