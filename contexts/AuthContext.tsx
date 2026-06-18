import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getSupabaseClient } from '@/template';
import type { Session } from '@supabase/supabase-js';
import { checkSubscription, SubscriptionStatus } from '@/services/subscriptionService';

export type UserRole = 'barber' | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  whatsapp?: string;
  role: UserRole;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  password: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  operationLoading: boolean;
  isAuthenticated: boolean;
  subscription: SubscriptionStatus;
  login: (email: string, password: string, role?: UserRole) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_SUB: SubscriptionStatus = {
  subscribed: false,
  product_id: null,
  subscription_end: null,
};

const supabase = getSupabaseClient();

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [operationLoading, setOperationLoading] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionStatus>(DEFAULT_SUB);

  const buildUser = useCallback(async (sess: Session): Promise<User | null> => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, username, email, role, phone, whatsapp')
      .eq('id', sess.user.id)
      .single();

    if (!profile) return null;

    return {
      id: profile.id,
      name: profile.username ?? sess.user.email ?? 'Usuário',
      email: profile.email ?? sess.user.email ?? '',
      phone: profile.phone ?? undefined,
      whatsapp: profile.whatsapp ?? undefined,
      role: (profile.role as UserRole) ?? 'client',
    };
  }, []);

  const loadSubscription = useCallback(async () => {
    try {
      const status = await checkSubscription();
      setSubscription(status);
    } catch {
      setSubscription(DEFAULT_SUB);
    }
  }, []);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    supabase.auth.getSession().then(async ({ data: { session: sess } }) => {
      setSession(sess);
      if (sess) {
        const u = await buildUser(sess);
        setUser(u);
        await loadSubscription();
        // Poll every 60s
        interval = setInterval(loadSubscription, 60000);
      }
      setIsLoading(false);
    });

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      setSession(sess);
      if (sess) {
        const u = await buildUser(sess);
        setUser(u);
        await loadSubscription();
      } else {
        setUser(null);
        setSubscription(DEFAULT_SUB);
      }
    });

    return () => {
      authSub.unsubscribe();
      if (interval) clearInterval(interval);
    };
  }, []);

  const login = async (email: string, password: string, _role?: UserRole) => {
    setOperationLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(error.message);
    } finally {
      setOperationLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setOperationLoading(true);
    try {
      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: { full_name: data.name },
        },
      });
      if (error) throw new Error(error.message);
      if (authData.user) {
        await supabase.from('user_profiles').update({
          username: data.name,
          role: data.role,
          phone: data.phone,
          whatsapp: data.whatsapp,
        }).eq('id', authData.user.id);
      }
    } finally {
      setOperationLoading(false);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setSubscription(DEFAULT_SUB);
  };

  const refreshSubscription = async () => {
    await loadSubscription();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        operationLoading,
        isAuthenticated: session !== null,
        subscription,
        login,
        register,
        logout,
        refreshSubscription,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
