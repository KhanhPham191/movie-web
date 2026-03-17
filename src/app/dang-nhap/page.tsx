"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, AUTH_DISABLED } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Footer } from "@/components/footer";
import { Eye, EyeOff, User, Lock, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (AUTH_DISABLED) {
      router.replace("/");
    }
  }, [router]);

  if (AUTH_DISABLED) return null;

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
      router.push("/");
      router.refresh();
    }
  };

  return (
    <main className="min-h-screen bg-[#0D0D0D] relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#F6C453]/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-80 h-80 bg-[#F6C453]/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute -bottom-20 left-1/3 w-72 h-72 bg-[#D3A13A]/6 rounded-full blur-3xl animate-pulse delay-500" />
        {/* Film strip decorative lines */}
        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_calc(100%/20_-_1px),rgba(246,196,83,0.03)_calc(100%/20))] bg-[size:100%_5%]" />
      </div>

      <div className="relative flex min-h-screen">
        {/* Form panel */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 lg:px-16">
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white mb-1">
                Chào mừng trở lại!
              </h2>
              <p className="text-gray-400 text-sm">
                Đăng nhập vào tài khoản của bạn
              </p>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6 animate-in slide-in-from-top-2 duration-300">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username */}
              <div className="space-y-1.5">
                <label
                  htmlFor="username"
                  className="text-sm font-medium text-gray-300"
                >
                  Tài khoản
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Tên đăng nhập hoặc email"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-[#F6C453]/60 focus:ring-[#F6C453]/20 focus:bg-white/8 transition-colors"
                    disabled={isLoading}
                    autoComplete="username"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-300"
                  >
                    Mật khẩu
                  </label>
                  <Link
                    href="/quen-mat-khau"
                    className="text-xs text-[#F6C453] hover:text-[#F6C453]/80 transition-colors"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-11 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-[#F6C453]/60 focus:ring-[#F6C453]/20 focus:bg-white/8 transition-colors"
                    disabled={isLoading}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                    tabIndex={-1}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Remember me */}
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-4 h-4 rounded border border-white/20 bg-white/5 peer-checked:bg-[#F6C453] peer-checked:border-[#F6C453] transition-all flex items-center justify-center">
                    {rememberMe && (
                      <svg
                        className="w-2.5 h-2.5 text-black"
                        viewBox="0 0 10 8"
                        fill="none"
                      >
                        <path
                          d="M1 4L3.5 6.5L9 1"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors select-none">
                  Ghi nhớ đăng nhập
                </span>
              </label>

              {/* Submit */}
              <Button
                type="submit"
                className="w-full h-11 bg-gradient-to-r from-[#F6C453] to-[#D3A13A] hover:from-[#F6C453]/90 hover:to-[#D3A13A]/90 text-black font-semibold rounded-xl transition-all duration-200 hover:shadow-[0_0_24px_rgba(246,196,83,0.3)] active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Đang đăng nhập...
                  </span>
                ) : (
                  "Đăng nhập"
                )}
              </Button>

            </form>

            {/* Footer link */}
            <p className="mt-8 text-center text-sm text-gray-500">
              Chưa có tài khoản?{" "}
              <Link
                href="/dang-ky"
                className="text-[#F6C453] hover:text-[#F6C453]/80 font-medium transition-colors"
              >
                Đăng ký miễn phí
              </Link>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  );
}
