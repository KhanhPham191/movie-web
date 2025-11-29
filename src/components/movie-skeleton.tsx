"use client";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function MovieCardSkeleton() {
  return (
    <Card className="overflow-hidden bg-card border-border/50">
      <div className="relative aspect-[2/3]">
        <Skeleton className="absolute inset-0" />
      </div>
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-12" />
          <Skeleton className="h-5 w-12" />
        </div>
      </div>
    </Card>
  );
}

export function MovieSectionSkeleton() {
  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 lg:gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function HeroSkeleton() {
  return (
    <section className="relative min-h-[90vh] flex items-end overflow-hidden bg-muted">
      <div className="container relative mx-auto px-4 pb-24">
        <div className="max-w-2xl space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <div className="flex gap-4">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
          <div className="flex gap-4 pt-4">
            <Skeleton className="h-12 w-32" />
            <Skeleton className="h-12 w-32" />
          </div>
        </div>
      </div>
    </section>
  );
}

