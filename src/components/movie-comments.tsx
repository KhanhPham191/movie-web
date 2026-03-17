"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, X } from "lucide-react";

interface MovieCommentsProps {
  movieSlug: string;
  movieName: string;
}

export function MovieComments({ movieSlug, movieName }: MovieCommentsProps) {
  const [commentText, setCommentText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCommentText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-[#F6C453]/20 to-[#D3A13A]/10 rounded-lg">
          <MessageSquare className="w-5 h-5 text-[#F6C453]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Bình luận</h2>
          <p className="text-sm text-gray-400 mt-0.5">0 bình luận</p>
        </div>
      </div>

      <form
        onSubmit={(e) => e.preventDefault()}
        className="w-full max-w-md md:max-w-lg mx-auto bg-gradient-to-br from-[#252833] to-[#1e2029] border border-[#3a3f4f]/50 rounded-xl p-5 md:p-6 shadow-lg shadow-black/20 space-y-4"
      >
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={commentText}
            onChange={handleTextareaChange}
            placeholder="Bình luận tạm thời không khả dụng..."
            disabled
            className="w-full min-h-[100px] md:min-h-[120px] max-h-[200px] px-4 py-3 bg-[#191b24] border border-[#3a3f4f] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F6C453]/50 focus:border-[#F6C453]/30 resize-none transition-all text-sm opacity-50 cursor-not-allowed"
          />
        </div>

        <div className="flex items-start gap-2 p-3 bg-[#F6C453]/10 border border-[#F6C453]/20 rounded-lg">
          <MessageSquare className="w-4 h-4 text-[#F6C453] mt-0.5 shrink-0" />
          <p className="text-xs text-gray-400">
            Tính năng bình luận đang được cập nhật. Vui lòng quay lại sau.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <X className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled
            className="bg-gradient-to-r from-[#F6C453] to-[#D3A13A] hover:from-[#D3A13A] hover:to-[#F6C453] text-black font-semibold px-6 py-2 shadow-lg shadow-[#F6C453]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Gửi bình luận
            </span>
          </Button>
        </div>
      </form>

      <div className="p-12 bg-gradient-to-br from-[#252833] to-[#1e2029] border border-[#3a3f4f]/50 rounded-xl text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-[#3a3f4f]/30 rounded-full flex items-center justify-center">
          <MessageSquare className="w-8 h-8 text-gray-600" />
        </div>
        <p className="text-gray-400 font-medium">Chưa có bình luận nào</p>
        <p className="text-sm text-gray-500 mt-1">Tính năng bình luận sẽ sớm được cập nhật!</p>
      </div>
    </div>
  );
}
