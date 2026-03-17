import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { WatchHistory } from "@/lib/models";
import { getTokenFromCookie } from "@/lib/auth";

// DELETE /movpey/watch-history/[id] — Xóa 1 record khỏi lịch sử
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const payload = await getTokenFromCookie();
    if (!payload) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const deleted = await WatchHistory.findOneAndDelete({
      _id: id,
      user_id: payload.userId, // chỉ xóa record của chính mình
    });

    if (!deleted) {
      return NextResponse.json({ error: "Không tìm thấy" }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("[API/watch-history DELETE]", err);
    return NextResponse.json({ error: "Đã xảy ra lỗi" }, { status: 500 });
  }
}
