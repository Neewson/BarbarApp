export type AppointmentStatus =
  | 'booked'
  | 'confirmed'
  | 'in_progress'
  | 'done'
  | 'cancelled'
  | 'rescheduled';

export interface Barbershop {
  id: string;
  name: string;
  address: string;
  phone: string;
  whatsapp: string;
  description: string;
  rating: number;
  reviewCount: number;
  photo: string;
  services: Service[];
  workingHours: { start: string; end: string };
}

export interface Service {
  id: string;
  name: string;
  duration: number; // minutes
  price: number;
}

export interface Appointment {
  id: string;
  clientName: string;
  clientPhone: string;
  clientWhatsapp: string;
  service: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  barbershopId: string;
  note?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  blocked: boolean;
}

export const MOCK_BARBERSHOP: Barbershop = {
  id: 'bs_001',
  name: 'Barber Premium Studio',
  address: 'Rua Augusta, 1205 – Consolação, São Paulo – SP',
  phone: '(11) 3456-7890',
  whatsapp: '(11) 99876-5432',
  description: 'Studio premium de barbearia com mais de 10 anos de experiência. Especialistas em cortes modernos, barbas e tratamentos capilares exclusivos.',
  rating: 4.9,
  reviewCount: 347,
  photo: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800',
  workingHours: { start: '08:00', end: '18:00' },
  services: [
    { id: 'sv_001', name: 'Corte Masculino', duration: 30, price: 45 },
    { id: 'sv_002', name: 'Barba Completa', duration: 30, price: 35 },
    { id: 'sv_003', name: 'Corte + Barba', duration: 60, price: 75 },
    { id: 'sv_004', name: 'Sobrancelha', duration: 15, price: 20 },
    { id: 'sv_005', name: 'Hidratação Capilar', duration: 45, price: 60 },
    { id: 'sv_006', name: 'Pigmentação', duration: 60, price: 90 },
  ],
};

export const MOCK_APPOINTMENTS: Appointment[] = [
  {
    id: 'ap_001',
    clientName: 'Carlos Oliveira',
    clientPhone: '(11) 98765-4321',
    clientWhatsapp: '(11) 98765-4321',
    service: 'Corte + Barba',
    date: '2026-06-16',
    time: '08:00',
    status: 'confirmed',
    barbershopId: 'bs_001',
  },
  {
    id: 'ap_002',
    clientName: 'Ricardo Mendes',
    clientPhone: '(11) 97654-3210',
    clientWhatsapp: '(11) 97654-3210',
    service: 'Corte Masculino',
    date: '2026-06-16',
    time: '09:00',
    status: 'in_progress',
    barbershopId: 'bs_001',
  },
  {
    id: 'ap_003',
    clientName: 'Marcos Silva',
    clientPhone: '(11) 96543-2109',
    clientWhatsapp: '(11) 96543-2109',
    service: 'Barba Completa',
    date: '2026-06-16',
    time: '10:00',
    status: 'booked',
    barbershopId: 'bs_001',
  },
  {
    id: 'ap_004',
    clientName: 'André Costa',
    clientPhone: '(11) 95432-1098',
    clientWhatsapp: '(11) 95432-1098',
    service: 'Corte Masculino',
    date: '2026-06-16',
    time: '11:00',
    status: 'booked',
    barbershopId: 'bs_001',
  },
  {
    id: 'ap_005',
    clientName: 'Felipe Rocha',
    clientPhone: '(11) 94321-0987',
    clientWhatsapp: '(11) 94321-0987',
    service: 'Corte + Barba',
    date: '2026-06-16',
    time: '14:00',
    status: 'booked',
    barbershopId: 'bs_001',
  },
  {
    id: 'ap_006',
    clientName: 'Lucas Ferreira',
    clientPhone: '(11) 93210-9876',
    clientWhatsapp: '(11) 93210-9876',
    service: 'Hidratação Capilar',
    date: '2026-06-16',
    time: '15:30',
    status: 'booked',
    barbershopId: 'bs_001',
  },
  {
    id: 'ap_007',
    clientName: 'João Santos',
    clientPhone: '(11) 92109-8765',
    clientWhatsapp: '(11) 92109-8765',
    service: 'Corte Masculino',
    date: '2026-06-17',
    time: '09:30',
    status: 'booked',
    barbershopId: 'bs_001',
  },
];

export const CLIENT_APPOINTMENTS: Appointment[] = [
  {
    id: 'cap_001',
    clientName: 'João Silva',
    clientPhone: '(11) 98765-1234',
    clientWhatsapp: '(11) 98765-1234',
    service: 'Corte + Barba',
    date: '2026-06-16',
    time: '14:00',
    status: 'confirmed',
    barbershopId: 'bs_001',
  },
  {
    id: 'cap_002',
    clientName: 'João Silva',
    clientPhone: '(11) 98765-1234',
    clientWhatsapp: '(11) 98765-1234',
    service: 'Corte Masculino',
    date: '2026-06-10',
    time: '10:00',
    status: 'done',
    barbershopId: 'bs_001',
  },
  {
    id: 'cap_003',
    clientName: 'João Silva',
    clientPhone: '(11) 98765-1234',
    clientWhatsapp: '(11) 98765-1234',
    service: 'Barba Completa',
    date: '2026-05-28',
    time: '11:30',
    status: 'done',
    barbershopId: 'bs_001',
  },
];

export function generateTimeSlots(
  start: string,
  end: string,
  intervalMinutes: number,
  bookedTimes: string[] = []
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  const [startH, startM] = start.split(':').map(Number);
  const [endH, endM] = end.split(':').map(Number);
  let current = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  while (current < endTotal) {
    const h = Math.floor(current / 60).toString().padStart(2, '0');
    const m = (current % 60).toString().padStart(2, '0');
    const time = `${h}:${m}`;
    const isBooked = bookedTimes.includes(time);
    slots.push({ time, available: !isBooked, blocked: false });
    current += intervalMinutes;
  }
  return slots;
}

export const BOOKED_TIMES_TODAY = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:30'];

export const BARBER_STATS = {
  todayAppointments: 6,
  completedToday: 2,
  totalClients: 347,
  attendanceRate: 94,
  freeSlots: 4,
  monthRevenue: 8450,
};

export const BARBERSHOP_LIST: Barbershop[] = [
  MOCK_BARBERSHOP,
  {
    id: 'bs_002',
    name: 'Studio Black Gold',
    address: 'Av. Paulista, 800 – Bela Vista, São Paulo – SP',
    phone: '(11) 3333-4444',
    whatsapp: '(11) 99888-7766',
    description: 'Barbearia moderna no coração de São Paulo.',
    rating: 4.7,
    reviewCount: 218,
    photo: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=800',
    workingHours: { start: '09:00', end: '20:00' },
    services: [
      { id: 'sv_a', name: 'Corte Masculino', duration: 30, price: 50 },
      { id: 'sv_b', name: 'Barba', duration: 30, price: 40 },
      { id: 'sv_c', name: 'Corte + Barba', duration: 60, price: 85 },
    ],
  },
  {
    id: 'bs_003',
    name: 'The Gentlemen\'s Cut',
    address: 'Rua Oscar Freire, 456 – Jardins, São Paulo – SP',
    phone: '(11) 2222-3333',
    whatsapp: '(11) 98765-0000',
    description: 'Para o homem moderno que exige o melhor.',
    rating: 4.8,
    reviewCount: 156,
    photo: 'https://images.unsplash.com/photo-1521490683712-35a1cb235d1c?w=800',
    workingHours: { start: '10:00', end: '19:00' },
    services: [
      { id: 'sv_x', name: 'Corte Clássico', duration: 45, price: 55 },
      { id: 'sv_y', name: 'Barba Tradicional', duration: 30, price: 45 },
    ],
  },
];
