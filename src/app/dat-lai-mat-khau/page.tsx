"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
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

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Kiểm tra xem có session hợp lệ từ email reset không
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsValidSession(true);
      } else {
        // Kiểm tra hash từ URL
        const hash = window.location.hash;
        if (hash) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: hash.replace('#', ''),
            type: 'recovery'
          });
          if (data && !error) {
            setIsValidSession(true);
          }
        }
      }
    };
    checkSession();
  }, [supabase.auth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    if (!password || !confirmPassword) {
      setError("Vui lòng nhập đầy đủ thông tin");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    setIsLoading(false);

    if (error) {
      setError(error.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } else {
      setSuccess(true);
      setTimeout(() => {
        router.push("/dang-nhap");
      }, 2000);
    }
  };

  if (!isValidSession) {
    return (
      <main className="min-h-screen bg-[#05050a]">
        <Header />
        <div className="flex items-center justify-center min-h-[calc(100vh-200px)] pt-20 pb-16 px-4">
          <Card className="w-full max-w-md bg-[#0f0f0f]/95 backdrop-blur border-gray-800">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <p className="text-red-400">Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.</p>
                <Link href="/quen-mat-khau">
                  <Button variant="outline" className="w-full">
                    Yêu cầu link mới
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#05050a]">
      <Header />
      <div className="flex items-center justify-center min-h-[calc(100vh-200px)] pt-20 pb-16 px-4">
        <Card className="w-full max-w-md bg-[#0f0f0f]/95 backdrop-blur border-gray-800">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-xl overflow-hidden flex items-center justify-center bg-[linear-gradient(135deg,#F6C453,#D3A13A)]">
                <Image
                  src="/logo.svg"
                  alt="MovPey"
                  width={64}
                  height={64}
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
            <CardTitle className="text-2xl text-white">Đặt lại mật khẩu</CardTitle>
            <CardDescription className="text-gray-400">
              Nhập mật khẩu mới của bạn
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4 text-center py-4">
                <div className="p-4 rounded-md bg-green-500/10 border border-green-500/20 text-green-400">
                  <p className="font-semibold mb-2">Đặt lại mật khẩu thành công!</p>
                  <p className="text-sm">
                    Mật khẩu của bạn đã được cập nhật. Đang chuyển đến trang đăng nhập...
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-gray-300">
                    Mật khẩu mới
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
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-300">
                    Xác nhận mật khẩu
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-white/5 border-gray-700 text-white placeholder:text-gray-500"
                    disabled={isLoading}
                    required
                    minLength={6}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#F6C453] to-[#D3A13A] hover:from-[#F6C453]/90 hover:to-[#D3A13A]/90 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Đang cập nhật..." : "Đặt lại mật khẩu"}
                </Button>
              </form>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Link
              href="/dang-nhap"
              className="text-sm text-gray-400 hover:text-[#F6C453] transition-colors"
            >
              ← Quay lại đăng nhập
            </Link>
          </CardFooter>
        </Card>
      </div>
      <Footer />
    </main>
  );
}

