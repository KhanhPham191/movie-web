"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SignupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSwitchToLogin?: () => void;
}

export function SignupModal({ open, onOpenChange, onSwitchToLogin }: SignupModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const router = useRouter();

  // Đóng modal khi đăng ký thành công
  const handleSuccess = () => {
    setSuccess(true);
    setTimeout(() => {
      onOpenChange(false);
      setUsername("");
      setPassword("");
      setName("");
      setError("");
      setSuccess(false);
      // Refresh trang để cập nhật trạng thái đăng nhập
      router.refresh();
    }, 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    if (!username || !password) {
      setError("Vui lòng nhập đầy đủ thông tin");
      setIsLoading(false);
      return;
    }

    // Validate username format
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      setError("Tên đăng nhập chỉ được dùng chữ cái, số và dấu gạch dưới (_)");
      setIsLoading(false);
      return;
    }

    if (username.trim().length < 3) {
      setError("Tên đăng nhập phải có ít nhất 3 ký tự");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(username, password, name || undefined);
    setIsLoading(false);

    if (error) {
      setError(error.message || "Đăng ký thất bại. Vui lòng thử lại.");
    } else {
      handleSuccess();
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setIsGoogleLoading(false);
    
    if (error) {
      setError(error.message || "Đăng nhập với Google thất bại. Vui lòng thử lại.");
    } else {
      // Google sign in sẽ redirect, không cần handleSuccess
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0f0f0f]/95 backdrop-blur border-gray-800">
        <DialogHeader className="space-y-1.5 sm:space-y-2">
          <div className="flex justify-center">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden flex items-center justify-center bg-[linear-gradient(135deg,#F6C453,#D3A13A)]">
              <Image
                src="/logo.svg"
                alt="MovPey"
                width={36}
                height={36}
                className="w-full h-full object-contain sm:w-10 sm:h-10"
              />
            </div>
          </div>
          <DialogTitle className="text-base sm:text-lg text-white text-center">Đăng ký</DialogTitle>
          <DialogDescription className="text-gray-400 text-center text-xs">
            Tạo tài khoản mới để bắt đầu xem phim
          </DialogDescription>
        </DialogHeader>
        {success ? (
          <div className="space-y-3 text-center py-2">
            <div className="p-2.5 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 text-xs">
              <p className="font-semibold mb-1">Đăng ký thành công!</p>
              <p className="text-[10px]">
                Tài khoản <strong>{username}</strong> đã được tạo thành công. Bạn có thể đăng nhập ngay.
              </p>
            </div>
            <p className="text-xs text-gray-400">
              Đang chuyển đến đăng nhập...
            </p>
          </div>
        ) : (
          <>
            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="p-2.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <label htmlFor="signup-name" className="text-xs font-medium text-gray-300">
                  Tên (tùy chọn)
                </label>
                <Input
                  id="signup-name"
                  type="text"
                  placeholder="Tên của bạn"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500 h-9 text-sm"
                  disabled={isLoading || isGoogleLoading}
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="signup-username" className="text-xs font-medium text-gray-300">
                  Tài khoản <span className="text-red-400">*</span>
                </label>
                <Input
                  id="signup-username"
                  type="text"
                  placeholder="Tên đăng nhập (chỉ chữ, số, dấu _)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500 h-9 text-sm"
                  disabled={isLoading || isGoogleLoading}
                  required
                  pattern="[a-zA-Z0-9_]+"
                  title="Chỉ được dùng chữ cái, số và dấu gạch dưới"
                />
                <p className="text-[10px] text-gray-500">
                  Chỉ được dùng chữ cái, số và dấu gạch dưới (_). Tối thiểu 3 ký tự.
                </p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="signup-password" className="text-xs font-medium text-gray-300">
                  Mật khẩu <span className="text-red-400">*</span>
                </label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Tối thiểu 6 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500 h-9 text-sm"
                  disabled={isLoading || isGoogleLoading}
                  required
                  minLength={6}
                />
                <p className="text-[10px] text-gray-500">
                  Mật khẩu phải có ít nhất 6 ký tự
                </p>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#F6C453] to-[#D3A13A] hover:from-[#F6C453]/90 hover:to-[#D3A13A]/90 text-white h-9 text-sm"
                disabled={isLoading || isGoogleLoading}
              >
                {isLoading ? "Đang đăng ký..." : "Đăng ký"}
              </Button>
              
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-gray-700" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-[#0f0f0f] px-2 text-gray-400">Hoặc</span>
                </div>
              </div>

              <Button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 h-9 text-sm"
                disabled={isLoading || isGoogleLoading}
              >
                {isGoogleLoading ? (
                  "Đang xử lý..."
                ) : (
                  <span className="flex items-center justify-center gap-1.5">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span className="text-xs">Đăng nhập với Google</span>
                  </span>
                )}
              </Button>
            </form>
            <div className="flex flex-col space-y-1.5 text-center pt-1">
              <p className="text-xs text-gray-400">
                Đã có tài khoản?{" "}
                <button
                  type="button"
                  className="text-[#F6C453] hover:underline"
                  onClick={() => {
                    onOpenChange(false);
                    if (onSwitchToLogin) {
                      onSwitchToLogin();
                    }
                  }}
                >
                  Đăng nhập ngay
                </button>
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

