import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { WatchHistory } from "@/lib/models";
import { getTokenFromCookie } from "@/lib/auth";

// POST /movpey/watch-history — Lưu hoặc cập nhật tiến trình xem (upsert)
export async function POST(req: NextRequest) {
  try {
    const payload = await getTokenFromCookie();
    if (!payload) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const body = await req.json();
    const {
      movie_slug,
      movie_name,
      movie_thumb,
      movie_poster,
      movie_year,
      episode_slug,
      episode_name,
      server_name,
      watch_time,
      total_duration,
    } = body;

    if (!movie_slug || !episode_slug || !movie_name) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    await connectDB();

    const completed =
      total_duration > 0 && watch_time / total_duration >= 0.9;

    // Upsert: nếu đã có record thì update, chưa có thì tạo mới
    const record = await WatchHistory.findOneAndUpdate(
      {
        user_id: payload.userId,
        movie_slug,
        episode_slug,
      },
      {
        $set: {
          movie_name,
          movie_thumb,
          movie_poster: movie_poster || null,
          movie_year: movie_year || null,
          episode_name,
          server_name,
          watch_time,
          total_duration,
          completed,
          watched_at: new Date(),
        },
      },
      { upsert: true, returnDocument: "after" }
    );

    return NextResponse.json({ ok: true, id: record._id.toString() });
  } catch (err: any) {
    console.error("[API/watch-history POST]", err);
    return NextResponse.json({ error: "Đã xảy ra lỗi" }, { status: 500 });
  }
}

// GET /movpey/watch-history — Lấy danh sách lịch sử xem gần nhất (chưa hoàn thành)
export async function GET(req: NextRequest) {
  try {
    const payload = await getTokenFromCookie();
    if (!payload) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    const skip = (page - 1) * limit;
    const includeCompleted = searchParams.get("completed") === "true";

    await connectDB();

    const filter: Record<string, any> = { user_id: payload.userId };
    if (!includeCompleted) {
      filter.completed = false;
    }

    const [items, total] = await Promise.all([
      WatchHistory.find(filter)
        .sort({ watched_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      WatchHistory.countDocuments(filter),
    ]);

    return NextResponse.json({
      items: items.map((item: any) => ({
        id: item._id.toString(),
        movie_slug: item.movie_slug,
        movie_name: item.movie_name,
        movie_thumb: item.movie_thumb,
        movie_poster: item.movie_poster,
        movie_year: item.movie_year,
        episode_slug: item.episode_slug,
        episode_name: item.episode_name,
        server_name: item.server_name,
        watch_time: item.watch_time,
        total_duration: item.total_duration,
        completed: item.completed,
        watched_at: item.watched_at,
        updated_at: item.watched_at,
      })),
      total,
      page,
      total_pages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    console.error("[API/watch-history GET]", err);
    return NextResponse.json({ error: "Đã xảy ra lỗi" }, { status: 500 });
  }
}
