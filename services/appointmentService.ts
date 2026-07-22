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

export interface Barbershop {
  id: string;
  owner_id: string;
  name: string;
  address: string;
  phone?: string;
  whatsapp?: string;
  description?: string;
  work_start: string;
  work_end: string;
  slot_interval: number;
  created_at: string;
}

export interface BarberMetrics {
  totalToday: number;
  completedToday: number;
  cancelledToday: number;
  freeSlots: number;
  totalSlots: number;
  attendanceRate: number; // percentage 0-100
}

const supabase = getSupabaseClient();

// ─── Time Slot Utilities ────────────────────────────────────────────────────

/** Generate all time slots between work_start and work_end with given interval */
export function generateTimeSlots(
  workStart: string,
  workEnd: string,
  intervalMins: number
): string[] {
  const slots: string[] = [];
  const [sh, sm] = workStart.split(':').map(Number);
  const [eh, em] = workEnd.split(':').map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;
  for (let m = startMins; m < endMins; m += intervalMins) {
    const hh = String(Math.floor(m / 60)).padStart(2, '0');
    const mm = String(m % 60).padStart(2, '0');
    slots.push(`${hh}:${mm}`);
  }
  return slots;
}

// ─── Barbershop Queries ─────────────────────────────────────────────────────

/** Fetch the barbershop owned by a barber */
export async function fetchBarbershopByOwnerId(ownerId: string): Promise<Barbershop | null> {
  const { data, error } = await supabase
    .from('barbershops')
    .select('*')
    .eq('owner_id', ownerId)
    .single();
  if (error) return null;
  return data as Barbershop;
}

/** Fetch all barbershops (for client explore) */
export async function fetchAllBarbershops(): Promise<Barbershop[]> {
  const { data, error } = await supabase
    .from('barbershops')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as Barbershop[];
}

/** Fetch available time slots for a barbershop on a date */
export async function fetchAvailableSlots(
  barbershopId: string,
  date: string
): Promise<{ time: string; available: boolean }[]> {
  // Fetch the barbershop config
  const { data: shop, error: shopErr } = await supabase
    .from('barbershops')
    .select('work_start, work_end, slot_interval')
    .eq('id', barbershopId)
    .single();
  if (shopErr || !shop) return [];

  // Fetch booked times for that day
  const { data: booked } = await supabase
    .from('appointments')
    .select('appointment_time')
    .eq('barbershop_id', barbershopId)
    .eq('appointment_date', date)
    .in('status', ['booked', 'confirmed', 'in_progress']);

  const bookedTimes = new Set((booked ?? []).map((a: any) => a.appointment_time));
  const allSlots = generateTimeSlots(shop.work_start, shop.work_end, shop.slot_interval);

  return allSlots.map(time => ({
    time,
    available: !bookedTimes.has(time),
  }));
}

// ─── Appointment Queries ────────────────────────────────────────────────────

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

/** Fetch barber daily metrics */
export async function fetchBarberMetrics(
  barberId: string,
  date: string
): Promise<BarberMetrics> {
  // Fetch today's appointments
  const { data: todayAppts } = await supabase
    .from('appointments')
    .select('status, appointment_time')
    .eq('barber_id', barberId)
    .eq('appointment_date', date);

  const todayList = (todayAppts ?? []) as { status: string; appointment_time: string }[];
  const totalToday = todayList.length;
  const completedToday = todayList.filter(a => a.status === 'done').length;
  const cancelledToday = todayList.filter(a => a.status === 'cancelled').length;
  const bookedTimesToday = new Set(
    todayList
      .filter(a => ['booked', 'confirmed', 'in_progress'].includes(a.status))
      .map(a => a.appointment_time)
  );

  // Fetch shop config for slot count
  const shop = await fetchBarbershopByOwnerId(barberId);
  let totalSlots = 0;
  let freeSlots = 0;
  if (shop) {
    const allSlots = generateTimeSlots(shop.work_start, shop.work_end, shop.slot_interval);
    totalSlots = allSlots.length;
    freeSlots = allSlots.filter(t => !bookedTimesToday.has(t)).length;
  }

  // Attendance rate: completed / (completed + cancelled) from all history
  const { data: historyData } = await supabase
    .from('appointments')
    .select('status')
    .eq('barber_id', barberId)
    .in('status', ['done', 'cancelled']);

  const history = (historyData ?? []) as { status: string }[];
  const doneAll = history.filter(a => a.status === 'done').length;
  const cancelledAll = history.filter(a => a.status === 'cancelled').length;
  const totalFinished = doneAll + cancelledAll;
  const attendanceRate = totalFinished > 0 ? Math.round((doneAll / totalFinished) * 100) : 100;

  return {
    totalToday,
    completedToday,
    cancelledToday,
    freeSlots,
    totalSlots,
    attendanceRate,
  };
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
