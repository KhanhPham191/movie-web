"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { MovieCard } from "@/components/movie-card";
import type { FilmItem } from "@/lib/api";

interface MovieSectionProps {
  title: string;
  movies: FilmItem[];
  href?: string;
  icon?: string;
}

export function MovieSection({ title, movies, href, icon }: MovieSectionProps) {
  if (!movies || movies.length === 0) {
    return null;
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight flex items-center gap-2">
            {icon && <span>{icon}</span>}
            {title}
          </h2>
          {href && (
            <Link href={href}>
              <Button
                variant="ghost"
                className="text-muted-foreground hover:text-primary gap-1"
              >
                Xem tất cả
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>

        {/* Horizontal Scroll on Mobile, Grid on Desktop */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 lg:gap-6">
          {movies.slice(0, 24).map((movie, index) => (
            <MovieCard key={`${movie.slug}-${index}`} movie={movie} index={index} />
          ))}
        </div>

        {/* Mobile Horizontal Scroll */}
        <ScrollArea className="md:hidden w-full">
          <div className="flex gap-4 pb-4">
            {movies.slice(0, 20).map((movie, index) => (
              <div key={`${movie.slug}-${index}`} className="w-40 shrink-0">
                <MovieCard movie={movie} index={index} />
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </section>
  );
}
