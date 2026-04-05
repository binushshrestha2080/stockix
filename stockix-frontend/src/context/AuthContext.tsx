"use client";
import { createContext, useContext, useEffect, useState } from "react";

interface User {
  _id: string;
  name: string;
  email: string;
  role: "user" | "admin";
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]         = useState<User | null>(null);
  const [token, setToken]       = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("stockix_token");
    const storedUser  = localStorage.getItem("stockix_user");
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

 const login = (token: string, user: User) => {
    setToken(token);
    setUser(user);
    localStorage.setItem("stockix_token", token);
    localStorage.setItem("stockix_user", JSON.stringify(user));
    document.cookie = `stockix_token=${token}; path=/; max-age=${7 * 24 * 60 * 60}`;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("stockix_token");
    localStorage.removeItem("stockix_user");
    document.cookie = "stockix_token=; path=/; max-age=0";
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}