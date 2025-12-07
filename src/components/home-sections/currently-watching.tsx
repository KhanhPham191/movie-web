"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { CurrentlyWatchingCard } from "@/components/currently-watching-card";
import { getCurrentlyWatching, type CurrentlyWatching } from "@/lib/supabase/movies";
import { useAuth } from "@/contexts/auth-context";

export function CurrentlyWatchingSection() {
  const [items, setItems] = useState<CurrentlyWatching[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();
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

  // Smooth scroll với momentum - Phải đặt trước early returns
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    
    const now = performance.now();
    const dx = e.clientX - dragState.current.startX;
    
    if (Math.abs(dx) > 1) {
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
      const avgVelocity = dragState.current.velocities.reduce((a, b) => a + b, 0) / dragState.current.velocities.length;
      
      if (Math.abs(avgVelocity) > 0.1) {
        let momentum = avgVelocity * 15;
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
          console.error("Error fetching currently watching:", error);
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
        }
      } catch (error) {
        console.error("Error fetching currently watching:", error);
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    // Refresh khi focus lại tab/window (khi user quay lại từ trang xem phim)
    const handleFocus = () => {
      fetchData();
    };

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
    };
  }, [isAuthenticated]);

  // Hiển thị message nếu chưa đăng nhập
  if (!isAuthenticated) {
    return (
      <section className="relative py-4 xs:py-5 sm:py-6 group/section bg-gradient-to-b from-[#fb743E]/5 via-transparent to-transparent -mx-3 sm:-mx-4 md:-mx-8 lg:-mx-12 px-3 sm:px-4 md:px-8 lg:px-12 rounded-lg">
        <div className="px-2 xs:px-3 sm:px-4 md:px-8 lg:px-12 mb-3 sm:mb-4">
          <div className="inline-flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-[#fb743E] to-[#ff9d6b] rounded-full"></div>
              <h2 className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white">
                Bạn đang xem
              </h2>
            </div>
          </div>
          <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-gray-400">
            <Link href="/dang-nhap" className="text-[#fb743E] hover:text-[#ff9d6b] underline">
              Đăng nhập
            </Link> để lưu tiến độ xem và tiếp tục xem các phim yêu thích của bạn
          </p>
        </div>
      </section>
    );
  }

  // Không hiển thị nếu đang loading hoặc không có dữ liệu
  if (isLoading || items.length === 0) {
    return null;
  }

  return (
    <section className="relative py-4 xs:py-5 sm:py-6 group/section bg-gradient-to-b from-[#fb743E]/5 via-transparent to-transparent -mx-3 sm:-mx-4 md:-mx-8 lg:-mx-12 px-3 sm:px-4 md:px-8 lg:px-12 rounded-lg">
      {/* Section Header - Nổi bật hơn */}
      <div className="px-2 xs:px-3 sm:px-4 md:px-8 lg:px-12 mb-3 sm:mb-4 md:mb-5">
        <div className="inline-flex items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-[#fb743E] to-[#ff9d6b] rounded-full"></div>
            <h2 className="text-sm xs:text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-white">
              Bạn đang xem
            </h2>
          </div>
          <div className="px-2 py-1 bg-[#fb743E]/20 border border-[#fb743E]/30 rounded-full">
            <span className="text-[10px] xs:text-xs text-[#fb743E] font-semibold uppercase tracking-wide">
              Xem tiếp
            </span>
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
            if (hasDragged.current) {
              e.preventDefault();
              e.stopPropagation();
            }
          }}
          style={{
            scrollBehavior: isDragging ? 'auto' : 'smooth',
            willChange: isDragging ? 'scroll-position' : 'auto',
            overscrollBehaviorX: 'contain',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x',
          }}
          className={`flex items-start gap-3 sm:gap-4 overflow-x-auto scrollbar-hide px-3 sm:px-4 md:px-12 pb-12 sm:pb-16 pt-2 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          {items.slice(0, 10).map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="shrink-0 flex flex-col w-[135px] xs:w-[140px] sm:w-[145px] md:w-[165px] lg:w-[195px]"
            >
              <CurrentlyWatchingCard item={item} index={index} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

