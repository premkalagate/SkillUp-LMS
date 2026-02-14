import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authApi } from '@/services/api';

type AppRole = 'instructor' | 'user' | 'admin';

interface UserData {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: AppRole;
  created_at: string;
}

interface AuthContextType {
  user: UserData | null;
  loading: boolean;
  userRole: AppRole | null;
  signUp: (email: string, password: string, fullName: string, role: AppRole) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isInstructor: () => boolean;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<AppRole | null>(null);
  
  // Load user from token on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('auth-token');
      if (token) {
        try {
          const response = await authApi.getCurrentUser();
          if (response.user) {
            setUser(response.user);
            setUserRole(response.user.role);
          }
        } catch (error) {
          // Token is invalid, remove it
          localStorage.removeItem('auth-token');
          console.error('Failed to load user:', error);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, role: AppRole) => {
    try {
      const response = await authApi.signUp(email, password, fullName, role);
      if (response.user && response.token) {
        setUser(response.user);
        setUserRole(response.user.role);
        localStorage.setItem('auth-token', response.token);
        return { error: null };
      }
      return { error: new Error('Sign up failed') };
    } catch (error: any) {
      return { error: error as Error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const response = await authApi.signIn(email, password);
      if (response.user && response.token) {
        setUser(response.user);
        setUserRole(response.user.role);
        localStorage.setItem('auth-token', response.token);
        return { error: null };
      }
      return { error: new Error('Sign in failed') };
    } catch (error: any) {
      return { error: error as Error };
    }
  };

  const signOut = async () => {
    setUser(null);
    setUserRole(null);
    localStorage.removeItem('auth-token');
  };

  const isInstructor = () => userRole === 'instructor';
  
  const isAdmin = () => userRole === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, userRole, signUp, signIn, signOut, isInstructor, isAdmin }}>
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
