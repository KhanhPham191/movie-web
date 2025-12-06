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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!email || !password) {
      setError("Vui lòng nhập đầy đủ thông tin");
      setIsLoading(false);
      return;
    }

    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      setError(error.message || "Email hoặc mật khẩu không đúng");
    } else {
      router.push("/");
      router.refresh();
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
            <CardTitle className="text-2xl text-white">Đăng nhập</CardTitle>
            <CardDescription className="text-gray-400">
              Đăng nhập để tiếp tục xem phim
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium text-gray-300">
                  Email
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
                  Mật khẩu
                </label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
                  disabled={isLoading}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#fb743E] hover:bg-[#fb743E]/90 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <p className="text-sm text-gray-400 text-center">
              Chưa có tài khoản?{" "}
              <Link href="/dang-ky" className="text-[#fb743E] hover:underline">
                Đăng ký ngay
              </Link>
            </p>
            <Link
              href="/quen-mat-khau"
              className="text-sm text-gray-400 hover:text-[#fb743E] transition-colors"
            >
              Quên mật khẩu?
            </Link>
          </CardFooter>
        </Card>
      </div>
      <Footer />
    </main>
  );
}

