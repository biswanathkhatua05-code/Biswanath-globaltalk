"use client";
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  userId: string | null;
  loginAnonymously: () => void;
  logout: () => void;
  isLoggedIn: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ANONYMOUS_USER_ID_KEY = 'anonymousUserId_globaltalk';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const storedUserId = localStorage.getItem(ANONYMOUS_USER_ID_KEY);
    if (storedUserId) {
      setUserId(storedUserId);
    }
  }, []);

  const loginAnonymously = useCallback(() => {
    const newUserId = `user_${Date.now().toString(36)}${Math.random().toString(36).substring(2, 5)}`;
    localStorage.setItem(ANONYMOUS_USER_ID_KEY, newUserId);
    setUserId(newUserId);
    router.push('/chat');
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem(ANONYMOUS_USER_ID_KEY);
    setUserId(null);
    router.push('/');
  }, [router]);

  return (
    <AuthContext.Provider value={{ userId, loginAnonymously, logout, isLoggedIn: !!userId }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
