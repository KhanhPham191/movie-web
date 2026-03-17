import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Favorite } from "@/lib/models";
import { getTokenFromCookie } from "@/lib/auth";

// GET /movpey/favorites — Lấy danh sách yêu thích của user (phân trang)
export async function GET(req: NextRequest) {
  try {
    const payload = await getTokenFromCookie();
    if (!payload) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
    const page = Math.max(parseInt(searchParams.get("page") || "1"), 1);
    // mode=slugs chỉ trả về danh sách slug (dùng để init context)
    const mode = searchParams.get("mode");
    const skip = (page - 1) * limit;

    await connectDB();

    if (mode === "slugs") {
      const items = await Favorite.find({ user_id: payload.userId })
        .select("movie_slug")
        .lean();
      return NextResponse.json({ slugs: items.map((i: any) => i.movie_slug) });
    }

    const [items, total] = await Promise.all([
      Favorite.find({ user_id: payload.userId })
        .sort({ added_at: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Favorite.countDocuments({ user_id: payload.userId }),
    ]);

    return NextResponse.json({
      items: items.map((item: any) => ({
        id: item._id.toString(),
        movie_slug: item.movie_slug,
        movie_name: item.movie_name,
        movie_thumb: item.movie_thumb,
        movie_poster: item.movie_poster,
        movie_year: item.movie_year,
        movie_quality: item.movie_quality,
        movie_type: item.movie_type,
        added_at: item.added_at,
      })),
      total,
      page,
      total_pages: Math.ceil(total / limit),
    });
  } catch (err: any) {
    console.error("[API/favorites GET]", err);
    return NextResponse.json({ error: "Đã xảy ra lỗi" }, { status: 500 });
  }
}

// POST /movpey/favorites — Thêm phim vào yêu thích (upsert)
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
      movie_quality,
      movie_type,
    } = body;

    if (!movie_slug || !movie_name || !movie_thumb) {
      return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
    }

    await connectDB();

    await Favorite.findOneAndUpdate(
      { user_id: payload.userId, movie_slug },
      {
        $set: {
          movie_name,
          movie_thumb,
          movie_poster: movie_poster || null,
          movie_year: movie_year || null,
          movie_quality: movie_quality || null,
          movie_type: movie_type || null,
        },
        $setOnInsert: { added_at: new Date() },
      },
      { upsert: true }
    );

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[API/favorites POST]", err);
    return NextResponse.json({ error: "Đã xảy ra lỗi" }, { status: 500 });
  }
}
