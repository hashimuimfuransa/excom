"use client";
import { useState, useEffect, useContext, createContext } from 'react';

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  role: 'user' | 'seller' | 'admin' | 'affiliate';
  avatar?: string;
  phone?: string;
  affiliateOnboardingCompleted?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user data from API using token
  const loadUser = async (token: string): Promise<User | null> => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api'}/auth/me`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await response.json();
      // Ensure name is set from firstName and lastName
      if (userData && !userData.name && (userData.firstName || userData.lastName)) {
        userData.name = `${userData.firstName || ''} ${userData.lastName || ''}`.trim();
      }
      return userData;
    } catch (error) {
      console.error('Error loading user:', error);
      return null;
    }
  };

  // Login function
  const login = async (token: string): Promise<void> => {
    localStorage.setItem('excom_token', token);
    setToken(token);
    const userData = await loadUser(token);
    setUser(userData);
  };

  // Logout function
  const logout = (): void => {
    localStorage.removeItem('excom_token');
    setToken(null);
    setUser(null);
  };

  // Update user data
  const updateUser = (userData: Partial<User>): void => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  // Check for existing token on mount
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      const storedToken = localStorage.getItem('excom_token');
      
      if (storedToken) {
        setToken(storedToken);
        const userData = await loadUser(storedToken);
        if (userData) {
          setUser(userData);
        } else {
          // Invalid token, remove it
          localStorage.removeItem('excom_token');
          setToken(null);
        }
      }
      
      setLoading(false);
    };

    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Utility function to get token
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('excom_token');
}

// Utility function to check if user is authenticated
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}