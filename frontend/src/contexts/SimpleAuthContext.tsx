'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';
import { mockDB } from '@/lib/mockDatabase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUserData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in (simulate persistence)
    const savedUser = localStorage.getItem('cryptolab_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (error) {
        console.error('Failed to parse saved user data');
        localStorage.removeItem('cryptolab_user');
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const authenticatedUser = mockDB.authenticateUser(email, password);
    if (!authenticatedUser) {
      setLoading(false);
      throw new Error('Invalid email or password');
    }
    
    setUser(authenticatedUser);
    localStorage.setItem('cryptolab_user', JSON.stringify(authenticatedUser));
    setLoading(false);
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    setLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if user already exists
    if (mockDB.getUserByEmail(email)) {
      setLoading(false);
      throw new Error('User with this email already exists');
    }
    
    const newUser = mockDB.createUser(email, password, displayName);
    setUser(newUser);
    localStorage.setItem('cryptolab_user', JSON.stringify(newUser));
    setLoading(false);
  };

  const signOut = async () => {
    mockDB.logout();
    setUser(null);
    localStorage.removeItem('cryptolab_user');
  };

  const refreshUserData = () => {
    if (user) {
      const currentUser = mockDB.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        localStorage.setItem('cryptolab_user', JSON.stringify(currentUser));
      }
    }
  };

  const value: AuthContextType = {
    user,
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