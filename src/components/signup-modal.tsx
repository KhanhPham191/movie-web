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
  const { signUp } = useAuth();
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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                  disabled={isLoading}
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
                disabled={isLoading}
              >
                {isLoading ? "Đang đăng ký..." : "Đăng ký"}
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

