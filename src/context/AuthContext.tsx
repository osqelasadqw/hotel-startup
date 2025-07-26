"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ref, get } from 'firebase/database';
import { auth, database } from '@/firebase/config';

export type UserRole = 'department' | 'admin';

interface UserData {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  roomNumber?: string;
}

interface AuthContextType {
  user: UserData | null;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setIsLoading(true);
      if (currentUser) {
        try {
          // Get user data from database
          const userRef = ref(database, `users/${currentUser.uid}`);
          const snapshot = await get(userRef);
          
          if (snapshot.exists()) {
            const userData = snapshot.val();
            setUser({
              id: currentUser.uid,
              name: userData.name,
              email: userData.email,
              role: userData.role,
              departmentId: userData.departmentId,
              roomNumber: userData.roomNumber,
            });
          } else {
            // User exists in authentication but not in database
            setUser(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        // User is signed out
        setUser(null);
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider; 