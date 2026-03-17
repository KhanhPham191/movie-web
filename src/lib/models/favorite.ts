import { Schema, model, models, Document, Types } from "mongoose";

export interface IFavorite extends Document {
  user_id: Types.ObjectId;
  movie_slug: string;
  movie_name: string;
  movie_thumb: string;
  movie_poster?: string;
  movie_year?: number;
  movie_quality?: string;
  movie_type?: string;
  added_at: Date;
}

const FavoriteSchema = new Schema<IFavorite>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  movie_slug: { type: String, required: true },
  movie_name: { type: String, required: true },
  movie_thumb: { type: String, required: true },
  movie_poster: { type: String, default: null },
  movie_year: { type: Number, default: null },
  movie_quality: { type: String, default: null },  // "HD", "FHD"
  movie_type: { type: String, default: null },     // "phim-bo", "phim-le"
  added_at: { type: Date, default: Date.now },
});

FavoriteSchema.index({ user_id: 1, movie_slug: 1 }, { unique: true });
FavoriteSchema.index({ user_id: 1, added_at: -1 });

const Favorite = models.Favorite || model<IFavorite>("Favorite", FavoriteSchema);
export default Favorite;
