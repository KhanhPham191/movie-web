"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface TopicTag {
  name: string;
  href: string;
}

interface TopicTagsProps {
  tags: TopicTag[];
  className?: string;
}

export function TopicTags({ tags, className = "" }: TopicTagsProps) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className={`flex flex-wrap items-center gap-2 sm:gap-3 ${className}`}>
      {tags.map((tag, index) => (
        <Link
          key={tag.href}
          href={tag.href}
          className="group/tag inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-[#F6C453]/50 text-white text-xs sm:text-sm font-medium transition-all duration-300 hover:scale-105"
        >
          <span>{tag.name}</span>
          <ChevronRight className="w-3 h-3 opacity-0 group-hover/tag:opacity-100 transition-opacity" />
        </Link>
      ))}
    </div>
  );
}

// Predefined topic tags based on RoPhim
export const DEFAULT_TOPIC_TAGS: TopicTag[] = [];
