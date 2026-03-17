"use client";

import React, { useRef, useState, useCallback, useEffect } from "react";
import { CurrentlyWatchingCard, type CurrentlyWatching } from "@/components/currently-watching-card";
import { useAuth } from "@/contexts/auth-context";

export function CurrentlyWatchingSection() {
  const [items, setItems] = useState<CurrentlyWatching[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { isAuthenticated } = useAuth();
  const scrollRef = useRef<HTMLDivElement>(null);
  const previousItemsRef = useRef<CurrentlyWatching[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const hasDragged = useRef(false);
  const dragDistance = useRef<number>(0);
  const dragStartTime = useRef<number>(0);
  const dragState = useRef<{
    startX: number;
    scrollLeft: number;
    lastX: number;
    lastTime: number;
    velocities: number[];
  }>({ startX: 0, scrollLeft: 0, lastX: 0, lastTime: 0, velocities: [] });
  const animationFrameRef = useRef<number | null>(null);
  const momentumRef = useRef<number | null>(null);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !scrollRef.current) return;
    const now = performance.now();
    const dx = e.clientX - dragState.current.startX;
    dragDistance.current = Math.abs(dx);
    if (dragDistance.current > 5) hasDragged.current = true;
    const currentScrollLeft = dragState.current.scrollLeft - dx;
    if (dragState.current.lastTime > 0) {
      const timeDelta = now - dragState.current.lastTime;
      const xDelta = e.clientX - dragState.current.lastX;
      if (timeDelta > 0) {
        const velocity = xDelta / timeDelta;
        dragState.current.velocities.push(velocity);
        if (dragState.current.velocities.length > 5) dragState.current.velocities.shift();
      }
    }
    dragState.current.lastX = e.clientX;
    dragState.current.lastTime = now;
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollLeft = currentScrollLeft;
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
            return;
          }
          scrollRef.current.scrollLeft = scrollRef.current.scrollLeft - momentum;
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
  }, [isDragging]);

  const fetchWatchHistory = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await fetch("/movpey/watch-history?limit=10&completed=false");
      if (!res.ok) return;
      const data = await res.json();
      const mapped: CurrentlyWatching[] = (data.items || []).map((item: any) => ({
        id: item.id,
        movie_slug: item.movie_slug,
        movie_name: item.movie_name,
        movie_thumb: item.movie_thumb,
        episode_slug: item.episode_slug,
        episode_name: item.episode_name,
        watch_time: item.watch_time,
        total_duration: item.total_duration,
        updated_at: item.watched_at,
      }));
      previousItemsRef.current = mapped;
      setItems(mapped);
    } catch {
      // silent fail
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }
    fetchWatchHistory();
  }, [isAuthenticated, fetchWatchHistory]);

  // Lắng nghe event khi xóa 1 item → refetch
  useEffect(() => {
    const handleUpdate = () => fetchWatchHistory();
    window.addEventListener("currently-watching-updated", handleUpdate);
    return () => window.removeEventListener("currently-watching-updated", handleUpdate);
  }, [fetchWatchHistory]);

  useEffect(() => {
    if (!isLoading && items.length > 0 && !isVisible) {
      const timer = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(timer);
    }
  }, [isLoading, items.length, isVisible]);

  if (!isAuthenticated) return null;
  if (!isLoading && items.length === 0 && previousItemsRef.current.length === 0) return null;

  const hasContent = items.length > 0 || previousItemsRef.current.length > 0;
  const displayItems = items.length > 0 ? items : previousItemsRef.current;

  return (
    <section
      className={`relative py-6 xs:py-7 sm:py-8 group/section px-0 ${isVisible ? "opacity-100" : "opacity-0"}`}
      style={{
        minHeight: hasContent ? undefined : 240,
        transition: isVisible ? 'opacity 0.4s ease-out' : 'none'
      }}
    >
      <div className="relative px-2 xs:px-3 sm:px-4 md:px-8 lg:px-12 mb-4 sm:mb-5 md:mb-6">
        <div className="inline-flex items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 w-1.5 h-10 sm:h-12 bg-gradient-to-b from-[#F6C453] to-[#D3A13A] rounded-full blur-sm opacity-75" />
              <div className="relative w-1.5 h-10 sm:h-12 bg-gradient-to-b from-[#F6C453] to-[#D3A13A] rounded-full" />
            </div>
            <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              Bạn đang xem
            </h2>
          </div>
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
            }
          }}
          onClickCapture={(e) => {
            if (hasDragged.current || dragDistance.current > 5) {
              e.preventDefault();
              e.stopPropagation();
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
          className={`flex items-start gap-3 sm:gap-4 overflow-x-auto scrollbar-hide px-3 sm:px-4 md:px-12 pb-12 sm:pb-16 pt-2 select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          {displayItems.slice(0, 10).map((item, index) => (
            <div
              key={item.id || `${item.movie_slug}-${item.episode_slug || 'main'}`}
              className="shrink-0 flex flex-col w-[135px] xs:w-[140px] sm:w-[145px] md:w-[165px] lg:w-[195px]"
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
              <CurrentlyWatchingCard item={item} index={index} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
