import { getSupabaseClient } from '@/template';

export type AppointmentStatus =
  | 'booked'
  | 'confirmed'
  | 'in_progress'
  | 'done'
  | 'cancelled'
  | 'rescheduled';

export interface Appointment {
  id: string;
  barbershop_id: string;
  barber_id: string;
  client_id: string;
  client_name: string;
  client_phone?: string;
  client_whatsapp?: string;
  service: string;
  appointment_date: string; // 'YYYY-MM-DD'
  appointment_time: string; // 'HH:MM'
  status: AppointmentStatus;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const supabase = getSupabaseClient();

/** Fetch all appointments for a barber on a given date */
export async function fetchBarberAppointmentsByDate(
  barberId: string,
  date: string
): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('barber_id', barberId)
    .eq('appointment_date', date)
    .order('appointment_time', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Appointment[];
}

/** Fetch all appointments for a barber (for agenda overview) */
export async function fetchBarberAppointments(barberId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('barber_id', barberId)
    .order('appointment_date', { ascending: true })
    .order('appointment_time', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Appointment[];
}

/** Fetch appointments for a client */
export async function fetchClientAppointments(clientId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('client_id', clientId)
    .order('appointment_date', { ascending: false })
    .order('appointment_time', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as Appointment[];
}

/** Update appointment status */
export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus
): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

/** Insert a new appointment */
export async function createAppointment(
  payload: Omit<Appointment, 'id' | 'created_at' | 'updated_at'>
): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw new Error(error.message);
  return data as Appointment;
}
