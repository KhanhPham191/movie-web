"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { createClient } from "@/lib/supabase/client";

export default function AccountPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/dang-nhap");
    } else if (user) {
      setName(user.user_metadata?.name || "");
    }
  }, [user, authLoading, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage(null);

    const { error } = await supabase.auth.updateUser({
      data: { name },
    });

    setIsUpdating(false);

    if (error) {
      setMessage({ type: "error", text: error.message || "Có lỗi xảy ra" });
    } else {
      setMessage({ type: "success", text: "Cập nhật hồ sơ thành công!" });
      // Refresh để cập nhật user data
      window.location.reload();
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#05050a]">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] pt-20">
          <div className="text-white">Đang tải...</div>
        </div>
        <Footer />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-[#05050a]">
      <Header />
      <div className="container mx-auto px-4 py-20 max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-8">Quản lý hồ sơ</h1>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Thông tin tài khoản */}
          <Card className="bg-[#0f0f0f]/95 backdrop-blur border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Thông tin tài khoản</CardTitle>
              <CardDescription className="text-gray-400">
                Quản lý thông tin cá nhân của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[linear-gradient(135deg,#fb743E,#ff9d6b)] flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">
                    {user.user_metadata?.name?.charAt(0).toUpperCase() ||
                     user.email?.charAt(0).toUpperCase() ||
                     "U"}
                  </span>
                </div>
                <div>
                  <p className="text-white font-semibold">
                    {user.user_metadata?.name || "Chưa có tên"}
                  </p>
                  <p className="text-gray-400 text-sm">{user.email}</p>
                </div>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-gray-300">
                    Tên hiển thị
                  </label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/5 border-gray-700 text-white"
                    placeholder="Nhập tên của bạn"
                  />
                </div>

                {message && (
                  <div
                    className={`p-3 rounded-md text-sm ${
                      message.type === "success"
                        ? "bg-green-500/10 border border-green-500/20 text-green-400"
                        : "bg-red-500/10 border border-red-500/20 text-red-400"
                    }`}
                  >
                    {message.text}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-[#fb743E] hover:bg-[#fb743E]/90 text-white"
                  disabled={isUpdating}
                >
                  {isUpdating ? "Đang cập nhật..." : "Cập nhật hồ sơ"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Thông tin khác */}
          <Card className="bg-[#0f0f0f]/95 backdrop-blur border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Thông tin khác</CardTitle>
              <CardDescription className="text-gray-400">
                Chi tiết tài khoản của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Email</p>
                  <p className="text-white">{user.email}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">ID người dùng</p>
                  <p className="text-white text-sm font-mono break-all">{user.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Ngày tạo tài khoản</p>
                  <p className="text-white text-sm">
                    {new Date(user.created_at).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Xác thực email</p>
                  <p className={`text-sm ${user.email_confirmed_at ? "text-green-400" : "text-yellow-400"}`}>
                    {user.email_confirmed_at ? "✓ Đã xác thực" : "⚠ Chưa xác thực"}
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700 space-y-2">
                <Link href="/tai-khoan/danh-sach">
                  <Button variant="outline" className="w-full">
                    Danh sách của tôi
                  </Button>
                </Link>
                <Link href="/tai-khoan/cai-dat">
                  <Button variant="outline" className="w-full">
                    Cài đặt tài khoản
                  </Button>
                </Link>
                <Link href="/quen-mat-khau">
                  <Button variant="outline" className="w-full">
                    Đổi mật khẩu
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </main>
  );
}

