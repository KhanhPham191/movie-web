"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: any | null }>;
  signUp: (username: string, password: string, name?: string) => Promise<{ error: any | null }>;
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
    // Lấy user hiện tại - luôn cố gắng, để Supabase tự trả về lỗi nếu chưa cấu hình
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        // Nếu lỗi do Supabase chưa cấu hình
        if (error && (error.message?.includes('Invalid API key') || 
                      error.message?.includes('fetch') ||
                      error.message?.includes('network'))) {
          setIsLoading(false);
          return;
        }
        
        setUser(user);
        setIsLoading(false);
      } catch (error: any) {
        // Nếu lỗi do Supabase chưa cấu hình
        setIsLoading(false);
      }
    };

    getUser();

    // Lắng nghe thay đổi auth state
    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
        setIsLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } catch (error: any) {
      // Nếu lỗi do Supabase chưa cấu hình
      setIsLoading(false);
      return () => {};
    }
  }, [supabase.auth]);

  // Helper function để convert username thành email format cho Supabase
  const usernameToEmail = (username: string): string => {
    // Loại bỏ khoảng trắng và chuyển thành lowercase
    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
    // Chỉ giữ lại chữ, số và dấu gạch dưới
    const sanitized = cleanUsername.replace(/[^a-z0-9_]/g, '');
    return `${sanitized}@movpey.local`;
  };

  const signIn = async (username: string, password: string) => {
    try {
      // Convert username thành email format
      const email = usernameToEmail(username);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        // Kiểm tra nếu là lỗi network/fetch
        if (error.message?.includes('fetch') || error.message?.includes('network') || error.message?.includes('Failed to fetch')) {
          return { 
            error: { 
              message: 'Không thể kết nối đến server. Vui lòng kiểm tra cấu hình Supabase hoặc thử lại sau.' 
            } 
          };
        }
        // Nếu là lỗi invalid credentials, đổi message
        if (error.message?.includes('Invalid login credentials') || error.message?.includes('invalid')) {
          return {
            error: {
              message: 'Tài khoản hoặc mật khẩu không đúng'
            }
          };
        }
      }
      
      return { error };
    } catch (err: any) {
      return { 
        error: { 
          message: err.message || 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.' 
        } 
      };
    }
  };

  const signUp = async (username: string, password: string, name?: string) => {
    try {
      // Validate username format
      const cleanUsername = username.trim();
      if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
        return {
          error: {
            message: 'Tên đăng nhập chỉ được dùng chữ cái, số và dấu gạch dưới (_)'
          }
        };
      }

      if (cleanUsername.length < 3) {
        return {
          error: {
            message: 'Tên đăng nhập phải có ít nhất 3 ký tự'
          }
        };
      }

      // Convert username thành email format
      const email = usernameToEmail(cleanUsername);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || cleanUsername,
            username: cleanUsername, // Lưu username thật vào metadata
          },
          emailRedirectTo: undefined, // Tắt email confirmation để đăng ký nhanh
        },
      });
      
      if (error) {
        // Kiểm tra nếu là lỗi network/fetch
        if (error.message?.includes('fetch') || 
            error.message?.includes('network') || 
            error.message?.includes('Failed to fetch') ||
            error.message?.includes('ERR_NAME_NOT_RESOLVED') ||
            error.message?.includes('placeholder')) {
          return { 
            error: { 
              message: 'Không thể kết nối đến Supabase. Vui lòng kiểm tra file .env.local và cấu hình NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY. Xem README.md để biết thêm chi tiết.' 
            } 
          };
        }
        // Nếu user đã tồn tại
        if (error.message?.includes('already registered') || error.message?.includes('already exists')) {
          return {
            error: {
              message: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.'
            }
          };
        }
      }
      
      return { error };
    } catch (err: any) {
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
      // Lấy origin từ window.location để đảm bảo luôn đúng domain hiện tại
      const redirectUrl = `${window.location.origin}/auth/callback`;
      
      // Debug logging để kiểm tra redirect URL
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });
      
      return { error };
    } catch (err: any) {
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




