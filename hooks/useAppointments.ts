import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Appointment,
  AppointmentStatus,
  fetchBarberAppointmentsByDate,
  fetchClientAppointments,
  updateAppointmentStatus,
} from '@/services/appointmentService';

const POLL_INTERVAL = 30_000; // 30 seconds

/** Hook for barber: loads appointments for a specific date, polls for updates */
export function useBarberAppointments(barberId: string | undefined, date: string) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (showLoader = false) => {
    if (!barberId) return;
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const data = await fetchBarberAppointmentsByDate(barberId, date);
      setAppointments(data);
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao carregar agenda');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [barberId, date]);

  // Initial load + poll
  useEffect(() => {
    load(true);
    intervalRef.current = setInterval(() => load(false), POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load]);

  const updateStatus = useCallback(async (id: string, status: AppointmentStatus) => {
    // Optimistic update
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    try {
      await updateAppointmentStatus(id, status);
    } catch {
      // Revert on failure
      await load(false);
    }
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  // Derived helpers
  const getTodayAppointments = useCallback(() => appointments, [appointments]);
  const getUpcoming = useCallback(() =>
    appointments.filter(a => a.status === 'booked' || a.status === 'confirmed'),
  [appointments]);

  return { appointments, loading, error, updateStatus, refresh, getTodayAppointments, getUpcoming };
}

/** Hook for client: loads all their appointments, polls for updates */
export function useClientAppointments(clientId: string | undefined) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async (showLoader = false) => {
    if (!clientId) return;
    if (showLoader) setLoading(true);
    setError(null);
    try {
      const data = await fetchClientAppointments(clientId);
      setAppointments(data);
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao carregar agendamentos');
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    load(true);
    intervalRef.current = setInterval(() => load(false), POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load]);

  const cancel = useCallback(async (id: string) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' as AppointmentStatus } : a));
    try {
      await updateAppointmentStatus(id, 'cancelled');
    } catch {
      await load(false);
    }
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  const getUpcoming = useCallback(() =>
    appointments.filter(a => a.status === 'booked' || a.status === 'confirmed'),
  [appointments]);

  const getHistory = useCallback(() =>
    appointments.filter(a => a.status === 'done' || a.status === 'cancelled'),
  [appointments]);

  return { appointments, loading, error, cancel, refresh, getUpcoming, getHistory };
}
