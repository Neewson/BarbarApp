import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import BarberDashboard from '@/components/screens/BarberDashboard';
import ClientHome from '@/components/screens/ClientHome';

export default function HomeTab() {
  const { user } = useAuth();
  return user?.role === 'barber' ? <BarberDashboard /> : <ClientHome />;
}
