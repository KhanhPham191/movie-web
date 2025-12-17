"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExpandableCategoriesProps {
  categories: any[];
}

export function ExpandableCategories({
  categories,
}: ExpandableCategoriesProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Hiển thị 3 thể loại đầu tiên khi chưa expand
  const visibleCategories = isExpanded ? categories : categories.slice(0, 3);
  const hasMore = categories.length > 3;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {visibleCategories.map((cat, index) => {
          const catId =
            typeof cat === "object" && cat !== null
              ? (cat as any)?.id || index
              : index;
          const catSlug =
            typeof cat === "object" && cat !== null
              ? (cat as any)?.slug || ""
              : typeof cat === "string"
              ? cat
              : "";
          const catName =
            typeof cat === "object" && cat !== null
              ? (cat as any)?.name ||
                String((cat as any)?.id || "") ||
                "Unknown"
              : String(cat || "Unknown");

          if (!catSlug) return null;

          return (
            <Link key={catId} href={`/the-loai/${catSlug}`}>
              <Badge
                variant="outline"
                className="bg-[#151515] border-[#F6C453]/30 text-white hover:border-[#F6C453] hover:bg-[#F6C453]/15 cursor-pointer transition-all rounded-full"
              >
                {catName}
              </Badge>
            </Link>
          );
        })}
      </div>
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-[#F6C453] hover:text-[#F6C453]/80 text-xs sm:text-sm font-medium transition-colors mt-1 cursor-pointer"
        >
          <span>{isExpanded ? "Thu gọn" : "Xem thêm thể loại >"}</span>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      )}
    </div>
  );
}


