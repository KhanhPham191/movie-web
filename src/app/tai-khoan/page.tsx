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
  const [avatar, setAvatar] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/dang-nhap");
    } else if (user) {
      setName(user.user_metadata?.name || user.user_metadata?.username || "");
      setAvatar(user.user_metadata?.avatar_url || "");
    }
  }, [user, authLoading, router]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          name: name.trim() || user?.user_metadata?.username,
          avatar_url: avatar.trim() || undefined,
        },
      });

      if (error) {
        setMessage({ type: "error", text: error.message || "Có lỗi xảy ra" });
      } else {
        setMessage({ type: "success", text: "Cập nhật hồ sơ thành công!" });
        // Refresh để cập nhật user data
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Có lỗi xảy ra" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsChangingPassword(true);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Mật khẩu mới và xác nhận không khớp" });
      setIsChangingPassword(false);
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: "error", text: "Mật khẩu mới phải có ít nhất 6 ký tự" });
      setIsChangingPassword(false);
      return;
    }

    try {
      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setMessage({ type: "error", text: error.message || "Có lỗi xảy ra khi đổi mật khẩu" });
      } else {
        setMessage({ type: "success", text: "Đổi mật khẩu thành công!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (error: any) {
      setMessage({ type: "error", text: error.message || "Có lỗi xảy ra" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#191b24]">
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

  const displayName = user.user_metadata?.username || 
                      user.email?.replace('@movpey.local', '') || 
                      user.user_metadata?.name || 
                      user.email || 
                      'User';
  const avatarUrl = user.user_metadata?.avatar_url || avatar;

  return (
    <main className="min-h-screen bg-[#191b24]">
      <Header />
      <div className="container mx-auto px-4 py-20 max-w-4xl">
        <h1 className="text-3xl font-bold text-white mb-8">Tài khoản</h1>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Thông tin tài khoản */}
          <Card className="bg-[#0f0f0f]/95 backdrop-blur border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Thông tin tài khoản</CardTitle>
              <CardDescription className="text-gray-400">
                Cập nhật thông tin cá nhân của bạn
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {message && (
                <div className={`p-3 rounded-md text-sm ${
                  message.type === "success" 
                    ? "bg-green-500/10 border border-green-500/20 text-green-400"
                    : "bg-red-500/10 border border-red-500/20 text-red-400"
                }`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                {/* Avatar */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Avatar URL
                  </label>
                  <div className="flex items-center gap-4">
                    {avatarUrl && (
                      <div className="w-16 h-16 rounded-full overflow-hidden bg-white/5 shrink-0">
                        <Image
                          src={avatarUrl}
                          alt="Avatar"
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                          onError={() => setAvatar("")}
                        />
                      </div>
                    )}
                    <Input
                      type="url"
                      placeholder="https://example.com/avatar.jpg"
                      value={avatar}
                      onChange={(e) => setAvatar(e.target.value)}
                      className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
                      disabled={isUpdating}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Nhập URL ảnh đại diện của bạn
                  </p>
                </div>

                {/* Tên */}
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-gray-300">
                    Tên hiển thị
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Tên của bạn"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
                    disabled={isUpdating}
                  />
                </div>

                {/* Tài khoản (readonly) */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Tài khoản
                  </label>
                  <Input
                    type="text"
                    value={displayName}
                    className="bg-white/5 border-gray-700 text-white opacity-60"
                    disabled
                  />
                  <p className="text-xs text-gray-500">
                    Tài khoản không thể thay đổi
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#F6C453] to-[#D3A13A] hover:from-[#F6C453]/90 hover:to-[#D3A13A]/90 text-white"
                  disabled={isUpdating}
                >
                  {isUpdating ? "Đang cập nhật..." : "Cập nhật hồ sơ"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Đổi mật khẩu */}
          <Card className="bg-[#0f0f0f]/95 backdrop-blur border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Đổi mật khẩu</CardTitle>
              <CardDescription className="text-gray-400">
                Thay đổi mật khẩu của bạn
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="newPassword" className="text-sm font-medium text-gray-300">
                    Mật khẩu mới
                  </label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
                    disabled={isChangingPassword}
                    required
                    minLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                    Xác nhận mật khẩu mới
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
                    disabled={isChangingPassword}
                    required
                    minLength={6}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#F6C453] to-[#D3A13A] hover:from-[#F6C453]/90 hover:to-[#D3A13A]/90 text-white"
                  disabled={isChangingPassword}
                >
                  {isChangingPassword ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </main>
  );
}

