import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { WatchHistory } from "@/lib/models";
import { getTokenFromCookie } from "@/lib/auth";

// GET /movpey/watch-history/progress?movie_slug=...&episode_slug=...
// Lấy tiến trình xem của 1 tập cụ thể (để resume khi quay lại)
export async function GET(req: NextRequest) {
  try {
    const payload = await getTokenFromCookie();
    if (!payload) {
      return NextResponse.json({ watch_time: 0, total_duration: 0 });
    }

    const { searchParams } = new URL(req.url);
    const movie_slug = searchParams.get("movie_slug");
    const episode_slug = searchParams.get("episode_slug");

    if (!movie_slug || !episode_slug) {
      return NextResponse.json({ error: "Thiếu movie_slug hoặc episode_slug" }, { status: 400 });
    }

    await connectDB();

    const record = await WatchHistory.findOne({
      user_id: payload.userId,
      movie_slug,
      episode_slug,
    }).lean() as any;

    if (!record) {
      return NextResponse.json({ watch_time: 0, total_duration: 0 });
    }

    return NextResponse.json({
      id: record._id.toString(),
      watch_time: record.watch_time,
      total_duration: record.total_duration,
      completed: record.completed,
    });
  } catch (err: any) {
    console.error("[API/watch-history/progress GET]", err);
    return NextResponse.json({ watch_time: 0, total_duration: 0 });
  }
}
