import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error("Vui lòng thêm MONGODB_URI vào file .env.local");
}

// Cache connection để tránh tạo connection mới mỗi lần hot-reload (Next.js dev)
declare global {
  // eslint-disable-next-line no-var
  var _mongooseConn: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

let cached = global._mongooseConn;

if (!cached) {
  cached = global._mongooseConn = { conn: null, promise: null };
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectDB;
