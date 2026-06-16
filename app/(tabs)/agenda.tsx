import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useBarberAppointments, useClientAppointments } from '@/hooks/useAppointments';
import { AppointmentCard } from '@/components/feature/AppointmentCard';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { AppointmentStatus } from '@/constants/mock-data';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function getDayRange() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i - 2);
    return {
      label: DAYS[d.getDay()],
      day: d.getDate(),
      isToday: i === 2,
      date: d.toISOString().split('T')[0],
    };
  });
}

const FILTER_OPTIONS: { label: string; value: AppointmentStatus | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Agendado', value: 'booked' },
  { label: 'Confirmado', value: 'confirmed' },
  { label: 'Concluído', value: 'done' },
  { label: 'Cancelado', value: 'cancelled' },
];

export default function AgendaTab() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const isBarber = user?.role === 'barber';

  const barber = useBarberAppointments();
  const client = useClientAppointments();

  const [selectedDay, setSelectedDay] = useState(2);
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'all'>('all');
  const days = getDayRange();

  const allAppts = isBarber ? barber.appointments : client.appointments;
  const filtered = allAppts.filter(a => {
    const statusMatch = filterStatus === 'all' || a.status === filterStatus;
    return statusMatch;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>{isBarber ? 'Agenda' : 'Meus Agendamentos'}</Text>
        <Pressable style={styles.addBtn}>
          <MaterialIcons name={isBarber ? 'block' : 'add'} size={20} color={Colors.primary} />
        </Pressable>
      </View>

      {/* Calendar strip */}
      <View style={styles.calendarStrip}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.calendarContent}
        >
          {days.map((d, i) => (
            <Pressable
              key={i}
              style={[styles.dayBtn, selectedDay === i && styles.dayBtnActive]}
              onPress={() => setSelectedDay(i)}
            >
              <Text style={[styles.dayLabel, selectedDay === i && styles.dayLabelActive]}>
                {d.label}
              </Text>
              <Text style={[styles.dayNum, selectedDay === i && styles.dayNumActive]}>
                {d.day}
              </Text>
              {d.isToday ? (
                <View style={[styles.todayDot, selectedDay === i && styles.todayDotActive]} />
              ) : null}
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Filter chips */}
      <View style={styles.filterWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {FILTER_OPTIONS.map(opt => (
            <Pressable
              key={opt.value}
              style={[
                styles.filterChip,
                filterStatus === opt.value && styles.filterChipActive,
              ]}
              onPress={() => setFilterStatus(opt.value)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterStatus === opt.value && styles.filterChipTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Appointments */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="event-busy" size={40} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Sem agendamentos</Text>
            <Text style={styles.emptyText}>
              {isBarber
                ? 'Nenhum agendamento para este período.'
                : 'Você não tem agendamentos. Que tal marcar um horário?'}
            </Text>
          </View>
        ) : (
          <View style={styles.appointmentList}>
            {filtered.map(appt => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                onStatusChange={isBarber ? barber.updateStatus : undefined}
                showActions={isBarber}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  calendarStrip: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingBottom: Spacing.md,
  },
  calendarContent: {
    paddingHorizontal: Spacing.lg,
    gap: 8,
  },
  dayBtn: {
    width: 52,
    height: 68,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  dayBtnActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  dayLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textMuted },
  dayLabelActive: { color: Colors.primary },
  dayNum: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  dayNumActive: { color: Colors.primary },
  todayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.textMuted },
  todayDotActive: { backgroundColor: Colors.primary },

  filterWrap: { paddingVertical: Spacing.sm },
  filterContent: { paddingHorizontal: Spacing.lg, gap: 8 },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  filterChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.primary },

  list: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl },

  appointmentList: { gap: Spacing.sm, paddingTop: Spacing.sm },

  empty: { alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.md },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
});
