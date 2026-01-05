"use client";

import { createClient } from "./client";
import type { FilmItem } from "../api";

export interface Favorite {
  id: string;
  user_id: string;
  movie_slug: string;
  movie_name: string;
  movie_thumb?: string;
  movie_poster?: string;
  created_at: string;
}

export interface WatchHistory {
  id: string;
  user_id: string;
  movie_slug: string;
  movie_name: string;
  movie_thumb?: string;
  movie_poster?: string;
  episode_slug?: string;
  episode_name?: string;
  watch_time: number;
  last_watched_at: string;
  created_at: string;
}

export interface Rating {
  id: string;
  user_id: string;
  movie_slug: string;
  movie_name: string;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at: string;
}

export interface Playlist {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface PlaylistItem {
  id: string;
  playlist_id: string;
  movie_slug: string;
  movie_name: string;
  movie_thumb?: string;
  movie_poster?: string;
  added_at: string;
}

export interface CurrentlyWatching {
  id: string;
  user_id: string;
  movie_slug: string;
  movie_name: string;
  movie_thumb?: string;
  movie_poster?: string;
  episode_slug?: string;
  episode_name?: string;
  watch_time: number;
  total_duration: number;
  last_watched_at: string;
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string | null; // Cho phép null cho bình luận ẩn danh
  movie_slug: string;
  movie_name: string;
  content: string;
  parent_id?: string | null;
  created_at: string;
  updated_at: string;
  anonymous_name?: string | null; // Tên ngẫu nhiên cho bình luận ẩn danh (ví dụ: UserMov123)
  user_display_name?: string | null; // Tên hiển thị của user khi tạo comment
  // Joined data from auth.users
  user_email?: string;
  user_metadata?: {
    name?: string;
    username?: string;
  };
}

// ========== FAVORITES ==========
export async function addToFavorites(movie: FilmItem): Promise<{ error: any }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: { message: "Bạn cần đăng nhập" } };
    }

    const { error } = await supabase
      .from("favorites")
      .insert({
        user_id: user.id,
        movie_slug: movie.slug,
        movie_name: movie.name,
        movie_thumb: movie.thumb_url,
        movie_poster: movie.poster_url,
      });

    if (error) {
    }

    return { error };
  } catch (error) {
    return { error: { message: "Có lỗi xảy ra khi thêm vào yêu thích" } };
  }
}

export async function removeFromFavorites(movieSlug: string): Promise<{ error: any }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: { message: "Bạn cần đăng nhập" } };
    }

    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("movie_slug", movieSlug);

    if (error) {
    }

    return { error };
  } catch (error) {
    return { error: { message: "Có lỗi xảy ra khi xóa khỏi yêu thích" } };
  }
}

export async function isFavorite(movieSlug: string): Promise<boolean> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return false;

    const { data, error } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", user.id)
      .eq("movie_slug", movieSlug)
      .single();

    // Nếu bảng chưa tồn tại hoặc có lỗi, trả về false
    if (error) {
      return false;
    }

    return !!data;
  } catch (error) {
    return false;
  }
}

export async function getFavorites(): Promise<{ data: Favorite[] | null; error: any }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: { message: "Bạn cần đăng nhập" } };
    }

    const { data, error } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      // Nếu bảng chưa tồn tại, trả về mảng rỗng thay vì null
      if (error.code === "42P01") {
        return { data: [], error: null };
      }
    }

    return { data, error };
  } catch (error) {
    return { data: [], error: { message: "Có lỗi xảy ra khi lấy danh sách yêu thích" } };
  }
}

// ========== WATCH HISTORY ==========
export async function addToWatchHistory(
  movie: FilmItem,
  episodeSlug?: string,
  episodeName?: string
): Promise<{ error: any }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: { message: "Bạn cần đăng nhập" } };
  }

  const { error } = await supabase
    .from("watch_history")
    .upsert({
      user_id: user.id,
      movie_slug: movie.slug,
      movie_name: movie.name,
      movie_thumb: movie.thumb_url,
      movie_poster: movie.poster_url,
      episode_slug: episodeSlug,
      episode_name: episodeName,
      last_watched_at: new Date().toISOString(),
    }, {
      onConflict: "user_id,movie_slug,episode_slug"
    });

  return { error };
}

export async function updateWatchTime(
  movieSlug: string,
  watchTime: number,
  episodeSlug?: string
): Promise<{ error: any }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: { message: "Bạn cần đăng nhập" } };
  }

  const { error } = await supabase
    .from("watch_history")
    .update({
      watch_time: watchTime,
      last_watched_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("movie_slug", movieSlug)
    .eq("episode_slug", episodeSlug || "");

  return { error };
}

export async function getWatchHistory(): Promise<{ data: WatchHistory[] | null; error: any }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: { message: "Bạn cần đăng nhập" } };
  }

  const { data, error } = await supabase
    .from("watch_history")
    .select("*")
    .eq("user_id", user.id)
    .order("last_watched_at", { ascending: false })
    .limit(50);

  return { data, error };
}

export async function clearWatchHistory(): Promise<{ error: any }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: { message: "Bạn cần đăng nhập" } };
  }

  const { error } = await supabase
    .from("watch_history")
    .delete()
    .eq("user_id", user.id);

  return { error };
}

// ========== RATINGS ==========
export async function addRating(
  movie: FilmItem,
  rating: number,
  comment?: string
): Promise<{ error: any }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: { message: "Bạn cần đăng nhập" } };
  }

  if (rating < 1 || rating > 5) {
    return { error: { message: "Đánh giá phải từ 1 đến 5 sao" } };
  }

  const { error } = await supabase
    .from("ratings")
    .upsert({
      user_id: user.id,
      movie_slug: movie.slug,
      movie_name: movie.name,
      rating,
      comment,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: "user_id,movie_slug"
    });

  return { error };
}

export async function getUserRating(movieSlug: string): Promise<{ data: Rating | null; error: any }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: { message: "Bạn cần đăng nhập" } };
    }

    const { data, error } = await supabase
      .from("ratings")
      .select("*")
      .eq("user_id", user.id)
      .eq("movie_slug", movieSlug)
      .single();

    // Nếu không tìm thấy hoặc bảng chưa tồn tại, trả về null
    if (error) {
      if (error.code === "PGRST116" || error.code === "42P01") {
        return { data: null, error: null };
      }
    }

    return { data, error: error && error.code !== "PGRST116" ? error : null };
  } catch (error) {
    return { data: null, error: { message: "Có lỗi xảy ra khi lấy đánh giá" } };
  }
}

export async function getMovieRatings(movieSlug: string): Promise<{ data: Rating[] | null; error: any }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("ratings")
    .select("*")
    .eq("movie_slug", movieSlug)
    .order("created_at", { ascending: false })
    .limit(20);

  return { data, error };
}

export async function deleteRating(movieSlug: string): Promise<{ error: any }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: { message: "Bạn cần đăng nhập" } };
  }

  const { error } = await supabase
    .from("ratings")
    .delete()
    .eq("user_id", user.id)
    .eq("movie_slug", movieSlug);

  return { error };
}

// ========== CURRENTLY WATCHING ==========
export async function addToCurrentlyWatching(
  movie: FilmItem,
  episodeSlug?: string,
  episodeName?: string,
  watchTime: number = 0,
  totalDuration: number = 0
): Promise<{ error: any }> {
  try {
  const supabase = createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      // Nếu lỗi do Supabase chưa cấu hình, trả về null error (không lưu được nhưng không crash)
      if (userError.message?.includes('Invalid API key') || 
          userError.message?.includes('fetch') ||
          userError.message?.includes('network')) {
        return { error: null };
      }
    }
  
  if (!user) {
    return { error: { message: "Bạn cần đăng nhập" } };
  }

  const { error } = await supabase
    .from("currently_watching")
    .upsert({
      user_id: user.id,
      movie_slug: movie.slug,
      movie_name: movie.name,
      movie_thumb: movie.thumb_url,
      movie_poster: movie.poster_url,
      episode_slug: episodeSlug,
      episode_name: episodeName,
      watch_time: watchTime,
      total_duration: totalDuration,
      last_watched_at: new Date().toISOString(),
    }, {
      onConflict: "user_id,movie_slug"
    });

    // Nếu lỗi do table chưa tồn tại hoặc Supabase chưa cấu hình, trả về null error
    if (error && (error.message?.includes('relation') || 
                  error.message?.includes('does not exist') ||
                  error.message?.includes('Invalid API key'))) {
      return { error: null };
    }

  return { error };
  } catch (error: any) {
    return { error: null }; // Không throw error
  }
}

export async function updateCurrentlyWatching(
  movieSlug: string,
  watchTime: number,
  totalDuration: number,
  episodeSlug?: string
): Promise<{ error: any }> {
  try {
  const supabase = createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      if (userError.message?.includes('Invalid API key') || 
          userError.message?.includes('fetch') ||
          userError.message?.includes('network')) {
        return { error: null };
      }
    }
  
  if (!user) {
    return { error: { message: "Bạn cần đăng nhập" } };
  }

  const { error } = await supabase
    .from("currently_watching")
    .update({
      watch_time: watchTime,
      total_duration: totalDuration,
      episode_slug: episodeSlug,
      last_watched_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("movie_slug", movieSlug);

    if (error && (error.message?.includes('relation') || 
                  error.message?.includes('does not exist') ||
                  error.message?.includes('Invalid API key'))) {
      return { error: null };
    }

  return { error };
  } catch (error: any) {
    return { error: null };
  }
}

export async function getCurrentlyWatching(): Promise<{ data: CurrentlyWatching[] | null; error: any }> {
  try {
  const supabase = createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      // Nếu lỗi do Supabase chưa cấu hình, trả về empty array
      if (userError.message?.includes('Invalid API key') || 
          userError.message?.includes('fetch') ||
          userError.message?.includes('network')) {
        return { data: [], error: null };
      }
    }
  
  if (!user) {
    return { data: null, error: { message: "Bạn cần đăng nhập" } };
  }

  const { data, error } = await supabase
    .from("currently_watching")
    .select("*")
    .eq("user_id", user.id)
    .order("last_watched_at", { ascending: false })
    .limit(20);

    // Nếu lỗi do Supabase chưa cấu hình hoặc table chưa tồn tại, trả về empty array
    if (error && (error.message?.includes('Invalid API key') || 
                  error.message?.includes('relation') ||
                  error.message?.includes('does not exist'))) {
      return { data: [], error: null };
    }

  return { data, error };
  } catch (error: any) {
    // Nếu có lỗi network hoặc Supabase chưa cấu hình, trả về empty array
    return { data: [], error: null };
  }
}

export async function removeFromCurrentlyWatching(movieSlug: string): Promise<{ error: any }> {
  try {
  const supabase = createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      if (userError.message?.includes('Invalid API key') || 
          userError.message?.includes('fetch') ||
          userError.message?.includes('network')) {
        return { error: null };
      }
    }
  
  if (!user) {
    return { error: { message: "Bạn cần đăng nhập" } };
  }

  const { error } = await supabase
    .from("currently_watching")
    .delete()
    .eq("user_id", user.id)
    .eq("movie_slug", movieSlug);

    if (error && (error.message?.includes('relation') || 
                  error.message?.includes('does not exist') ||
                  error.message?.includes('Invalid API key'))) {
      return { error: null };
    }

  return { error };
  } catch (error: any) {
    return { error: null };
  }
}

// ========== PLAYLISTS ==========
export async function createPlaylist(
  name: string,
  description?: string,
  isPublic: boolean = false
): Promise<{ data: Playlist | null; error: any }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: { message: "Bạn cần đăng nhập" } };
  }

  const { data, error } = await supabase
    .from("playlists")
    .insert({
      user_id: user.id,
      name,
      description,
      is_public: isPublic,
    })
    .select()
    .single();

  return { data, error };
}

export async function getPlaylists(): Promise<{ data: Playlist[] | null; error: any }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: { message: "Bạn cần đăng nhập" } };
    }

    const { data, error } = await supabase
      .from("playlists")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      // Nếu bảng chưa tồn tại, trả về mảng rỗng
      if (error.code === "42P01") {
        return { data: [], error: null };
      }
    }

    return { data, error };
  } catch (error) {
    return { data: [], error: { message: "Có lỗi xảy ra khi lấy danh sách phát" } };
  }
}

export async function addToPlaylist(
  playlistId: string,
  movie: FilmItem
): Promise<{ error: any }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: { message: "Bạn cần đăng nhập" } };
  }

  const { error } = await supabase
    .from("playlist_items")
    .insert({
      playlist_id: playlistId,
      movie_slug: movie.slug,
      movie_name: movie.name,
      movie_thumb: movie.thumb_url,
      movie_poster: movie.poster_url,
    });

  return { error };
}

export async function getPlaylistItems(playlistId: string): Promise<{ data: PlaylistItem[] | null; error: any }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("playlist_items")
    .select("*")
    .eq("playlist_id", playlistId)
    .order("added_at", { ascending: false });

  return { data, error };
}

export async function removeFromPlaylist(playlistId: string, movieSlug: string): Promise<{ error: any }> {
  const supabase = createClient();

  const { error } = await supabase
    .from("playlist_items")
    .delete()
    .eq("playlist_id", playlistId)
    .eq("movie_slug", movieSlug);

  return { error };
}

export async function deletePlaylist(playlistId: string): Promise<{ error: any }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: { message: "Bạn cần đăng nhập" } };
  }

  const { error } = await supabase
    .from("playlists")
    .delete()
    .eq("id", playlistId)
    .eq("user_id", user.id);

  return { error };
}

// ========== COMMENTS ==========
// Hàm tạo tên ngẫu nhiên cho bình luận ẩn danh: UserMov + số random (100-99999)
function generateAnonymousName(): string {
  const randomNumber = Math.floor(Math.random() * (99999 - 100 + 1)) + 100;
  return `UserMov${randomNumber}`;
}

export async function addComment(
  movieSlug: string,
  movieName: string,
  content: string,
  parentId?: string | null
): Promise<{ data: Comment | null; error: any }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!content || content.trim().length === 0) {
      return { data: null, error: { message: "Nội dung bình luận không được để trống" } };
    }

    if (content.length > 2000) {
      return { data: null, error: { message: "Bình luận không được vượt quá 2000 ký tự" } };
    }

    // Generate tên ngẫu nhiên nếu là bình luận ẩn danh
    const anonymousName = !user ? generateAnonymousName() : null;

    // Cho phép bình luận ẩn danh (user_id = null) hoặc bình luận có đăng nhập
    // Tạm thời không insert user_display_name để tránh lỗi nếu cột chưa tồn tại
    // Sau khi chạy SQL thêm cột user_display_name, có thể thêm lại:
    // user_display_name: user?.user_metadata?.username || null
    const { data, error } = await supabase
      .from("comments")
      .insert({
        user_id: user?.id || null, // null nếu không đăng nhập
        movie_slug: movieSlug,
        movie_name: movieName,
        content: content.trim(),
        parent_id: parentId || null,
        anonymous_name: anonymousName, // Lưu tên ngẫu nhiên cho bình luận ẩn danh
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    // Lấy thông tin user để hiển thị (chỉ nếu đã đăng nhập)
    const commentWithUser: Comment = {
      ...data,
      user_email: user?.email,
      user_metadata: user?.user_metadata,
    };

    return { data: commentWithUser, error: null };
  } catch (error) {
    return { data: null, error: { message: "Có lỗi xảy ra khi thêm bình luận" } };
  }
}

export async function getMovieComments(movieSlug: string): Promise<{ data: Comment[] | null; error: any }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("movie_slug", movieSlug)
      .is("parent_id", null) // Chỉ lấy comment gốc, không lấy reply
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      // Nếu bảng chưa tồn tại, trả về mảng rỗng
      if (error.code === "42P01") {
        return { data: [], error: null };
      }
      return { data: null, error };
    }

    // Lấy thông tin user hiện tại để so sánh
    const { data: { user: currentUser } } = await supabase.auth.getUser();

    // Map comments với user info (chỉ có thể lấy info của user hiện tại)
    const commentsWithUsers: Comment[] = (data || []).map((comment) => {
      const isCurrentUser = currentUser && comment.user_id === currentUser.id;
      return {
        ...comment,
        user_email: isCurrentUser ? currentUser.email : undefined,
        user_metadata: isCurrentUser ? currentUser.user_metadata : undefined,
      };
    });

    return { data: commentsWithUsers, error: null };
  } catch (error) {
    return { data: [], error: { message: "Có lỗi xảy ra khi lấy bình luận" } };
  }
}

export async function getCommentReplies(parentId: string): Promise<{ data: Comment[] | null; error: any }> {
  try {
    const supabase = createClient();

    const { data, error } = await supabase
      .from("comments")
      .select("*")
      .eq("parent_id", parentId)
      .order("created_at", { ascending: true })
      .limit(20);

    if (error) {
      if (error.code === "42P01") {
        return { data: [], error: null };
      }
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    return { data: [], error: { message: "Có lỗi xảy ra khi lấy phản hồi" } };
  }
}

export async function updateComment(commentId: string, content: string): Promise<{ error: any }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { error: { message: "Bạn cần đăng nhập" } };
    }

    if (!content || content.trim().length === 0) {
      return { error: { message: "Nội dung bình luận không được để trống" } };
    }

    if (content.length > 2000) {
      return { error: { message: "Bình luận không được vượt quá 2000 ký tự" } };
    }

    const { error } = await supabase
      .from("comments")
      .update({
        content: content.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", commentId)
      .eq("user_id", user.id);

    return { error };
  } catch (error) {
    return { error: { message: "Có lỗi xảy ra khi cập nhật bình luận" } };
  }
}

export async function deleteComment(commentId: string): Promise<{ error: any }> {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    // Nếu đã đăng nhập, xóa bình luận của user đó
    if (user) {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId)
        .eq("user_id", user.id);

      return { error };
    }

    // Nếu không đăng nhập, thử xóa bình luận ẩn danh
    // RLS policy sẽ kiểm tra xem bình luận có phải ẩn danh và trong thời gian cho phép không
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .is("user_id", null);

    return { error };
  } catch (error) {
    return { error: { message: "Có lỗi xảy ra khi xóa bình luận" } };
  }
}


