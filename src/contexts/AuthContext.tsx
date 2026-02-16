import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type UserRole = 'patient' | 'doctor' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  isApproved?: boolean;
}

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, role: UserRole) => Promise<void>;
  register: (data: Omit<UserProfile, 'id' | 'isApproved'>) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('healsync_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, role: UserRole) => {
    setLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockUser: UserProfile = {
      id: Math.random().toString(36).substr(2, 9),
      name: email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1),
      email,
      role,
      isApproved: role !== 'doctor', // Doctors need approval, others auto-approved for demo
    };
    
    setUser(mockUser);
    localStorage.setItem('healsync_user', JSON.stringify(mockUser));
    setLoading(false);
  };

  const register = async (data: Omit<UserProfile, 'id' | 'isApproved'>) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newUser: UserProfile = {
      ...data,
      id: Math.random().toString(36).substr(2, 9),
      isApproved: data.role !== 'doctor',
    };
    
    // In a real app, we'd save to DB. Here we just log in if not a doctor
    if (newUser.role !== 'doctor') {
      setUser(newUser);
      localStorage.setItem('healsync_user', JSON.stringify(newUser));
    } else {
      // For doctors, we simulate the "pending approval" state
      alert('Registration successful! Waiting for admin approval.');
    }
    setLoading(false);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('healsync_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
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
