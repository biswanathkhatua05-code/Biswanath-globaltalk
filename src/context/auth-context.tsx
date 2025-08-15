// src/context/auth-context.tsx
"use client";
import type { ReactNode } from 'react';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { auth, firestore } from '@/lib/firebase'; // Import Firebase auth instance
import { 
  onAuthStateChanged, 
  signInAnonymously, 
  signOut,
  type User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import type { User } from '@/lib/types';

interface AuthContextType {
  userId: string | null;
  firebaseUser: FirebaseUser | null;
  userProfile: User | null; // This will hold the full user profile from Firestore
  loginAnonymously: () => Promise<void>;
  logout: () => Promise<void>;
  isLoggedIn: boolean;
  isLoadingAuth: boolean; // To handle initial auth state loading
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<User | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          // User is signed in. Fetch or create their profile in Firestore.
          const userRef = doc(firestore, 'users', fbUser.uid);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            setUserProfile({ id: userSnap.id, ...userSnap.data() } as User);
          } else {
            // New user, create a default profile for them
            const newUser: User = {
              id: fbUser.uid,
              name: fbUser.displayName || `User ${fbUser.uid.substring(0, 6)}`,
              avatarUrl: fbUser.photoURL || `https://api.dicebear.com/8.x/lorelei/svg?seed=${fbUser.uid}`,
              isCreator: false, // Default to not being a creator
            };
            await setDoc(userRef, newUser);
            setUserProfile(newUser);
          }
          setFirebaseUser(fbUser);
        } else {
          // User is signed out
          setFirebaseUser(null);
          setUserProfile(null);
        }
      } catch (error) {
        console.error("Error during authentication state change:", error);
        // If there's an error (e.g., Firestore permissions), log out the user
        // to avoid being in a broken state.
        setFirebaseUser(null);
        setUserProfile(null);
        await signOut(auth).catch(err => console.error("Sign out failed after auth error:", err));
      } finally {
        setIsLoadingAuth(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const loginAnonymously = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      await signInAnonymously(auth);
      // Auth state change will be handled by the onAuthStateChanged listener
    } catch (error) {
      console.error("Anonymous login failed:", error);
      setIsLoadingAuth(false); // Ensure loading stops on failure too
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoadingAuth(true);
    try {
      await signOut(auth);
      // Auth state change will be handled by the onAuthStateChanged listener
    } catch (error) {
      console.error("Logout failed:", error);
      setIsLoadingAuth(false); // Ensure loading stops on failure too
    }
  }, []);

  // We no longer show a full-page loader. 
  // The individual pages will handle their own loading state based on `isLoadingAuth` or `isLoggedIn`.
  // This provides a faster perceived load time for the user.

  return (
    <AuthContext.Provider 
      value={{ 
        userId: firebaseUser ? firebaseUser.uid : null, 
        firebaseUser,
        userProfile,
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
