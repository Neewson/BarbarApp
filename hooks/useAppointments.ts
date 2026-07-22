import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Appointment,
  AppointmentStatus,
  BarberMetrics,
  fetchBarberAppointmentsByDate,
  fetchClientAppointments,
  updateAppointmentStatus,
  fetchBarberMetrics,
  fetchAvailableSlots,
  fetchBarbershopByOwnerId,
  Barbershop,
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

  useEffect(() => {
    load(true);
    intervalRef.current = setInterval(() => load(false), POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load]);

  const updateStatus = useCallback(async (id: string, status: AppointmentStatus) => {
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    try {
      await updateAppointmentStatus(id, status);
    } catch {
      await load(false);
    }
  }, [load]);

  const refresh = useCallback(() => load(true), [load]);

  const getTodayAppointments = useCallback(() => appointments, [appointments]);
  const getUpcoming = useCallback(() =>
    appointments.filter(a => a.status === 'booked' || a.status === 'confirmed'),
  [appointments]);

  return { appointments, loading, error, updateStatus, refresh, getTodayAppointments, getUpcoming };
}

/** Hook for barber real metrics */
export function useBarberMetrics(barberId: string | undefined, date: string) {
  const [metrics, setMetrics] = useState<BarberMetrics>({
    totalToday: 0,
    completedToday: 0,
    cancelledToday: 0,
    freeSlots: 0,
    totalSlots: 0,
    attendanceRate: 100,
  });
  const [loading, setLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (!barberId) return;
    setLoading(true);
    try {
      const data = await fetchBarberMetrics(barberId, date);
      setMetrics(data);
    } catch {
      // keep previous values on error
    } finally {
      setLoading(false);
    }
  }, [barberId, date]);

  useEffect(() => {
    load();
    intervalRef.current = setInterval(load, POLL_INTERVAL);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load]);

  return { metrics, loading, refresh: load };
}

/** Hook for barber's own barbershop */
export function useBarberShop(ownerId: string | undefined) {
  const [shop, setShop] = useState<Barbershop | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!ownerId) return;
    setLoading(true);
    try {
      const data = await fetchBarbershopByOwnerId(ownerId);
      setShop(data);
    } catch {
      setShop(null);
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  useEffect(() => { load(); }, [load]);

  return { shop, loading, refresh: load };
}

/** Hook for available slots on a specific barbershop/date */
export function useAvailableSlots(barbershopId: string | undefined, date: string | undefined) {
  const [slots, setSlots] = useState<{ time: string; available: boolean }[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!barbershopId || !date) return;
    setLoading(true);
    try {
      const data = await fetchAvailableSlots(barbershopId, date);
      setSlots(data);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
    }
  }, [barbershopId, date]);

  useEffect(() => { load(); }, [load]);

  return { slots, loading, refresh: load };
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
