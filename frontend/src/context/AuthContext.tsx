'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, getToken, setToken, removeToken } from '@/lib/api';

export interface User {
  id: number;
  email: string;
  business_name: string;
  business_type: string;
  phone?: string;
  currency?: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const token = getToken();
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      const data = await api.getMe();
      if (data?.user) {
        setUser(data.user);
      } else {
        removeToken();
        setUser(null);
      }
    } catch (err) {
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const res = await api.login({ email, password: pass });
    if (res?.token) {
      setToken(res.token);
      setUser(res.user);
    }
  };

  const register = async (data: any) => {
    const res = await api.register(data);
    if (res?.token) {
      setToken(res.token);
      setUser(res.user);
    }
  };

  const logout = () => {
    removeToken();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
