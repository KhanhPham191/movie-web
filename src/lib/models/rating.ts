import { Schema, model, models, Document, Types } from "mongoose";

export interface IRating extends Document {
  user_id: Types.ObjectId;
  movie_slug: string;
  score: number;
  created_at: Date;
  updated_at: Date;
}

const RatingSchema = new Schema<IRating>(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    movie_slug: { type: String, required: true },
    score: { type: Number, required: true, min: 1, max: 10 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// Mỗi user chỉ rate 1 lần cho mỗi phim
RatingSchema.index({ user_id: 1, movie_slug: 1 }, { unique: true });
RatingSchema.index({ movie_slug: 1 });

const Rating = models.Rating || model<IRating>("Rating", RatingSchema);
export default Rating;
