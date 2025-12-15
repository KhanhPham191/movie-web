"use client";

import { useState } from "react";
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    if (!email) {
      setError("Vui lòng nhập email");
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/dat-lai-mat-khau`,
    });

    setIsLoading(false);

    if (error) {
      setError(error.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } else {
      setSuccess(true);
    }
  };

  return (
    <main className="min-h-screen bg-[#191b24]">
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
            <CardTitle className="text-2xl text-white">Quên mật khẩu</CardTitle>
            <CardDescription className="text-gray-400">
              Nhập email để nhận link đặt lại mật khẩu
            </CardDescription>
          </CardHeader>
          <CardContent>
            {success ? (
              <div className="space-y-4 text-center py-4">
                <div className="p-4 rounded-md bg-green-500/10 border border-green-500/20 text-green-400">
                  <p className="font-semibold mb-2">Email đã được gửi!</p>
                  <p className="text-sm">
                    Chúng tôi đã gửi link đặt lại mật khẩu đến <strong>{email}</strong>. Vui lòng kiểm tra hộp thư và làm theo hướng dẫn.
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
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-[#F6C453] to-[#D3A13A] hover:from-[#F6C453]/90 hover:to-[#D3A13A]/90 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
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

