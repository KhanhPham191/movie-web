"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface ExpandableContentProps {
  title: string;
  content: string | React.ReactNode;
  maxLines?: number;
  className?: string;
}

export function ExpandableContent({
  title,
  content,
  maxLines = 3,
  className = "",
}: ExpandableContentProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isString = typeof content === "string";
  const contentString = isString ? content : "";
  
  // Tạo text ngắn gọn (khoảng 220 ký tự)
  const truncatedText = isString
    ? contentString.replace(/<[^>]*>/g, "").slice(0, 220) + "..."
    : "";

  // Kiểm tra xem content có dài hơn 220 ký tự không
  const needsTruncation = isString && contentString.replace(/<[^>]*>/g, "").length > 220;

  return (
    <div className={`space-y-2 ${className}`}>
      <div
        className={`text-white/80 text-xs sm:text-sm leading-relaxed ${
          isExpanded ? "" : `line-clamp-${maxLines}`
        }`}
        style={
          !isExpanded && maxLines === 3
            ? {
                WebkitLineClamp: 3,
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
            : !isExpanded && maxLines === 2
            ? {
                WebkitLineClamp: 2,
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
            : !isExpanded && maxLines === 1
            ? {
                WebkitLineClamp: 1,
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
            : {}
        }
      >
        {isString ? (
          <div
            className="prose prose-invert prose-sm max-w-none"
            dangerouslySetInnerHTML={{
              __html: isExpanded ? content : truncatedText,
            }}
          />
        ) : (
          <div className={isExpanded ? "" : "overflow-hidden"}>
            {content}
          </div>
        )}
      </div>
      {(needsTruncation || !isString) && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-[#fb743E] hover:text-[#fb743E]/80 text-xs sm:text-sm font-medium transition-colors mt-1"
        >
          <span>{isExpanded ? "Thu gọn" : title}</span>
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


