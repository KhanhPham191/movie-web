"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

export const AUTH_DISABLED = false;

interface AuthUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string;
  role: "user" | "admin";
  // Giữ lại cấu trúc cũ để tương thích với các component đang dùng
  email: string;
  user_metadata: {
    username: string;
    name: string;
    avatar_url?: string;
  };
  created_at?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: any | null }>;
  signUp: (username: string, password: string, name?: string) => Promise<{ error: any | null }>;
  signInWithGoogle: () => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: { name?: string; avatar_url?: string }) => Promise<{ error: any | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: any | null }>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper: convert API response thành AuthUser
function toAuthUser(data: any): AuthUser {
  return {
    id: data.id,
    username: data.username,
    display_name: data.display_name,
    avatar_url: data.avatar_url,
    role: data.role,
    email: `${data.username}@movpey.local`,
    user_metadata: {
      username: data.username,
      name: data.display_name,
      avatar_url: data.avatar_url,
    },
    created_at: data.created_at,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khôi phục session từ cookie khi app load
  useEffect(() => {
    if (AUTH_DISABLED) {
      setIsLoading(false);
      return;
    }

    fetch("/movpey/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.user) setUser(toAuthUser(data.user));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const signIn = useCallback(async (username: string, password: string) => {
    if (AUTH_DISABLED) {
      return { error: { message: "Tính năng đăng nhập tạm thời bị đóng." } };
    }
    try {
      const res = await fetch("/movpey/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { error: { message: data.error || "Đăng nhập thất bại" } };
      }

      setUser(toAuthUser(data.user));
      return { error: null };
    } catch {
      return { error: { message: "Lỗi kết nối. Vui lòng thử lại." } };
    }
  }, []);

  const signUp = useCallback(async (username: string, password: string, name?: string) => {
    if (AUTH_DISABLED) {
      return { error: { message: "Tính năng đăng ký tạm thời bị đóng." } };
    }
    try {
      const res = await fetch("/movpey/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, display_name: name }),
      });

      const data = await res.json();

      if (!res.ok) {
        return { error: { message: data.error || "Đăng ký thất bại" } };
      }

      setUser(toAuthUser(data.user));
      return { error: null };
    } catch {
      return { error: { message: "Lỗi kết nối. Vui lòng thử lại." } };
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    return {
      error: { message: "Đăng nhập với Google chưa được hỗ trợ. Vui lòng dùng tài khoản và mật khẩu." },
    };
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/movpey/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  const updateProfile = useCallback(
    async (data: { name?: string; avatar_url?: string }) => {
      try {
        const res = await fetch("/movpey/auth/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ display_name: data.name, avatar_url: data.avatar_url }),
        });

        const result = await res.json();

        if (!res.ok) {
          return { error: { message: result.error || "Cập nhật thất bại" } };
        }

        setUser((prev) =>
          prev
            ? {
                ...prev,
                display_name: data.name ?? prev.display_name,
                avatar_url: data.avatar_url ?? prev.avatar_url,
                user_metadata: {
                  ...prev.user_metadata,
                  name: data.name ?? prev.user_metadata.name,
                  avatar_url: data.avatar_url ?? prev.user_metadata.avatar_url,
                },
              }
            : null
        );

        return { error: null };
      } catch {
        return { error: { message: "Lỗi kết nối. Vui lòng thử lại." } };
      }
    },
    []
  );

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      const res = await fetch("/movpey/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });

      const result = await res.json();

      if (!res.ok) {
        return { error: { message: result.error || "Đổi mật khẩu thất bại" } };
      }

      return { error: null };
    } catch {
      return { error: { message: "Lỗi kết nối. Vui lòng thử lại." } };
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
        updateProfile,
        updatePassword,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
