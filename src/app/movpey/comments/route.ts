import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import connectDB from "@/lib/mongodb";
import { Comment, User } from "@/lib/models";
import { getTokenFromCookie } from "@/lib/auth";

function parseLimit(value: string | null, fallback: number, max: number) {
  const n = parseInt(value || "", 10);
  if (Number.isNaN(n) || n <= 0) return fallback;
  return Math.min(n, max);
}

// GET /movpey/comments?movie_slug=...&parent_id=...&limit=...&before=...
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const movie_slug = (searchParams.get("movie_slug") || "").trim();
    const parent_id_raw = (searchParams.get("parent_id") || "").trim();
    const before_raw = (searchParams.get("before") || "").trim();
    const limit = parseLimit(searchParams.get("limit"), 20, 50);

    if (!movie_slug) {
      return NextResponse.json({ error: "Thiếu movie_slug" }, { status: 400 });
    }

    const filter: Record<string, any> = { movie_slug, is_hidden: false };

    if (parent_id_raw) {
      if (!Types.ObjectId.isValid(parent_id_raw)) {
        return NextResponse.json({ error: "parent_id không hợp lệ" }, { status: 400 });
      }
      filter.parent_id = new Types.ObjectId(parent_id_raw);
    } else {
      filter.parent_id = null;
    }

    if (before_raw) {
      const before = new Date(before_raw);
      if (Number.isNaN(before.getTime())) {
        return NextResponse.json({ error: "before không hợp lệ (ISO date)" }, { status: 400 });
      }
      filter.created_at = { $lt: before };
    }

    await connectDB();

    const items = await Comment.find(filter)
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({
      items: items.map((c: any) => ({
        id: c._id.toString(),
        movie_slug: c.movie_slug,
        user_id: c.user_id ? c.user_id.toString() : null,
        author_name: c.author_name,
        author_avatar: c.author_avatar,
        content: c.content,
        parent_id: c.parent_id ? c.parent_id.toString() : null,
        reply_count: c.reply_count || 0,
        likes: c.likes || 0,
        created_at: c.created_at,
        updated_at: c.updated_at,
      })),
      next_before: items.length > 0 ? items[items.length - 1].created_at : null,
    });
  } catch (err: any) {
    console.error("[API/comments GET]", err);
    return NextResponse.json({ error: "Đã xảy ra lỗi" }, { status: 500 });
  }
}

// POST /movpey/comments
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const movie_slug = String(body?.movie_slug || "").trim();
    const content = String(body?.content || "").trim();
    const parent_id_raw = String(body?.parent_id || "").trim();
    const anonymous_name = String(body?.anonymous_name || "").trim();

    if (!movie_slug) {
      return NextResponse.json({ error: "Thiếu movie_slug" }, { status: 400 });
    }
    if (!content) {
      return NextResponse.json({ error: "Nội dung không được để trống" }, { status: 400 });
    }
    if (content.length > 2000) {
      return NextResponse.json({ error: "Nội dung tối đa 2000 ký tự" }, { status: 400 });
    }

    let parent_id: Types.ObjectId | null = null;
    if (parent_id_raw) {
      if (!Types.ObjectId.isValid(parent_id_raw)) {
        return NextResponse.json({ error: "parent_id không hợp lệ" }, { status: 400 });
      }
      parent_id = new Types.ObjectId(parent_id_raw);
    }

    const payload = await getTokenFromCookie();

    await connectDB();

    let userId: Types.ObjectId | null = null;
    let author_name = "";
    let author_avatar: string | null = null;

    if (payload?.userId && Types.ObjectId.isValid(payload.userId)) {
      userId = new Types.ObjectId(payload.userId);
      const user = await User.findById(userId).select("display_name avatar_url is_active").lean();
      if (!user || user.is_active === false) {
        return NextResponse.json({ error: "Tài khoản không tồn tại" }, { status: 404 });
      }
      author_name = String((user as any).display_name || "").trim() || "Người dùng";
      author_avatar = (user as any).avatar_url || null;
    } else {
      author_name = anonymous_name || "Ẩn danh";
    }

    if (!author_name) author_name = "Ẩn danh";
    if (author_name.length > 50) author_name = author_name.slice(0, 50);

    if (parent_id) {
      const parent = await Comment.findOne({
        _id: parent_id,
        movie_slug,
        is_hidden: false,
      })
        .select("_id")
        .lean();
      if (!parent) {
        return NextResponse.json({ error: "Không tìm thấy bình luận gốc" }, { status: 404 });
      }
    }

    const created = await Comment.create({
      movie_slug,
      user_id: userId,
      author_name,
      author_avatar,
      content,
      parent_id,
    });

    if (parent_id) {
      await Comment.updateOne({ _id: parent_id }, { $inc: { reply_count: 1 } });
    }

    return NextResponse.json(
      {
        item: {
          id: created._id.toString(),
          movie_slug: created.movie_slug,
          user_id: created.user_id ? created.user_id.toString() : null,
          author_name: created.author_name,
          author_avatar: created.author_avatar,
          content: created.content,
          parent_id: created.parent_id ? created.parent_id.toString() : null,
          reply_count: created.reply_count || 0,
          likes: created.likes || 0,
          created_at: created.created_at,
          updated_at: created.updated_at,
        },
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[API/comments POST]", err);
    return NextResponse.json({ error: "Đã xảy ra lỗi" }, { status: 500 });
  }
}

