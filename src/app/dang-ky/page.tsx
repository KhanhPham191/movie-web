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
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function SignUpPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ thông tin");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      setIsLoading(false);
      return;
    }

    const { error } = await signUp(email, password, name || undefined);
    setIsLoading(false);

    if (error) {
      setError(error.message || "Đăng ký thất bại. Vui lòng thử lại.");
    } else {
      setSuccess(true);
      // Supabase sẽ gửi email xác nhận, chuyển về trang đăng nhập sau 3 giây
      setTimeout(() => {
        router.push("/dang-nhap");
      }, 3000);
    }
  };

  return (
    <main className="min-h-screen bg-[#05050a]">
      <Header />
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] pt-20 pb-16 px-4">
        <Card className="w-full max-w-md bg-[#0f0f0f]/95 backdrop-blur border-gray-800">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center bg-[linear-gradient(135deg,#fb743E,#ff9d6b)]">
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
                    Chúng tôi đã gửi email xác nhận đến <strong>{email}</strong>. Vui lòng kiểm tra hộp thư và xác nhận tài khoản trước khi đăng nhập.
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
                  <label htmlFor="email" className="text-sm font-medium text-gray-300">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
                    disabled={isLoading}
                    required
                  />
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
                  className="w-full bg-[#fb743E] hover:bg-[#fb743E]/90 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Đang đăng ký..." : "Đăng ký"}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <p className="text-sm text-gray-400 text-center">
              Đã có tài khoản?{" "}
              <Link href="/dang-nhap" className="text-[#fb743E] hover:underline">
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

