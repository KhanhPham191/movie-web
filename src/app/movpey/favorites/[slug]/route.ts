import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { Favorite } from "@/lib/models";
import { getTokenFromCookie } from "@/lib/auth";

// GET /movpey/favorites/[slug] — Kiểm tra phim có trong danh sách yêu thích không
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const payload = await getTokenFromCookie();
    if (!payload) {
      return NextResponse.json({ favorited: false });
    }

    const { slug } = await params;
    await connectDB();

    const exists = await Favorite.exists({
      user_id: payload.userId,
      movie_slug: slug,
    });

    return NextResponse.json({ favorited: !!exists });
  } catch (err: any) {
    console.error("[API/favorites/[slug] GET]", err);
    return NextResponse.json({ favorited: false });
  }
}

// DELETE /movpey/favorites/[slug] — Xóa phim khỏi danh sách yêu thích
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const payload = await getTokenFromCookie();
    if (!payload) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { slug } = await params;
    await connectDB();

    await Favorite.deleteOne({ user_id: payload.userId, movie_slug: slug });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[API/favorites/[slug] DELETE]", err);
    return NextResponse.json({ error: "Đã xảy ra lỗi" }, { status: 500 });
  }
}
