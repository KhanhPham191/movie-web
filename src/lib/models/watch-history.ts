import { Schema, model, models, Document, Types } from "mongoose";

export interface IWatchHistory extends Document {
  user_id: Types.ObjectId;
  movie_slug: string;
  movie_name: string;
  movie_thumb: string;
  movie_poster?: string;
  movie_year?: number;
  episode_slug: string;
  episode_name: string;
  server_name: string;
  watch_time: number;
  total_duration: number;
  completed: boolean;
  watched_at: Date;
  created_at: Date;
}

const WatchHistorySchema = new Schema<IWatchHistory>(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Denormalized từ OPhim API (lưu lại để hiển thị nhanh, không cần gọi lại API)
    movie_slug: { type: String, required: true },
    movie_name: { type: String, required: true },
    movie_thumb: { type: String, required: true },
    movie_poster: { type: String, default: null },
    movie_year: { type: Number, default: null },

    episode_slug: { type: String, required: true },
    episode_name: { type: String, required: true },
    server_name: { type: String, required: true },

    watch_time: { type: Number, default: 0 },       // giây đã xem
    total_duration: { type: Number, default: 0 },   // tổng thời lượng (giây)
    completed: { type: Boolean, default: false },    // true khi >= 90%

    watched_at: { type: Date, default: Date.now },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

// Mỗi user chỉ có 1 record cho mỗi tập phim
WatchHistorySchema.index(
  { user_id: 1, movie_slug: 1, episode_slug: 1 },
  { unique: true }
);
WatchHistorySchema.index({ user_id: 1, watched_at: -1 });
WatchHistorySchema.index({ movie_slug: 1 });

const WatchHistory =
  models.WatchHistory || model<IWatchHistory>("WatchHistory", WatchHistorySchema);
export default WatchHistory;
