"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { MovieCard } from "@/components/movie-card";
import type { FilmItem } from "@/lib/api";

interface MovieSectionProps {
  title: string;
  movies: FilmItem[];
  href?: string;
  variant?: "default" | "portrait" | "top10";
}

export function MovieSection({ title, movies, href, variant = "default" }: MovieSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef<{ startX: number; scrollLeft: number }>({ startX: 0, scrollLeft: 0 });

  if (!movies || movies.length === 0) {
    return null;
  }

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    
    const container = scrollRef.current;
    const scrollAmount = container.clientWidth * 0.75;
    
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    const container = scrollRef.current;
    setShowLeftArrow(container.scrollLeft > 20);
    setShowRightArrow(
      container.scrollLeft < container.scrollWidth - container.clientWidth - 20
    );
  };

  // Get card width based on variant
  const getCardWidth = () => {
    switch (variant) {
      case "top10":
        return "w-[140px] sm:w-[170px] md:w-[190px] lg:w-[210px]";
      case "portrait":
        return "w-[120px] sm:w-[150px] md:w-[180px] lg:w-[210px]";
      default:
        return "w-[200px] sm:w-[240px] md:w-[280px] lg:w-[320px]";
    }
  };

  return (
    <section 
      className="relative py-4 group/section"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Section Header */}
      <div className="px-3 sm:px-4 md:px-12 mb-2">
        <Link 
          href={href || "#"} 
          className="group/title inline-flex items-center gap-1"
        >
          <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-white">
            {title}
          </h2>
          <span className="hidden sm:flex items-center text-[rgb(255,220,120)] text-xs sm:text-sm font-medium opacity-0 max-w-0 group-hover/title:opacity-100 group-hover/title:max-w-[120px] transition-all duration-300 overflow-hidden whitespace-nowrap">
            Xem tất cả
            <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
          </span>
        </Link>
      </div>

      {/* Slider Container */}
      <div className="relative">
        {/* Left Arrow */}
        <button
          onClick={() => scroll("left")}
          className={`absolute left-0 top-0 bottom-0 z-40 w-8 sm:w-12 md:w-16 flex items-center justify-center bg-black/50 hover:bg-black/80 transition-all duration-300 ${
            showLeftArrow && isHovering ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
        </button>

        {/* Right Arrow */}
        <button
          onClick={() => scroll("right")}
          className={`absolute right-0 top-0 bottom-0 z-40 w-8 sm:w-12 md:w-16 flex items-center justify-center bg-black/50 hover:bg-black/80 transition-all duration-300 ${
            showRightArrow && isHovering ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
        </button>

        {/* Scrollable Row */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onMouseDown={(e) => {
            if (!scrollRef.current) return;
            setIsDragging(true);
            dragState.current = { startX: e.clientX, scrollLeft: scrollRef.current.scrollLeft };
          }}
          onMouseMove={(e) => {
            if (!isDragging || !scrollRef.current) return;
            e.preventDefault();
            const dx = e.clientX - dragState.current.startX;
            scrollRef.current.scrollLeft = dragState.current.scrollLeft - dx;
          }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          className={`flex gap-2 sm:gap-3 overflow-x-auto scrollbar-hide px-3 sm:px-4 md:px-12 pb-12 sm:pb-16 pt-2 scroll-smooth select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          {movies.slice(0, 10).map((movie, index) => (
            <div
              key={`${movie.slug}-${index}`}
              className={`shrink-0 ${getCardWidth()}`}
            >
              <MovieCard 
                movie={movie} 
                index={index} 
                variant={variant}
                rank={variant === "top10" ? index + 1 : undefined}
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
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [isHovering, setIsHovering] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragState = useRef<{ startX: number; scrollLeft: number }>({ startX: 0, scrollLeft: 0 });

  if (!movies || movies.length === 0) return null;

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    const scrollAmount = container.clientWidth * 0.75;
    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const handleScroll = () => {
    if (!scrollRef.current) return;
    const container = scrollRef.current;
    setShowLeftArrow(container.scrollLeft > 20);
    setShowRightArrow(container.scrollLeft < container.scrollWidth - container.clientWidth - 20);
  };

  return (
    <section 
      className="relative py-4 group/section"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
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

      {/* Slider */}
      <div className="relative">
        {/* Arrows */}
        <button
          onClick={() => scroll("left")}
          className={`absolute left-0 top-0 bottom-0 z-40 w-8 sm:w-12 md:w-16 flex items-center justify-center bg-black/50 hover:bg-black/80 transition-all duration-300 ${
            showLeftArrow && isHovering ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
        </button>

        <button
          onClick={() => scroll("right")}
          className={`absolute right-0 top-0 bottom-0 z-40 w-8 sm:w-12 md:w-16 flex items-center justify-center bg-black/50 hover:bg-black/80 transition-all duration-300 ${
            showRightArrow && isHovering ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 text-white" />
        </button>

        {/* Top 10 Cards */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onMouseDown={(e) => {
            if (!scrollRef.current) return;
            setIsDragging(true);
            dragState.current = { startX: e.clientX, scrollLeft: scrollRef.current.scrollLeft };
          }}
          onMouseMove={(e) => {
            if (!isDragging || !scrollRef.current) return;
            e.preventDefault();
            const dx = e.clientX - dragState.current.startX;
            scrollRef.current.scrollLeft = dragState.current.scrollLeft - dx;
          }}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          className={`flex gap-2 sm:gap-3 md:gap-4 overflow-x-auto scrollbar-hide px-3 sm:px-4 md:px-12 pb-12 sm:pb-16 pt-2 scroll-smooth select-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        >
          {movies.slice(0, 10).map((movie, index) => (
            <div key={`${movie.slug}-${index}`} className="shrink-0 w-[120px] sm:w-[140px] md:w-[160px] lg:w-[180px]">
              <MovieCard movie={movie} index={index} variant="top10" rank={index + 1} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
