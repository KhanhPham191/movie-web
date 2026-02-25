"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

// ============================================================
// Local Auth System - Lưu trữ tài khoản trong localStorage
// Không cần Supabase, mọi dữ liệu lưu trên trình duyệt
// ============================================================

// 🔒 FLAG: Tạm đóng tính năng đăng nhập
// Đổi thành false để bật lại đăng nhập
export const AUTH_DISABLED = true;

// Tạo type LocalUser tương thích với cách các component truy cập user
interface LocalUser {
  id: string;
  email: string;
  user_metadata: {
    username: string;
    name: string;
    avatar_url?: string;
  };
  created_at: string;
}

// Cấu trúc user lưu trong localStorage (bao gồm password hash)
interface StoredUser {
  id: string;
  username: string;
  email: string;
  password: string; // simple hash, chỉ dùng local
  name: string;
  avatar_url?: string;
  created_at: string;
}

interface AuthContextType {
  user: LocalUser | null;
  isLoading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: any | null }>;
  signUp: (username: string, password: string, name?: string) => Promise<{ error: any | null; requiresVerification?: boolean }>;
  signInWithGoogle: () => Promise<{ error: any | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: { name?: string; avatar_url?: string }) => Promise<{ error: any | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: any | null }>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Key để lưu trong localStorage
const STORAGE_KEYS = {
  USERS: 'movpey_users',         // Danh sách tất cả users
  CURRENT_USER: 'movpey_current_user', // User đang đăng nhập
};

// Simple hash function cho password (chỉ dùng cho local, không phải production security)
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  // Thêm salt đơn giản
  const salted = `movpey_${Math.abs(hash).toString(36)}_${str.length}`;
  // Hash thêm lần nữa
  let hash2 = 0;
  for (let i = 0; i < salted.length; i++) {
    const char = salted.charCodeAt(i);
    hash2 = ((hash2 << 5) - hash2) + char;
    hash2 = hash2 & hash2;
  }
  return `${Math.abs(hash).toString(36)}${Math.abs(hash2).toString(36)}`;
}

// Generate unique ID
function generateId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

// Helper: lấy danh sách users từ localStorage
function getStoredUsers(): StoredUser[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// Helper: lưu danh sách users
function saveStoredUsers(users: StoredUser[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

// Helper: lấy current user session
function getCurrentSession(): LocalUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

// Helper: lưu current user session
function saveCurrentSession(user: LocalUser | null) {
  if (typeof window === 'undefined') return;
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

// Helper: convert StoredUser thành LocalUser (không bao gồm password)
function storedToLocalUser(stored: StoredUser): LocalUser {
  return {
    id: stored.id,
    email: stored.email,
    user_metadata: {
      username: stored.username,
      name: stored.name,
      avatar_url: stored.avatar_url,
    },
    created_at: stored.created_at,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Khôi phục session từ localStorage khi mount
  useEffect(() => {
    // Nếu auth bị tắt, skip loading
    if (AUTH_DISABLED) {
      setIsLoading(false);
      return;
    }

    const savedUser = getCurrentSession();
    if (savedUser) {
      // Kiểm tra user vẫn tồn tại trong danh sách
      const users = getStoredUsers();
      const exists = users.find(u => u.id === savedUser.id);
      if (exists) {
        // Cập nhật với data mới nhất từ stored
        setUser(storedToLocalUser(exists));
      } else {
        // User đã bị xóa, clear session
        saveCurrentSession(null);
      }
    }
    setIsLoading(false);
  }, []);

  // Sync session vào localStorage mỗi khi user thay đổi
  useEffect(() => {
    saveCurrentSession(user);
  }, [user]);

  // Helper function để convert username thành email format
  const usernameToEmail = (username: string): string => {
    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
    const sanitized = cleanUsername.replace(/[^a-z0-9_]/g, '');
    return `${sanitized}@movpey.local`;
  };

  const signIn = useCallback(async (username: string, password: string) => {
    if (AUTH_DISABLED) {
      return { error: { message: 'Tính năng đăng nhập tạm thời bị đóng.' } };
    }
    try {
      const cleanUsername = username.trim().toLowerCase();
      const users = getStoredUsers();
      const storedUser = users.find(
        u => u.username.toLowerCase() === cleanUsername
      );

      if (!storedUser) {
        return {
          error: { message: 'Tài khoản hoặc mật khẩu không đúng' }
        };
      }

      // So sánh password hash
      if (storedUser.password !== simpleHash(password)) {
        return {
          error: { message: 'Tài khoản hoặc mật khẩu không đúng' }
        };
      }

      // Đăng nhập thành công
      const localUser = storedToLocalUser(storedUser);
      setUser(localUser);
      return { error: null };
    } catch (err: any) {
      return {
        error: { message: err.message || 'Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.' }
      };
    }
  }, []);

  const signUp = useCallback(async (username: string, password: string, name?: string) => {
    if (AUTH_DISABLED) {
      return { error: { message: 'Tính năng đăng ký tạm thời bị đóng.' } };
    }
    try {
      // Validate username format
      const cleanUsername = username.trim();
      if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
        return {
          error: { message: 'Tên đăng nhập chỉ được dùng chữ cái, số và dấu gạch dưới (_)' }
        };
      }

      if (cleanUsername.length < 3) {
        return {
          error: { message: 'Tên đăng nhập phải có ít nhất 3 ký tự' }
        };
      }

      if (password.length < 6) {
        return {
          error: { message: 'Mật khẩu phải có ít nhất 6 ký tự' }
        };
      }

      // Kiểm tra username đã tồn tại chưa
      const users = getStoredUsers();
      const exists = users.find(
        u => u.username.toLowerCase() === cleanUsername.toLowerCase()
      );
      if (exists) {
        return {
          error: { message: 'Tên đăng nhập này đã được sử dụng. Vui lòng chọn tên khác.' }
        };
      }

      // Tạo user mới
      const newUser: StoredUser = {
        id: generateId(),
        username: cleanUsername,
        email: usernameToEmail(cleanUsername),
        password: simpleHash(password),
        name: name || cleanUsername,
        created_at: new Date().toISOString(),
      };

      // Lưu vào localStorage
      users.push(newUser);
      saveStoredUsers(users);

      // Tự động đăng nhập sau khi đăng ký
      const localUser = storedToLocalUser(newUser);
      setUser(localUser);

      return { error: null };
    } catch (err: any) {
      return {
        error: { message: err.message || 'Đã xảy ra lỗi khi đăng ký. Vui lòng thử lại.' }
      };
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    return {
      error: { message: 'Đăng nhập với Google không khả dụng ở chế độ local. Vui lòng dùng tài khoản và mật khẩu.' }
    };
  }, []);

  const signOut = useCallback(async () => {
    setUser(null);
    saveCurrentSession(null);
  }, []);

  const updateProfile = useCallback(async (data: { name?: string; avatar_url?: string }) => {
    try {
      if (!user) {
        return { error: { message: 'Chưa đăng nhập' } };
      }

      const users = getStoredUsers();
      const idx = users.findIndex(u => u.id === user.id);
      if (idx === -1) {
        return { error: { message: 'Không tìm thấy tài khoản' } };
      }

      // Cập nhật thông tin
      if (data.name !== undefined) users[idx].name = data.name;
      if (data.avatar_url !== undefined) users[idx].avatar_url = data.avatar_url;

      saveStoredUsers(users);

      // Cập nhật state
      const updatedUser = storedToLocalUser(users[idx]);
      setUser(updatedUser);

      return { error: null };
    } catch (err: any) {
      return { error: { message: err.message || 'Có lỗi xảy ra' } };
    }
  }, [user]);

  const updatePassword = useCallback(async (newPassword: string) => {
    try {
      if (!user) {
        return { error: { message: 'Chưa đăng nhập' } };
      }

      if (newPassword.length < 6) {
        return { error: { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' } };
      }

      const users = getStoredUsers();
      const idx = users.findIndex(u => u.id === user.id);
      if (idx === -1) {
        return { error: { message: 'Không tìm thấy tài khoản' } };
      }

      users[idx].password = simpleHash(newPassword);
      saveStoredUsers(users);

      return { error: null };
    } catch (err: any) {
      return { error: { message: err.message || 'Có lỗi xảy ra' } };
    }
  }, [user]);

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




