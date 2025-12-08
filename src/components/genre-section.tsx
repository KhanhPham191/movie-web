"use client";

import Link from "next/link";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { GENRES } from "@/lib/api";

export function GenreSection() {
  return (
    <section className="py-6 border-b border-border/50">
      <div className="container mx-auto px-4">
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-4">
            <Link href="/">
              <Button
                variant="default"
                size="sm"
                className="shrink-0 bg-gradient-to-r from-[#FF2EBC] to-[#D946EF] hover:from-[#FF2EBC] hover:to-[#FF2EBC] text-white"
              >
                Tất cả
              </Button>
            </Link>
            {GENRES.map((genre) => (
              <Link key={genre.slug} href={`/the-loai/${genre.slug}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0 border-border/50 hover:border-primary hover:text-primary"
                >
                  {genre.name}
                </Button>
              </Link>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </section>
  );
}
