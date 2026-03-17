import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import { User } from "@/lib/models";
import { signToken, createAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Vui lòng nhập tên đăng nhập và mật khẩu" },
        { status: 400 }
      );
    }

    await connectDB();

    // Tìm user (bao gồm password_hash để so sánh)
    const user = await User.findOne({ username: username.toLowerCase() }).select(
      "+password_hash"
    );

    if (!user) {
      return NextResponse.json(
        { error: "Tài khoản hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: "Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ." },
        { status: 403 }
      );
    }

    // So sánh password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return NextResponse.json(
        { error: "Tài khoản hoặc mật khẩu không đúng" },
        { status: 401 }
      );
    }

    // Tạo JWT và set cookie
    const token = signToken({
      userId: user._id.toString(),
      username: user.username,
      role: user.role,
    });

    const response = NextResponse.json({
      message: "Đăng nhập thành công",
      user: {
        id: user._id.toString(),
        username: user.username,
        display_name: user.display_name,
        avatar_url: user.avatar_url,
        role: user.role,
      },
    });

    response.headers.set("Set-Cookie", createAuthCookie(token));
    return response;
  } catch (err: any) {
    console.error("[API/auth/login]", err);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
