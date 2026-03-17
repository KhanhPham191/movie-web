import { Schema, model, models, Document } from "mongoose";

export interface IUser extends Document {
  username: string;
  email: string;
  password_hash: string;
  display_name: string;
  avatar_url?: string;
  role: "user" | "admin";
  is_active: boolean;
  providers: Array<{
    provider: "local" | "google";
    provider_id: string;
  }>;
  reset_token?: string;
  reset_token_expires?: Date;
  created_at: Date;
  updated_at: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password_hash: {
      type: String,
      required: true,
    },
    display_name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    avatar_url: {
      type: String,
      default: null,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    is_active: {
      type: Boolean,
      default: true,
    },
    providers: [
      {
        provider: {
          type: String,
          enum: ["local", "google"],
          required: true,
        },
        provider_id: {
          type: String,
          required: true,
        },
      },
    ],
    reset_token: { type: String, default: null },
    reset_token_expires: { type: Date, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

// username và email đã có unique: true trong field definition, chỉ cần index thêm reset_token
UserSchema.index({ reset_token: 1 });

// Không trả về password_hash khi convert sang JSON
UserSchema.set("toJSON", {
  transform: (_doc, ret) => {
    const {
      password_hash: _password_hash,
      reset_token: _reset_token,
      reset_token_expires: _reset_token_expires,
      ...safe
    } = ret;
    return safe;
  },
});

const User = models.User || model<IUser>("User", UserSchema);
export default User;
