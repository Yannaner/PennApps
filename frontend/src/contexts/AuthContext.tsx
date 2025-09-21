'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User as FirebaseUser, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (firebaseUser: FirebaseUser): Promise<User | null> => {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          displayName: userData.displayName || firebaseUser.displayName,
          ecoCoins: userData.ecoCoins,
          createdAt: userData.createdAt.toDate(),
          updatedAt: userData.updatedAt.toDate(),
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  const createUserDocument = async (firebaseUser: FirebaseUser, displayName?: string) => {
    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      const now = new Date();
      
      const userData: Omit<User, 'uid'> = {
        email: firebaseUser.email!,
        displayName: displayName || firebaseUser.displayName || '',
        ecoCoins: 100, // Default 100 ECO Coins
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(userRef, userData);
      
      return {
        uid: firebaseUser.uid,
        ...userData,
      };
    } catch (error) {
      console.error('Error creating user document:', error);
      // Return a basic user object even if Firestore fails
      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email!,
        displayName: displayName || firebaseUser.displayName || '',
        ecoCoins: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      if (displayName) {
        await updateProfile(result.user, { displayName });
      }
      
      // Create user document in Firestore
      const userData = await createUserDocument(result.user, displayName);
      setUser(userData);
    } catch (error) {
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setFirebaseUser(null);
    } catch (error) {
      throw error;
    }
  };

  const refreshUserData = async () => {
    if (firebaseUser) {
      const userData = await fetchUserData(firebaseUser);
      if (userData) {
        setUser(userData);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        let userData = await fetchUserData(firebaseUser);
        
        // If user document doesn't exist, create it
        if (!userData) {
          userData = await createUserDocument(firebaseUser);
        }
        
        setUser(userData);
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value: AuthContextType = {
    user,
    firebaseUser,
    loading,
    signIn,
    signUp,
    signOut,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}