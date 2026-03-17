"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Send, X } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

interface MovieCommentsProps {
  movieSlug: string;
  movieName: string;
}

interface CommentItem {
  id: string;
  movie_slug: string;
  user_id: string | null;
  author_name: string;
  author_avatar: string | null;
  content: string;
  parent_id: string | null;
  reply_count: number;
  likes: number;
  created_at: string;
  updated_at: string;
}

export function MovieComments({ movieSlug, movieName }: MovieCommentsProps) {
  const [commentText, setCommentText] = useState("");
  const [anonymousName, setAnonymousName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [items, setItems] = useState<CommentItem[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCommentText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  const commentCountLabel = useMemo(() => {
    const n = items.length;
    return `${n} bình luận`;
  }, [items.length]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetch(`/movpey/comments?movie_slug=${encodeURIComponent(movieSlug)}&limit=50`)
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!res.ok) {
          throw new Error(data?.error || "Không tải được bình luận");
        }
        return data;
      })
      .then((data) => {
        if (cancelled) return;
        setItems(Array.isArray(data?.items) ? data.items : []);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Không tải được bình luận");
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [movieSlug]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const content = commentText.trim();
    if (!content) {
      setError("Vui lòng nhập nội dung bình luận");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/movpey/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          movie_slug: movieSlug,
          movie_name: movieName,
          content,
          anonymous_name: user ? "" : anonymousName.trim(),
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error || "Gửi bình luận thất bại");
      }

      const created: CommentItem | null = data?.item || null;
      if (created) {
        setItems((prev) => [created, ...prev]);
      }

      setCommentText("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gửi bình luận thất bại");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-[#F6C453]/20 to-[#D3A13A]/10 rounded-lg">
          <MessageSquare className="w-5 h-5 text-[#F6C453]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Bình luận</h2>
          <p className="text-sm text-gray-400 mt-0.5">{commentCountLabel}</p>
        </div>
      </div>

      <form
        onSubmit={onSubmit}
        className="w-full max-w-md md:max-w-lg mx-auto bg-gradient-to-br from-[#252833] to-[#1e2029] border border-[#3a3f4f]/50 rounded-xl p-5 md:p-6 shadow-lg shadow-black/20 space-y-4"
      >
        {!user && (
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400">Tên hiển thị (tuỳ chọn)</label>
            <input
              value={anonymousName}
              onChange={(e) => setAnonymousName(e.target.value)}
              placeholder="Ẩn danh"
              maxLength={50}
              className="w-full px-4 py-2 bg-[#191b24] border border-[#3a3f4f] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F6C453]/50 focus:border-[#F6C453]/30 transition-all text-sm"
            />
          </div>
        )}
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={commentText}
            onChange={handleTextareaChange}
            placeholder={user ? "Viết bình luận của bạn..." : "Viết bình luận (có thể ẩn danh)..."}
            disabled={isSubmitting}
            className="w-full min-h-[100px] md:min-h-[120px] max-h-[200px] px-4 py-3 bg-[#191b24] border border-[#3a3f4f] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F6C453]/50 focus:border-[#F6C453]/30 resize-none transition-all text-sm disabled:opacity-50"
          />
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
            disabled={isSubmitting}
            className="bg-gradient-to-r from-[#F6C453] to-[#D3A13A] hover:from-[#D3A13A] hover:to-[#F6C453] text-black font-semibold px-6 py-2 shadow-lg shadow-[#F6C453]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              {isSubmitting ? "Đang gửi..." : "Gửi bình luận"}
            </span>
          </Button>
        </div>
      </form>

      {isLoading ? (
        <div className="p-12 bg-gradient-to-br from-[#252833] to-[#1e2029] border border-[#3a3f4f]/50 rounded-xl text-center">
          <p className="text-gray-400 font-medium">Đang tải bình luận...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 bg-gradient-to-br from-[#252833] to-[#1e2029] border border-[#3a3f4f]/50 rounded-xl text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-[#3a3f4f]/30 rounded-full flex items-center justify-center">
            <MessageSquare className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-gray-400 font-medium">Chưa có bình luận nào</p>
          <p className="text-sm text-gray-500 mt-1">Hãy là người đầu tiên bình luận cho phim này!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((c) => {
            const initial = (c.author_name || "?").trim().slice(0, 1).toUpperCase();
            return (
              <div
                key={c.id}
                className="bg-gradient-to-br from-[#252833] to-[#1e2029] border border-[#3a3f4f]/50 rounded-xl p-4 md:p-5 shadow-lg shadow-black/10"
              >
                <div className="flex items-start gap-3">
                  {c.author_avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.author_avatar}
                      alt={c.author_name}
                      className="w-9 h-9 rounded-full object-cover border border-white/10"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/80 text-sm font-semibold">
                      {initial}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-semibold text-white">{c.author_name}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(c.created_at).toLocaleString("vi-VN")}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-gray-200 whitespace-pre-wrap break-words">
                      {c.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
