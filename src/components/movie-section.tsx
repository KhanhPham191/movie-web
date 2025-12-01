"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MovieCard } from "@/components/movie-card";
import type { FilmItem } from "@/lib/api";

interface MovieSectionProps {
  title: string;
  movies: FilmItem[];
  href?: string;
  icon?: string;
}

export function MovieSection({ title, movies, href, icon }: MovieSectionProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  if (!movies || movies.length === 0) {
    return null;
  }

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    
    const container = scrollRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    
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

  return (
    <section className="relative py-6 group/section">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center gap-2 mb-4">
          <Link 
            href={href || "#"} 
            className="group/title flex items-center gap-2"
          >
            {icon && <span className="text-lg">{icon}</span>}
            <h2 className="text-lg md:text-xl lg:text-2xl font-bold tracking-tight">
              {title}
            </h2>
            <span className="text-blue-500 text-sm font-medium opacity-0 -translate-x-2 group-hover/title:opacity-100 group-hover/title:translate-x-0 transition-all duration-300 flex items-center">
              Xem tất cả
              <ChevronRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </div>

      {/* Netflix-style Slider */}
      <div className="relative">
        {/* Left Arrow */}
        <button
          onClick={() => scroll("left")}
          className={`absolute left-0 top-0 bottom-8 z-20 w-12 md:w-16 flex items-center justify-center bg-gradient-to-r from-background via-background/80 to-transparent transition-opacity duration-300 ${
            showLeftArrow ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </div>
        </button>

        {/* Right Arrow */}
        <button
          onClick={() => scroll("right")}
          className={`absolute right-0 top-0 bottom-8 z-20 w-12 md:w-16 flex items-center justify-center bg-gradient-to-l from-background via-background/80 to-transparent transition-opacity duration-300 ${
            showRightArrow ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          <div className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <ChevronRight className="w-6 h-6" />
          </div>
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex gap-2 md:gap-3 overflow-x-auto scrollbar-hide px-4 md:px-8 lg:px-12 pb-8 scroll-smooth"
          style={{ scrollPaddingLeft: "1rem" }}
        >
          {movies.slice(0, 24).map((movie, index) => (
            <div
              key={`${movie.slug}-${index}`}
              className="shrink-0 w-[140px] sm:w-[160px] md:w-[180px] lg:w-[200px]"
            >
              <MovieCard movie={movie} index={index} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
