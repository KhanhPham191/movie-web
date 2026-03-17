import { Schema, model, models, Document, Types } from "mongoose";

export interface IComment extends Document {
  movie_slug: string;
  user_id?: Types.ObjectId;
  author_name: string;
  author_avatar?: string;
  content: string;
  parent_id?: Types.ObjectId;
  reply_count: number;
  is_hidden: boolean;
  likes: number;
  created_at: Date;
  updated_at: Date;
}

const CommentSchema = new Schema<IComment>(
  {
    movie_slug: { type: String, required: true },

    // null = bình luận ẩn danh
    user_id: { type: Schema.Types.ObjectId, ref: "User", default: null },
    author_name: { type: String, required: true, maxlength: 50 },
    author_avatar: { type: String, default: null },

    content: { type: String, required: true, maxlength: 2000 },

    // null = top-level comment, ObjectId = là reply của comment khác
    parent_id: { type: Schema.Types.ObjectId, ref: "Comment", default: null },
    reply_count: { type: Number, default: 0 },

    is_hidden: { type: Boolean, default: false },
    likes: { type: Number, default: 0 },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

CommentSchema.index({ movie_slug: 1, parent_id: 1, created_at: -1 });
CommentSchema.index({ user_id: 1 });

const Comment = models.Comment || model<IComment>("Comment", CommentSchema);
export default Comment;
