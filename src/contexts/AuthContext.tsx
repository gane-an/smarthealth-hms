import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import api from '@/services/api';

export type UserRole = 'patient' | 'doctor' | 'admin';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  avatar?: string;
  languagePreference?: string;
  isApproved?: boolean;
  dateOfBirth?: string;
  gender?: "male" | "female" | "other";
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone?: string;
    languagePreference?: string;
    departmentId?: string;
    licenseId?: string;
    availabilitySchedule?: string;
    dateOfBirth: string;
    gender: "male" | "female" | "other";
    degrees?: string;
    doctorDocument?: File | null;
  }) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('smarthealth_auth');
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as { user: UserProfile; token: string };
        setUser(parsed.user);
        setToken(parsed.token);
        setLoading(false);
        return;
      } catch {
      }
    }
    const legacy = localStorage.getItem('healsync_user');
    if (legacy) {
      try {
        const legacyUser = JSON.parse(legacy) as UserProfile;
        setUser(legacyUser);
      } catch {
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const authData = response.data as { token: string; user: UserProfile };
      setUser(authData.user);
      setToken(authData.token);
      localStorage.setItem('smarthealth_auth', JSON.stringify(authData));
      return authData.user;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    phone?: string;
    languagePreference?: string;
    departmentId?: string;
    licenseId?: string;
    availabilitySchedule?: string;
    dateOfBirth: string;
    gender: "male" | "female" | "other";
    degrees?: string;
    doctorDocument?: File | null;
  }) => {
    setLoading(true);
    try {
      let response;

      if (data.role === 'doctor' && data.doctorDocument) {
        const formData = new FormData();
        formData.append('name', data.name);
        formData.append('email', data.email);
        formData.append('password', data.password);
        formData.append('role', data.role);
        if (data.phone) {
          formData.append('phone', data.phone);
        }
        if (data.languagePreference) {
          formData.append('languagePreference', data.languagePreference);
        }
        if (data.departmentId) {
          formData.append('departmentId', data.departmentId);
        }
        if (data.licenseId) {
          formData.append('licenseId', data.licenseId);
        }
        if (data.availabilitySchedule) {
          formData.append('availabilitySchedule', data.availabilitySchedule);
        }
        formData.append('dateOfBirth', data.dateOfBirth);
        formData.append('gender', data.gender);
        if (data.degrees) {
          formData.append('degrees', data.degrees);
        }
        formData.append('approvalDocument', data.doctorDocument);

        response = await api.post('/auth/register', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        const payload = {
          name: data.name,
          email: data.email,
          password: data.password,
          role: data.role,
          phone: data.phone,
          languagePreference: data.languagePreference,
          departmentId: data.departmentId,
          licenseId: data.licenseId,
          availabilitySchedule: data.availabilitySchedule,
          dateOfBirth: data.dateOfBirth,
          gender: data.gender,
          degrees: data.degrees,
        };
        response = await api.post('/auth/register', payload);
      }

      const body = response.data as { token?: string; user?: UserProfile };
      if (body.token && body.user && data.role === 'patient') {
        setUser(body.user);
        setToken(body.token);
        localStorage.setItem('smarthealth_auth', JSON.stringify({ token: body.token, user: body.user }));
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('smarthealth_auth');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
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
