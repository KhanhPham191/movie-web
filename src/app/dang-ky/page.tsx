"use client";

import { useState } from "react";
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
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Footer } from "@/components/footer";

export default function SignUpPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();
  const router = useRouter();

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
      setSuccess(true);
      // Chuyển về trang đăng nhập sau 2 giây
      setTimeout(() => {
        router.push("/dang-nhap");
      }, 2000);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setIsGoogleLoading(true);
    const { error } = await signInWithGoogle();
    setIsGoogleLoading(false);
    
    if (error) {
      setError(error.message || "Đăng nhập với Google thất bại. Vui lòng thử lại.");
    }
  };

  return (
    <main className="min-h-screen bg-[#191b24]">
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] pt-20 pb-16 px-4">
        <Card className="w-full max-w-md bg-[#0f0f0f]/95 backdrop-blur border-gray-800">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center bg-[linear-gradient(135deg,#F6C453,#D3A13A)]">
                <Image
                  src="/logo.ico"
                  alt="MovPey"
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <CardTitle className="text-2xl text-white">Đăng ký</CardTitle>
            <CardDescription className="text-gray-400">
              Tạo tài khoản mới để bắt đầu xem phim
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4 text-center py-4">
                <div className="p-4 rounded-md bg-green-500/10 border border-green-500/20 text-green-400">
                  <p className="font-semibold mb-2">Đăng ký thành công!</p>
                  <p className="text-sm">
                    Tài khoản <strong>{username}</strong> đã được tạo thành công. Bạn có thể đăng nhập ngay.
                  </p>
                </div>
                <p className="text-sm text-gray-400">
                  Đang chuyển đến trang đăng nhập...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium text-gray-300">
                    Tên (tùy chọn)
                  </label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Tên của bạn"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="username" className="text-sm font-medium text-gray-300">
                    Tài khoản <span className="text-red-400">*</span>
                  </label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="Tên đăng nhập (chỉ chữ, số, dấu _)"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
                    disabled={isLoading}
                    required
                    pattern="[a-zA-Z0-9_]+"
                    title="Chỉ được dùng chữ cái, số và dấu gạch dưới"
                  />
                  <p className="text-xs text-gray-500">
                    Chỉ được dùng chữ cái, số và dấu gạch dưới (_). Tối thiểu 3 ký tự.
                  </p>
                </div>
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-300">
                    Mật khẩu <span className="text-red-400">*</span>
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Tối thiểu 6 ký tự"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
                    disabled={isLoading}
                    required
                    minLength={6}
                  />
                  <p className="text-xs text-gray-500">
                    Mật khẩu phải có ít nhất 6 ký tự
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#F6C453] to-[#D3A13A] hover:from-[#F6C453]/90 hover:to-[#D3A13A]/90 text-white"
                  disabled={isLoading || isGoogleLoading}
                >
                  {isLoading ? "Đang đăng ký..." : "Đăng ký"}
                </Button>
                
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-[#0f0f0f] px-2 text-gray-400">Hoặc</span>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  className="w-full bg-white hover:bg-gray-100 text-gray-900 border border-gray-300"
                  disabled={isLoading || isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    "Đang xử lý..."
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
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
                      Đăng nhập với Google
                    </span>
                  )}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <p className="text-sm text-gray-400 text-center">
              Đã có tài khoản?{" "}
              <Link href="/dang-nhap" className="text-[#F6C453] hover:underline">
                Đăng nhập ngay
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
      <Footer />
    </main>
  );
}

