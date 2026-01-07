"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, Trash2, Edit2, X } from "lucide-react";
import {
  addComment,
  getMovieComments,
  deleteComment,
  updateComment,
  type Comment,
} from "@/lib/supabase/movies";
import { Skeleton } from "@/components/ui/skeleton";

interface MovieCommentsProps {
  movieSlug: string;
  movieName: string;
}

export function MovieComments({ movieSlug, movieName }: MovieCommentsProps) {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    loadComments();
  }, [movieSlug]);

  const loadComments = async () => {
    setLoading(true);
    try {
      const { data, error } = await getMovieComments(movieSlug);
      if (error) {
        console.error("Error loading comments:", error);
        setComments([]);
      } else {
        setComments(data || []);
      }
    } catch (err) {
      console.error("Error loading comments:", err);
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentText.trim()) {
      setError("Nội dung bình luận không được để trống");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { data, error } = await addComment(movieSlug, movieName, commentText);
      if (error) {
        setError(error.message || "Có lỗi xảy ra khi thêm bình luận");
      } else if (data) {
        // Nếu là bình luận ẩn danh, lưu ID vào localStorage để có thể xóa sau
        if (!isAuthenticated && data.id) {
          const anonymousComments = JSON.parse(
            localStorage.getItem("anonymous_comments") || "[]"
          ) as string[];
          if (!anonymousComments.includes(data.id)) {
            anonymousComments.push(data.id);
            localStorage.setItem("anonymous_comments", JSON.stringify(anonymousComments));
          }
        }
        setComments([data, ...comments]);
        setCommentText("");
        if (textareaRef.current) {
          textareaRef.current.style.height = "auto";
        }
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi thêm bình luận");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa bình luận này?")) {
      return;
    }

    try {
      const { error } = await deleteComment(commentId);
      if (error) {
        setError(error.message || "Có lỗi xảy ra khi xóa bình luận");
      } else {
        // Xóa ID khỏi localStorage nếu là bình luận ẩn danh
        const anonymousComments = JSON.parse(
          localStorage.getItem("anonymous_comments") || "[]"
        ) as string[];
        const updatedComments = anonymousComments.filter((id) => id !== commentId);
        localStorage.setItem("anonymous_comments", JSON.stringify(updatedComments));
        
        setComments(comments.filter((c) => c.id !== commentId));
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi xóa bình luận");
    }
  };

  const handleStartEdit = (comment: Comment) => {
    setEditingId(comment.id);
    setEditText(comment.content);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editText.trim()) {
      setError("Nội dung bình luận không được để trống");
      return;
    }

    try {
      const { error } = await updateComment(commentId, editText);
      if (error) {
        setError(error.message || "Có lỗi xảy ra khi cập nhật bình luận");
      } else {
        setComments(
          comments.map((c) =>
            c.id === commentId ? { ...c, content: editText, updated_at: new Date().toISOString() } : c
          )
        );
        setEditingId(null);
        setEditText("");
      }
    } catch (err) {
      setError("Có lỗi xảy ra khi cập nhật bình luận");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    return date.toLocaleDateString("vi-VN", { day: "numeric", month: "numeric", year: "numeric" });
  };

  const getUserDisplayName = (comment: Comment) => {
    // Nếu là bình luận ẩn danh (user_id = null), hiển thị tên ngẫu nhiên
    if (!comment.user_id) {
      // Nếu có anonymous_name trong database, dùng nó
      if (comment.anonymous_name) {
        return comment.anonymous_name;
      }
      // Fallback: generate dựa trên comment ID để đảm bảo cùng một comment luôn có cùng tên
      // Lấy 5 ký tự cuối của UUID và convert sang số để tạo số random cố định
      const idSuffix = comment.id.slice(-5);
      const hashNumber = parseInt(idSuffix.replace(/[^0-9]/g, '').padEnd(5, '0').slice(0, 5)) || 12345;
      const randomNumber = (hashNumber % 98900) + 100; // Đảm bảo số từ 100-99999
      return `UserMov${randomNumber}`;
    }
    
    // Hiển thị username từ user_display_name (đã lưu khi tạo comment)
    if (comment.user_display_name) {
      return comment.user_display_name;
    }
    
    // Fallback: dùng username từ user_metadata (cho comment cũ chưa có user_display_name)
    if (comment.user_metadata?.username) {
      return comment.user_metadata.username;
    }
    
    return "Người dùng";
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCommentText(e.target.value);
    // Auto-resize textarea
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-slide-up">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gradient-to-br from-[#F6C453]/20 to-[#D3A13A]/10 rounded-lg">
          <MessageSquare className="w-5 h-5 text-[#F6C453]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">Bình luận</h2>
          <p className="text-sm text-gray-400 mt-0.5">{comments.length} bình luận</p>
        </div>
      </div>

      {/* Comment Form - Card style, nhỏ và đẹp */}
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md md:max-w-lg mx-auto bg-gradient-to-br from-[#252833] to-[#1e2029] border border-[#3a3f4f]/50 rounded-xl p-5 md:p-6 shadow-lg shadow-black/20 space-y-4"
      >
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={commentText}
            onChange={handleTextareaChange}
            placeholder={isAuthenticated ? "Viết bình luận của bạn..." : "Viết bình luận ẩn danh..."}
            className="w-full min-h-[100px] md:min-h-[120px] max-h-[200px] px-4 py-3 bg-[#191b24] border border-[#3a3f4f] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F6C453]/50 focus:border-[#F6C453]/30 resize-none transition-all text-sm"
            disabled={submitting}
          />
          <div className="absolute bottom-3 right-3 text-xs text-gray-500 bg-[#191b24]/80 px-2 py-0.5 rounded">
            {commentText.length}/2000
          </div>
        </div>

        {!isAuthenticated && (
          <div className="flex items-start gap-2 p-3 bg-[#F6C453]/10 border border-[#F6C453]/20 rounded-lg">
            <MessageSquare className="w-4 h-4 text-[#F6C453] mt-0.5 shrink-0" />
            <p className="text-xs text-gray-400">
              Bạn đang bình luận ẩn danh.{" "}
              <button
                type="button"
                onClick={() => {
                  const loginModal = document.getElementById("login-modal-trigger");
                  if (loginModal) {
                    loginModal.click();
                  }
                }}
                className="text-[#F6C453] hover:text-[#D3A13A] font-medium underline transition-colors"
              >
                Đăng nhập
              </button>{" "}
              để hiển thị tên của bạn.
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
            <X className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            disabled={submitting || !commentText.trim()}
            className="bg-gradient-to-r from-[#F6C453] to-[#D3A13A] hover:from-[#D3A13A] hover:to-[#F6C453] text-black font-semibold px-6 py-2 shadow-lg shadow-[#F6C453]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Đang gửi...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Gửi bình luận
              </span>
            )}
          </Button>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-5 bg-[#252833] border border-[#3a3f4f] rounded-xl space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))
        ) : comments.length === 0 ? (
          <div className="p-12 bg-gradient-to-br from-[#252833] to-[#1e2029] border border-[#3a3f4f]/50 rounded-xl text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#3a3f4f]/30 rounded-full flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-gray-600" />
            </div>
            <p className="text-gray-400 font-medium">Chưa có bình luận nào</p>
            <p className="text-sm text-gray-500 mt-1">Hãy là người đầu tiên bình luận!</p>
          </div>
        ) : (
          comments.map((comment) => {
            const isAuthenticatedOwner = user && comment.user_id && comment.user_id === user.id;
            const anonymousComments = JSON.parse(
              localStorage.getItem("anonymous_comments") || "[]"
            ) as string[];
            const isAnonymousOwner = !comment.user_id && anonymousComments.includes(comment.id);
            const isOwner = isAuthenticatedOwner || isAnonymousOwner;
            const isEditing = editingId === comment.id;

            return (
              <div
                key={comment.id}
                className="group p-5 bg-gradient-to-br from-[#252833] to-[#1e2029] border border-[#3a3f4f]/50 rounded-xl hover:border-[#F6C453]/40 hover:shadow-lg hover:shadow-[#F6C453]/10 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F6C453] to-[#D3A13A] flex items-center justify-center text-black font-bold text-base shrink-0 shadow-lg shadow-[#F6C453]/30">
                      {getUserDisplayName(comment).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-semibold text-white text-base">
                          {getUserDisplayName(comment)}
                        </span>
                        {isOwner && (
                          <span className="text-xs px-2.5 py-1 bg-gradient-to-r from-[#F6C453]/20 to-[#D3A13A]/20 text-[#F6C453] rounded-full border border-[#F6C453]/30">
                            Bạn
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span>{formatDate(comment.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  {isOwner && !isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleStartEdit(comment)}
                        className="p-2 hover:bg-[#3a3f4f] rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit2 className="w-4 h-4 text-gray-400 hover:text-[#F6C453]" />
                      </button>
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="p-2 hover:bg-red-900/30 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-3 pt-2 border-t border-[#3a3f4f]">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full min-h-[100px] px-4 py-3 bg-[#191b24] border border-[#3a3f4f] rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#F6C453]/50 focus:border-[#F6C453]/30 resize-none text-sm"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        onClick={() => handleSaveEdit(comment.id)}
                        size="sm"
                        className="bg-gradient-to-r from-[#F6C453] to-[#D3A13A] hover:from-[#D3A13A] hover:to-[#F6C453] text-black font-medium"
                        disabled={!editText.trim()}
                      >
                        Lưu
                      </Button>
                      <Button
                        onClick={handleCancelEdit}
                        size="sm"
                        variant="ghost"
                        className="text-gray-400 hover:text-white hover:bg-[#3a3f4f]"
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-200 text-sm md:text-base leading-relaxed whitespace-pre-wrap break-words pl-1">
                    {comment.content}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

