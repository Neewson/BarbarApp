import { useState, useCallback } from 'react';
import {
  Appointment,
  AppointmentStatus,
  MOCK_APPOINTMENTS,
  CLIENT_APPOINTMENTS,
} from '@/constants/mock-data';

export function useBarberAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>(MOCK_APPOINTMENTS);

  const updateStatus = useCallback((id: string, status: AppointmentStatus) => {
    setAppointments(prev =>
      prev.map(a => (a.id === id ? { ...a, status } : a))
    );
  }, []);

  const getTodayAppointments = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    return appointments.filter(a => a.date === today || a.date === '2026-06-16');
  }, [appointments]);

  const getUpcoming = useCallback(() => {
    return appointments.filter(a =>
      a.status === 'booked' || a.status === 'confirmed'
    );
  }, [appointments]);

  return { appointments, updateStatus, getTodayAppointments, getUpcoming };
}

export function useClientAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>(CLIENT_APPOINTMENTS);

  const cancel = useCallback((id: string) => {
    setAppointments(prev =>
      prev.map(a => (a.id === id ? { ...a, status: 'cancelled' as AppointmentStatus } : a))
    );
  }, []);

  const getUpcoming = useCallback(() => {
    return appointments.filter(
      a => a.status === 'booked' || a.status === 'confirmed'
    );
  }, [appointments]);

  const getHistory = useCallback(() => {
    return appointments.filter(
      a => a.status === 'done' || a.status === 'cancelled'
    );
  }, [appointments]);

  const addAppointment = useCallback((appt: Appointment) => {
    setAppointments(prev => [appt, ...prev]);
  }, []);

  return { appointments, cancel, getUpcoming, getHistory, addAppointment };
}
