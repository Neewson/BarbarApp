import { useContext } from 'react';
import { AuthContext } from '@/contexts/AuthContext';

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return {
    user: ctx.user,
    session: ctx.session,
    isLoading: ctx.isLoading,
    operationLoading: ctx.operationLoading,
    isAuthenticated: ctx.isAuthenticated,
    subscription: ctx.subscription,
    login: ctx.login,
    register: ctx.register,
    logout: ctx.logout,
    refreshSubscription: ctx.refreshSubscription,
  };
}
