"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function AccountSettingsPage() {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/dang-nhap");
    }
  }, [user, authLoading, router]);

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
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-gray-400 hover:text-white"
          >
            ← Quay lại
          </Button>
        </div>

        <h1 className="text-3xl font-bold text-white mb-8">Cài đặt tài khoản</h1>

        <Card className="bg-[#0f0f0f]/95 backdrop-blur border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Cài đặt</CardTitle>
            <CardDescription className="text-gray-400">
              Quản lý cài đặt tài khoản của bạn
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-white font-semibold mb-2">Thông báo</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Quản lý các thông báo bạn muốn nhận
                </p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-gray-300">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span>Thông báo phim mới</span>
                  </label>
                  <label className="flex items-center gap-2 text-gray-300">
                    <input type="checkbox" defaultChecked className="rounded" />
                    <span>Thông báo cập nhật phim đang theo dõi</span>
                  </label>
                  <label className="flex items-center gap-2 text-gray-300">
                    <input type="checkbox" className="rounded" />
                    <span>Thông báo khuyến mãi</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <h3 className="text-white font-semibold mb-2">Bảo mật</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Quản lý bảo mật tài khoản
                </p>
                <div className="space-y-2">
                  <Link href="/quen-mat-khau">
                    <Button variant="outline" className="w-full justify-start">
                      Đổi mật khẩu
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <h3 className="text-white font-semibold mb-2 text-red-400">Vùng nguy hiểm</h3>
                <p className="text-gray-400 text-sm mb-4">
                  Các hành động không thể hoàn tác
                </p>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    if (confirm("Bạn có chắc chắn muốn xóa tài khoản? Hành động này không thể hoàn tác.")) {
                      alert("Tính năng xóa tài khoản đang được phát triển.");
                    }
                  }}
                >
                  Xóa tài khoản
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </main>
  );
}

