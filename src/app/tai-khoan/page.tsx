"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth, AUTH_DISABLED } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Footer } from "@/components/footer";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ImageIcon,
  ShieldCheck,
} from "lucide-react";

export default function AccountPage() {
  const { user, isLoading: authLoading, updateProfile, updatePassword } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (AUTH_DISABLED) router.replace("/");
  }, [router]);

  useEffect(() => {
    if (AUTH_DISABLED) return;
    if (!authLoading && !user) {
      router.replace("/");
    } else if (user) {
      setName(user.user_metadata?.name || user.user_metadata?.username || "");
      setAvatar(user.user_metadata?.avatar_url || "");
    }
  }, [user, authLoading, router]);

  if (AUTH_DISABLED) return null;

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setProfileMsg(null);
    try {
      const { error } = await updateProfile({
        name: name.trim() || user?.user_metadata?.username,
        avatar_url: avatar.trim() || undefined,
      });
      setProfileMsg(
        error
          ? { type: "error", text: error.message || "Có lỗi xảy ra" }
          : { type: "success", text: "Cập nhật hồ sơ thành công!" }
      );
    } catch (err: any) {
      setProfileMsg({ type: "error", text: err.message || "Có lỗi xảy ra" });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: "error", text: "Mật khẩu mới và xác nhận không khớp" });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: "error", text: "Mật khẩu mới phải có ít nhất 6 ký tự" });
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await updatePassword(newPassword);
      if (error) {
        setPasswordMsg({ type: "error", text: error.message || "Có lỗi xảy ra khi đổi mật khẩu" });
      } else {
        setPasswordMsg({ type: "success", text: "Đổi mật khẩu thành công!" });
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch (err: any) {
      setPasswordMsg({ type: "error", text: err.message || "Có lỗi xảy ra" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#0D0D0D] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-8 h-8 animate-spin text-[#F6C453]" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-gray-400 text-sm">Đang tải...</span>
        </div>
      </main>
    );
  }

  if (!user) return null;

  const displayName =
    user.user_metadata?.username ||
    user.email?.replace("@movpey.local", "") ||
    user.user_metadata?.name ||
    user.email ||
    "User";

  const avatarInitial = displayName.charAt(0).toUpperCase();

  return (
    <main className="min-h-screen bg-[#0D0D0D] relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#F6C453]/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 bg-[#F6C453]/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-[#D3A13A]/6 rounded-full blur-3xl animate-pulse delay-500" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_calc(100%/20_-_1px),rgba(246,196,83,0.03)_calc(100%/20))] bg-[size:100%_5%]" />
      </div>

      <div className="relative container mx-auto px-4 py-24 max-w-2xl">
        {/* User hero */}
        <div className="flex items-center gap-5 mb-10">
          <div className="relative shrink-0">
            {avatar ? (
              <div className="w-16 h-16 rounded-2xl overflow-hidden ring-2 ring-[#F6C453]/30">
                <Image
                  src={avatar}
                  alt={displayName}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                  onError={() => setAvatar("")}
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F6C453] to-[#D3A13A] flex items-center justify-center ring-2 ring-[#F6C453]/30">
                <span className="text-2xl font-bold text-black">{avatarInitial}</span>
              </div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{name || displayName}</h1>
            <p className="text-gray-400 text-sm mt-0.5">@{displayName}</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* ── Profile section ── */}
          <section className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 backdrop-blur">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#F6C453]/10 flex items-center justify-center">
                <User className="w-4 h-4 text-[#F6C453]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Thông tin cá nhân</h2>
                <p className="text-xs text-gray-500">Cập nhật tên và ảnh đại diện</p>
              </div>
            </div>

            {profileMsg && (
              <div className={`flex items-start gap-2.5 p-3.5 rounded-xl text-sm mb-5 animate-in slide-in-from-top-2 duration-300 ${
                profileMsg.type === "success"
                  ? "bg-green-500/10 border border-green-500/20 text-green-400"
                  : "bg-red-500/10 border border-red-500/20 text-red-400"
              }`}>
                {profileMsg.type === "success"
                  ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {/* Display name */}
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-sm font-medium text-gray-300">
                  Tên hiển thị
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Tên của bạn"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-[#F6C453]/60 transition-colors"
                    disabled={isUpdating}
                  />
                </div>
              </div>

              {/* Avatar URL */}
              <div className="space-y-1.5">
                <label htmlFor="avatar" className="text-sm font-medium text-gray-300">
                  URL ảnh đại diện
                </label>
                <div className="relative">
                  <ImageIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <Input
                    id="avatar"
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={avatar}
                    onChange={(e) => setAvatar(e.target.value)}
                    className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-[#F6C453]/60 transition-colors"
                    disabled={isUpdating}
                  />
                </div>
                <p className="text-xs text-gray-600">Nhập link URL ảnh đại diện của bạn</p>
              </div>

              {/* Username readonly */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300">Tên đăng nhập</label>
                <Input
                  type="text"
                  value={displayName}
                  className="h-11 bg-white/[0.02] border-white/5 text-gray-500 cursor-not-allowed"
                  disabled
                />
                <p className="text-xs text-gray-600">Tên đăng nhập không thể thay đổi</p>
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-[#F6C453] to-[#D3A13A] hover:from-[#F6C453]/90 hover:to-[#D3A13A]/90 text-black font-semibold rounded-xl transition-all hover:shadow-[0_0_24px_rgba(246,196,83,0.25)] active:scale-[0.98]"
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang lưu...
                  </span>
                ) : (
                  "Lưu thay đổi"
                )}
              </Button>
            </form>
          </section>

          {/* ── Password section ── */}
          <section className="bg-white/[0.03] border border-white/8 rounded-2xl p-6 backdrop-blur">
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-[#F6C453]/10 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-[#F6C453]" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Đổi mật khẩu</h2>
                <p className="text-xs text-gray-500">Bảo vệ tài khoản của bạn</p>
              </div>
            </div>

            {passwordMsg && (
              <div className={`flex items-start gap-2.5 p-3.5 rounded-xl text-sm mb-5 animate-in slide-in-from-top-2 duration-300 ${
                passwordMsg.type === "success"
                  ? "bg-green-500/10 border border-green-500/20 text-green-400"
                  : "bg-red-500/10 border border-red-500/20 text-red-400"
              }`}>
                {passwordMsg.type === "success"
                  ? <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  : <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />}
                {passwordMsg.text}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              {/* New password */}
              <div className="space-y-1.5">
                <label htmlFor="newPassword" className="text-sm font-medium text-gray-300">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Tối thiểu 6 ký tự"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-10 pr-11 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-[#F6C453]/60 transition-colors"
                    disabled={isChangingPassword}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                  Xác nhận mật khẩu mới
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`pl-10 pr-11 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-[#F6C453]/60 transition-colors ${
                      confirmPassword && confirmPassword !== newPassword
                        ? "border-red-500/40"
                        : confirmPassword && confirmPassword === newPassword
                        ? "border-green-500/40"
                        : ""
                    }`}
                    disabled={isChangingPassword}
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && confirmPassword !== newPassword && (
                  <p className="text-xs text-red-400 animate-in fade-in duration-200">
                    Mật khẩu không khớp
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-[#F6C453] to-[#D3A13A] hover:from-[#F6C453]/90 hover:to-[#D3A13A]/90 text-black font-semibold rounded-xl transition-all hover:shadow-[0_0_24px_rgba(246,196,83,0.25)] active:scale-[0.98]"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Đang đổi...
                  </span>
                ) : (
                  "Đổi mật khẩu"
                )}
              </Button>
            </form>
          </section>
        </div>
      </div>

      <Footer />
    </main>
  );
}
