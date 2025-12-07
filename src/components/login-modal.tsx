"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { signIn, signInWithGoogle, isAuthenticated } = useAuth();
  const router = useRouter();

  // Đóng modal khi đăng nhập thành công
  const handleSuccess = () => {
    onOpenChange(false);
    setUsername("");
    setPassword("");
    setError("");
    router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!username || !password) {
      setError("Vui lòng nhập đầy đủ thông tin");
      setIsLoading(false);
      return;
    }

    const { error } = await signIn(username, password);
    setIsLoading(false);

    if (error) {
      setError(error.message || "Tài khoản hoặc mật khẩu không đúng");
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
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg overflow-hidden flex items-center justify-center bg-[linear-gradient(135deg,#fb743E,#ff9d6b)]">
              <Image
                src="/logo.ico"
                alt="MovPey"
                width={36}
                height={36}
                className="w-full h-full object-contain sm:w-10 sm:h-10"
              />
            </div>
          </div>
          <DialogTitle className="text-base sm:text-lg text-white text-center">Đăng nhập</DialogTitle>
          <DialogDescription className="text-gray-400 text-center text-xs">
            Đăng nhập để tiếp tục xem phim
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="p-2.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
              {error}
            </div>
          )}
          <div className="space-y-1.5">
            <label htmlFor="modal-username" className="text-xs font-medium text-gray-300">
              Tài khoản
            </label>
            <Input
              id="modal-username"
              type="text"
              placeholder="Tên đăng nhập"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500 h-9 text-sm"
              disabled={isLoading || isGoogleLoading}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="modal-password" className="text-xs font-medium text-gray-300">
              Mật khẩu
            </label>
            <Input
              id="modal-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500 h-9 text-sm"
              disabled={isLoading || isGoogleLoading}
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-[#fb743E] hover:bg-[#fb743E]/90 text-white h-9 text-sm"
            disabled={isLoading || isGoogleLoading}
          >
            {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
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
            Chưa có tài khoản?{" "}
            <Link 
              href="/dang-ky" 
              className="text-[#fb743E] hover:underline"
              onClick={() => onOpenChange(false)}
            >
              Đăng ký ngay
            </Link>
          </p>
          <Link
            href="/quen-mat-khau"
            className="text-xs text-gray-400 hover:text-[#fb743E] transition-colors"
            onClick={() => onOpenChange(false)}
          >
            Quên mật khẩu?
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}

