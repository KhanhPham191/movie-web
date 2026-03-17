import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import connectDB from "@/lib/mongodb";
import { User } from "@/lib/models";
import { signToken, createAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { username, password, display_name } = await req.json();

    // Validate input
    if (!username || !password) {
      return NextResponse.json(
        { error: "Vui lòng nhập tên đăng nhập và mật khẩu" },
        { status: 400 }
      );
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return NextResponse.json(
        { error: "Tên đăng nhập chỉ được dùng chữ cái, số và dấu gạch dưới (_)" },
        { status: 400 }
      );
    }

    if (username.length < 3 || username.length > 30) {
      return NextResponse.json(
        { error: "Tên đăng nhập phải từ 3 đến 30 ký tự" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Mật khẩu phải có ít nhất 6 ký tự" },
        { status: 400 }
      );
    }

    await connectDB();

    // Kiểm tra username đã tồn tại chưa
    const existing = await User.findOne({
      username: username.toLowerCase(),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Tên đăng nhập đã được sử dụng. Vui lòng chọn tên khác." },
        { status: 409 }
      );
    }

    // Hash password với bcrypt (salt rounds = 12)
    const password_hash = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      username: username.toLowerCase(),
      email: `${username.toLowerCase()}@movpey.local`,
      password_hash,
      display_name: display_name || username,
      providers: [{ provider: "local", provider_id: username.toLowerCase() }],
    });

    // Tạo JWT và set cookie
    const token = signToken({
      userId: newUser._id.toString(),
      username: newUser.username,
      role: newUser.role,
    });

    const response = NextResponse.json(
      {
        message: "Đăng ký thành công",
        user: {
          id: newUser._id.toString(),
          username: newUser.username,
          display_name: newUser.display_name,
          role: newUser.role,
        },
      },
      { status: 201 }
    );

    response.headers.set("Set-Cookie", createAuthCookie(token));
    return response;
  } catch (err: any) {
    console.error("[API/auth/register]", err);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi. Vui lòng thử lại sau." },
      { status: 500 }
    );
  }
}
