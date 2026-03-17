import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import { User } from "@/lib/models";
import { getTokenFromCookie } from "@/lib/auth";

// GET /movpey/auth/me — Lấy thông tin user đang đăng nhập
export async function GET() {
  try {
    const payload = await getTokenFromCookie();

    if (!payload) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(payload.userId);

    if (!user || !user.is_active) {
      return NextResponse.json({ error: "Tài khoản không tồn tại" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        role: user.role,
        created_at: user.created_at,
      },
    });
  } catch (err: any) {
    console.error("[API/auth/me]", err);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}

// PATCH /movpey/auth/me — Cập nhật profile hoặc đổi mật khẩu
export async function PATCH(req: NextRequest) {
  try {
    const payload = await getTokenFromCookie();
    if (!payload) {
      return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 });
    }

    const { display_name, avatar_url, password } = await req.json();

    await connectDB();

    const updates: Record<string, any> = {};

    if (display_name !== undefined) {
      if (!display_name.trim()) {
        return NextResponse.json({ error: "Tên hiển thị không được để trống" }, { status: 400 });
      }
      updates.display_name = display_name.trim();
    }

    if (avatar_url !== undefined) {
      updates.avatar_url = avatar_url;
    }

    if (password !== undefined) {
      if (password.length < 6) {
        return NextResponse.json(
          { error: "Mật khẩu mới phải có ít nhất 6 ký tự" },
          { status: 400 }
        );
      }
      updates.password_hash = await bcrypt.hash(password, 12);
    }

    const user = await User.findByIdAndUpdate(
      payload.userId,
      { $set: updates },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: "Tài khoản không tồn tại" }, { status: 404 });
    }

    return NextResponse.json({ message: "Cập nhật thành công" });
  } catch (err: any) {
    console.error("[API/auth/me PATCH]", err);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
