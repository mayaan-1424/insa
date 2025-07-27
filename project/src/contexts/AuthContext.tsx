import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { firebaseService, UserProfile } from '../services/firebaseService';

interface User {
  id: string;
  email: string;
  username: string;
  displayName?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen to Firebase auth state changes
    const unsubscribe = firebaseService.onAuthStateChanged(async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          // Get user profile from Firestore
          const userProfile = await firebaseService.getUserProfile(firebaseUser.uid);
          if (userProfile) {
            setUser({
              id: userProfile.uid,
              email: userProfile.email,
              username: userProfile.username,
              displayName: userProfile.displayName
            });
          } else {
            // If profile doesn't exist, create a basic one from Firebase user
            const basicProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'user',
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
              createdAt: new Date()
            };
            
            await firebaseService.createUserProfile(basicProfile);
            setUser({
              id: basicProfile.uid,
              email: basicProfile.email,
              username: basicProfile.username,
              displayName: basicProfile.displayName
            });
          }
        } catch (error) {
          console.error('Error handling user profile:', error);
          // Fallback to basic user info from Firebase Auth
          setUser({
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'user',
            displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User'
          });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (emailOrUsername: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    try {
      // Determine if input is email or username
      const email = emailOrUsername.includes('@') ? emailOrUsername : `${emailOrUsername}@example.com`;
      
      const userProfile = await firebaseService.signIn(email, password);
      setUser({
        id: userProfile.uid,
        email: userProfile.email,
        username: userProfile.username,
        displayName: userProfile.displayName
      });
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    try {
      await firebaseService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};