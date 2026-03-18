import mongoose from "mongoose";

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
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    throw new Error("Vui lòng thêm MONGODB_URI vào biến môi trường (Render) hoặc file .env.local");
  }

  if (cached.conn) {
    console.log("[MongoDB] Using cached connection");
    return cached.conn;
  }

  if (!cached.promise) {
    console.log("[MongoDB] Creating new connection...");
    cached.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    
    cached.promise.catch((err) => {
      console.error("[MongoDB] Connection error:", err.message);
      cached.promise = null;
      throw err;
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log("[MongoDB] Connected successfully!");
    return cached.conn;
  } catch (error: any) {
    console.error("[MongoDB] Failed to connect:", error.message);
    cached.promise = null;
    throw error;
  }
}

export default connectDB;
