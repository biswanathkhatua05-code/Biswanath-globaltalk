// src/context/auth-context.tsx
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase'; // Import Firebase auth instance
import { 
  onAuthStateChanged, 
  signInAnonymously, 
  signOut,
  type User as FirebaseUser 
} from 'firebase/auth';
import { Loader2 } from 'lucide-react';

interface AuthContextType {
  userId: string | null;
  firebaseUser: FirebaseUser | null; // Store the Firebase user object
  loginAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
  isLoadingAuth: boolean; // To handle initial auth state loading
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true); // Start as true
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      setIsLoadingAuth(false);
    });
    return () => unsubscribe(); // Cleanup subscription on unmount
  }, []);

  const loginAnonymously = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      await signInAnonymously(auth);
      // onAuthStateChanged will handle setting the user and navigating if needed
      // router.push('/chat'); // Navigation can be handled based on auth state in layouts/pages
    } catch (error) {
      console.error("Anonymous login failed:", error);
      // Handle error appropriately, e.g., show a toast message
    } finally {
      // setIsLoadingAuth(false); // onAuthStateChanged handles this
    }
  }, [router]);

  const logout = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      await signOut(auth);
      // router.push('/'); // Navigation can be handled based on auth state
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      // setIsLoadingAuth(false); // onAuthStateChanged handles this
    }
  }, [router]);

  // If still checking auth state, show a global loader or similar
  if (isLoadingAuth) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="mt-4 text-foreground">Initializing session...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider 
      value={{ 
        userId: firebaseUser ? firebaseUser.uid : null, 
        firebaseUser,
        loginAnonymously, 
        logout, 
        isLoggedIn: !!firebaseUser,
        isLoadingAuth 
      }}
    >
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
