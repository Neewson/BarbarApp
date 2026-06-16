import React, { createContext, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'barber' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  role: UserRole;
  barbershopId?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  password: string;
  role: UserRole;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_BARBER: User = {
  id: 'barber_001',
  name: 'Bruno Almeida',
  email: 'barbeiro@barbar.app',
  phone: '(11) 99999-0001',
  whatsapp: '(11) 99999-0001',
  role: 'barber',
  barbershopId: 'bs_001',
};

const MOCK_CLIENT: User = {
  id: 'client_001',
  name: 'João Silva',
  email: 'cliente@barbar.app',
  phone: '(11) 98765-1234',
  whatsapp: '(11) 98765-1234',
  role: 'client',
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1200));
    const mockUser = role === 'barber' ? MOCK_BARBER : MOCK_CLIENT;
    setUser(mockUser);
    setIsLoading(false);
  };

  const register = async (data: RegisterData) => {
    setIsLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    const newUser: User = {
      id: `user_${Date.now()}`,
      name: data.name,
      email: data.email,
      phone: data.phone,
      whatsapp: data.whatsapp,
      role: data.role,
    };
    setUser(newUser);
    setIsLoading(false);
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
