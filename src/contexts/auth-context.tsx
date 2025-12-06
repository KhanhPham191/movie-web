"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any | null }>;
  signInWithGoogle: () => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    // Lấy user hiện tại
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setIsLoading(false);
    };

    getUser();

    // Lắng nghe thay đổi auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase.auth]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Kiểm tra nếu là lỗi network/fetch
        if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('Failed to fetch')) {
          console.error('[Auth] Network error - Kiểm tra cấu hình Supabase:', {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          });
          return { 
            error: { 
              message: 'Không thể kết nối đến server. Vui lòng kiểm tra cấu hình Supabase hoặc thử lại sau.' 
            } 
          };
        }
      }
      
      return { error };
    } catch (err: any) {
      console.error('[Auth] SignIn error:', err);
      return { 
        error: { 
          message: err.message || 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.' 
        } 
      };
    }
  };

  const signUp = async (email: string, password: string, name?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || email.split("@")[0],
          },
        },
      });
      
      if (error) {
        // Kiểm tra nếu là lỗi network/fetch
        if (error.message?.includes('fetch') || 
            error.message?.includes('network') || 
            error.message?.includes('Failed to fetch') ||
            error.message?.includes('ERR_NAME_NOT_RESOLVED') ||
            error.message?.includes('placeholder')) {
          console.error('[Auth] Network error - Kiểm tra cấu hình Supabase:', {
            url: process.env.NEXT_PUBLIC_SUPABASE_URL,
            hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          });
          return { 
            error: { 
              message: 'Không thể kết nối đến Supabase. Vui lòng kiểm tra file .env.local và cấu hình NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY. Xem README.md để biết thêm chi tiết.' 
            } 
          };
        }
      }
      
      return { error };
    } catch (err: any) {
      console.error('[Auth] SignUp error:', err);
      
      // Kiểm tra nếu là lỗi cấu hình Supabase
      if (err.message?.includes('Supabase chưa được cấu hình') || 
          err.message?.includes('placeholder') ||
          err.message?.includes('ERR_NAME_NOT_RESOLVED')) {
        return { 
          error: { 
            message: 'Supabase chưa được cấu hình. Vui lòng tạo file .env.local với NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY. Xem README.md để biết thêm chi tiết.' 
          } 
        };
      }
      
      return { 
        error: { 
          message: err.message || 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.' 
        } 
      };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      return { error };
    } catch (err: any) {
      console.error('[Auth] SignInWithGoogle error:', err);
      return { 
        error: { 
          message: err.message || 'Đã xảy ra lỗi khi đăng nhập với Google. Vui lòng thử lại.' 
        } 
      };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
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

