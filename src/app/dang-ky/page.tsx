"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, AUTH_DISABLED } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Footer } from "@/components/footer";
import {
  Eye,
  EyeOff,
  User,
  Lock,
  UserCircle,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function SignUpPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
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
    setSuccess(false);
    setIsLoading(true);

    if (!username || !password) {
      setError("Vui lòng nhập đầy đủ thông tin");
      setIsLoading(false);
      return;
    }

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

    const result = await signUp(username, password, name || undefined);
    setIsLoading(false);

    if (result.error) {
      setError(result.error.message || "Đăng ký thất bại. Vui lòng thử lại.");
    } else {
      setSuccess(true);
      if (result.requiresVerification) {
        setRequiresVerification(true);
        setTimeout(() => router.push("/xac-minh"), 3000);
      } else {
        // User đã được tự đăng nhập sau khi đăng ký thành công
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 1500);
      }
    }
  };

  /* ── Password strength ── */
  const strengthChecks = [
    { label: "Ít nhất 6 ký tự", ok: password.length >= 6 },
    { label: "Có chữ hoa", ok: /[A-Z]/.test(password) },
    { label: "Có số", ok: /[0-9]/.test(password) },
  ];
  const strengthScore = strengthChecks.filter((c) => c.ok).length;
  const strengthColor =
    strengthScore === 0
      ? "bg-white/10"
      : strengthScore === 1
      ? "bg-red-500"
      : strengthScore === 2
      ? "bg-yellow-500"
      : "bg-green-500";

  return (
    <main className="min-h-screen bg-[#0D0D0D] relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#F6C453]/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-[#F6C453]/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute -bottom-20 right-1/3 w-72 h-72 bg-[#D3A13A]/6 rounded-full blur-3xl animate-pulse delay-500" />
        <div className="absolute inset-0 bg-[linear-gradient(0deg,transparent_calc(100%/20_-_1px),rgba(246,196,83,0.03)_calc(100%/20))] bg-[size:100%_5%]" />
      </div>

      <div className="relative flex items-center justify-center min-h-screen px-6 py-16">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">
              Tạo tài khoản
            </h2>
            <p className="text-gray-400 text-sm">
              Đăng ký miễn phí để bắt đầu xem phim
            </p>
          </div>

          {success ? (
            /* ── Success state ── */
            <div
              className={`flex flex-col items-center gap-4 p-6 rounded-2xl border text-center animate-in fade-in duration-500 ${
                requiresVerification
                  ? "bg-blue-500/10 border-blue-500/20"
                  : "bg-green-500/10 border-green-500/20"
              }`}
            >
              <CheckCircle2
                className={`w-12 h-12 ${
                  requiresVerification ? "text-blue-400" : "text-green-400"
                }`}
              />
              <div>
                <p
                  className={`font-semibold text-lg mb-1 ${
                    requiresVerification ? "text-blue-300" : "text-green-300"
                  }`}
                >
                  Đăng ký thành công!
                </p>
                {requiresVerification ? (
                  <p className="text-sm text-gray-400">
                    Tài khoản <span className="text-white font-medium">{username}</span> đã được tạo.
                    Vui lòng kiểm tra email để xác minh tài khoản.
                  </p>
                ) : (
                  <p className="text-sm text-gray-400">
                    Tài khoản <span className="text-white font-medium">{username}</span> đã sẵn sàng.
                    Đang chuyển về trang chủ...
                  </p>
                )}
              </div>
            </div>
          ) : (
            /* ── Form ── */
            <>
              {error && (
                <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6 animate-in slide-in-from-top-2 duration-300">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Display name */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="name"
                    className="text-sm font-medium text-gray-300"
                  >
                    Tên hiển thị{" "}
                    <span className="text-gray-600 font-normal">(tùy chọn)</span>
                  </label>
                  <div className="relative">
                    <UserCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Tên của bạn"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-[#F6C453]/60 focus:ring-[#F6C453]/20 transition-colors"
                      disabled={isLoading}
                      autoComplete="name"
                    />
                  </div>
                </div>

                {/* Username */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="username"
                    className="text-sm font-medium text-gray-300"
                  >
                    Tên đăng nhập <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    <Input
                      id="username"
                      type="text"
                      placeholder="Chỉ chữ, số và dấu _"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="pl-10 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-[#F6C453]/60 focus:ring-[#F6C453]/20 transition-colors"
                      disabled={isLoading}
                      autoComplete="username"
                      required
                      pattern="[a-zA-Z0-9_]+"
                    />
                  </div>
                  <p className="text-xs text-gray-600">
                    Chữ cái, số và dấu _ • Tối thiểu 3 ký tự
                  </p>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label
                    htmlFor="password"
                    className="text-sm font-medium text-gray-300"
                  >
                    Mật khẩu <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Tối thiểu 6 ký tự"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-11 h-11 bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus:border-[#F6C453]/60 focus:ring-[#F6C453]/20 transition-colors"
                      disabled={isLoading}
                      autoComplete="new-password"
                      required
                      minLength={6}
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

                  {/* Strength bar */}
                  {password.length > 0 && (
                    <div className="space-y-1.5 animate-in fade-in duration-200">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                              i < strengthScore ? strengthColor : "bg-white/10"
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        {strengthChecks.map((c) => (
                          <span
                            key={c.label}
                            className={`text-xs flex items-center gap-1 transition-colors ${
                              c.ok ? "text-green-400" : "text-gray-600"
                            }`}
                          >
                            <span>{c.ok ? "✓" : "·"}</span>
                            {c.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit */}
                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-[#F6C453] to-[#D3A13A] hover:from-[#F6C453]/90 hover:to-[#D3A13A]/90 text-black font-semibold rounded-xl transition-all duration-200 hover:shadow-[0_0_24px_rgba(246,196,83,0.3)] active:scale-[0.98] mt-2"
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
                      Đang tạo tài khoản...
                    </span>
                  ) : (
                    "Tạo tài khoản"
                  )}
                </Button>
              </form>
            </>
          )}

          {/* Footer link */}
          <p className="mt-8 text-center text-sm text-gray-500">
            Đã có tài khoản?{" "}
            <Link
              href="/dang-nhap"
              className="text-[#F6C453] hover:text-[#F6C453]/80 font-medium transition-colors"
            >
              Đăng nhập ngay
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </main>
  );
}
