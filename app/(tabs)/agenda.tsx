import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useBarberAppointments, useClientAppointments } from '@/hooks/useAppointments';
import { AppointmentCard } from '@/components/feature/AppointmentCard';
import { AppointmentStatus } from '@/services/appointmentService';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '@/constants/theme';

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

const BARBER_FILTERS: { label: string; value: AppointmentStatus | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Agendado', value: 'booked' },
  { label: 'Confirmado', value: 'confirmed' },
  { label: 'Em atend.', value: 'in_progress' },
  { label: 'Concluído', value: 'done' },
  { label: 'Cancelado', value: 'cancelled' },
];

const CLIENT_FILTERS: { label: string; value: AppointmentStatus | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'Agendado', value: 'booked' },
  { label: 'Confirmado', value: 'confirmed' },
  { label: 'Concluído', value: 'done' },
  { label: 'Cancelado', value: 'cancelled' },
];

// ── Barber view ──────────────────────────────────────────────────────────────

function BarberAgenda({ userId }: { userId: string }) {
  const insets = useSafeAreaInsets();
  const days = useMemo(getDayRange, []);
  const [selectedDayIdx, setSelectedDayIdx] = useState(2); // today
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'all'>('all');

  const selectedDate = days[selectedDayIdx].date;
  const { appointments, loading, error, updateStatus, refresh } = useBarberAppointments(userId, selectedDate);

  const filtered = useMemo(() =>
    filterStatus === 'all'
      ? appointments
      : appointments.filter(a => a.status === filterStatus),
  [appointments, filterStatus]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    appointments.forEach(a => { counts[a.status] = (counts[a.status] ?? 0) + 1; });
    return counts;
  }, [appointments]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={styles.title}>Agenda</Text>
          <Text style={styles.subtitle}>
            {days[selectedDayIdx].isToday ? 'Hoje' : days[selectedDayIdx].label + ', ' + days[selectedDayIdx].day} — {appointments.length} agendamentos
          </Text>
        </View>
        <View style={styles.headerActions}>
          {loading ? (
            <ActivityIndicator size={18} color={Colors.primary} />
          ) : (
            <Pressable style={styles.refreshBtn} onPress={refresh} hitSlop={8}>
              <MaterialIcons name="refresh" size={20} color={Colors.primary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Calendar strip */}
      <View style={styles.calendarStrip}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.calendarContent}>
          {days.map((d, i) => {
            const isActive = selectedDayIdx === i;
            return (
              <Pressable
                key={i}
                style={[styles.dayBtn, isActive && styles.dayBtnActive]}
                onPress={() => setSelectedDayIdx(i)}
              >
                <Text style={[styles.dayLabel, isActive && styles.dayLabelActive]}>{d.label}</Text>
                <Text style={[styles.dayNum, isActive && styles.dayNumActive]}>{d.day}</Text>
                {d.isToday ? (
                  <View style={[styles.todayDot, isActive && styles.todayDotActive]} />
                ) : null}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* Summary chips */}
      {appointments.length > 0 ? (
        <View style={styles.summaryRow}>
          {statusCounts['booked'] ? (
            <View style={[styles.summaryChip, { borderColor: Colors.statusBooked }]}>
              <View style={[styles.summaryDot, { backgroundColor: Colors.statusBooked }]} />
              <Text style={[styles.summaryChipText, { color: Colors.statusBooked }]}>{statusCounts['booked']} agendado</Text>
            </View>
          ) : null}
          {statusCounts['confirmed'] ? (
            <View style={[styles.summaryChip, { borderColor: Colors.statusConfirmed }]}>
              <View style={[styles.summaryDot, { backgroundColor: Colors.statusConfirmed }]} />
              <Text style={[styles.summaryChipText, { color: Colors.statusConfirmed }]}>{statusCounts['confirmed']} confirmado</Text>
            </View>
          ) : null}
          {statusCounts['in_progress'] ? (
            <View style={[styles.summaryChip, { borderColor: Colors.statusInProgress }]}>
              <View style={[styles.summaryDot, { backgroundColor: Colors.statusInProgress }]} />
              <Text style={[styles.summaryChipText, { color: Colors.statusInProgress }]}>{statusCounts['in_progress']} em atend.</Text>
            </View>
          ) : null}
          {statusCounts['done'] ? (
            <View style={[styles.summaryChip, { borderColor: Colors.statusDone }]}>
              <View style={[styles.summaryDot, { backgroundColor: Colors.statusDone }]} />
              <Text style={[styles.summaryChipText, { color: Colors.statusDone }]}>{statusCounts['done']} concluído</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Filter chips */}
      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          {BARBER_FILTERS.map(opt => (
            <Pressable
              key={opt.value}
              style={[styles.filterChip, filterStatus === opt.value && styles.filterChipActive]}
              onPress={() => setFilterStatus(opt.value)}
            >
              <Text style={[styles.filterChipText, filterStatus === opt.value && styles.filterChipTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {error ? (
          <View style={styles.errorCard}>
            <MaterialIcons name="error-outline" size={22} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={refresh}>
              <Text style={styles.retryBtnText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : filtered.length === 0 && !loading ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="event-busy" size={40} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Sem agendamentos</Text>
            <Text style={styles.emptyText}>
              {filterStatus !== 'all'
                ? 'Nenhum agendamento com este status neste dia.'
                : 'Nenhum agendamento para este dia.'}
            </Text>
          </View>
        ) : (
          <View style={styles.appointmentList}>
            {filtered.map(appt => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                onStatusChange={updateStatus}
                showActions
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Client view ──────────────────────────────────────────────────────────────

function ClientAgenda({ userId }: { userId: string }) {
  const insets = useSafeAreaInsets();
  const [filterStatus, setFilterStatus] = useState<AppointmentStatus | 'all'>('all');

  const { appointments, loading, error, cancel, refresh } = useClientAppointments(userId);

  const filtered = useMemo(() =>
    filterStatus === 'all'
      ? appointments
      : appointments.filter(a => a.status === filterStatus),
  [appointments, filterStatus]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View>
          <Text style={styles.title}>Meus Agendamentos</Text>
          <Text style={styles.subtitle}>{appointments.length} no total</Text>
        </View>
        <View style={styles.headerActions}>
          {loading ? (
            <ActivityIndicator size={18} color={Colors.primary} />
          ) : (
            <Pressable style={styles.refreshBtn} onPress={refresh} hitSlop={8}>
              <MaterialIcons name="refresh" size={20} color={Colors.primary} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.filterWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
          {CLIENT_FILTERS.map(opt => (
            <Pressable
              key={opt.value}
              style={[styles.filterChip, filterStatus === opt.value && styles.filterChipActive]}
              onPress={() => setFilterStatus(opt.value)}
            >
              <Text style={[styles.filterChipText, filterStatus === opt.value && styles.filterChipTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={refresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      >
        {error ? (
          <View style={styles.errorCard}>
            <MaterialIcons name="error-outline" size={22} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable style={styles.retryBtn} onPress={refresh}>
              <Text style={styles.retryBtnText}>Tentar novamente</Text>
            </Pressable>
          </View>
        ) : filtered.length === 0 && !loading ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <MaterialIcons name="event-busy" size={40} color={Colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>Sem agendamentos</Text>
            <Text style={styles.emptyText}>
              Você ainda não tem agendamentos. Que tal marcar um horário?
            </Text>
          </View>
        ) : (
          <View style={styles.appointmentList}>
            {filtered.map(appt => (
              <AppointmentCard
                key={appt.id}
                appointment={appt}
                onStatusChange={(id) => cancel(id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

// ── Root export ──────────────────────────────────────────────────────────────

export default function AgendaTab() {
  const { user } = useAuth();

  if (!user) return null;

  return user.role === 'barber'
    ? <BarberAgenda userId={user.id} />
    : <ClientAgenda userId={user.id} />;
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  refreshBtn: {
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
  calendarContent: { paddingHorizontal: Spacing.lg, gap: 8 },
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
  dayBtnActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  dayLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textMuted },
  dayLabelActive: { color: Colors.primary },
  dayNum: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  dayNumActive: { color: Colors.primary },
  todayDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.textMuted },
  todayDotActive: { backgroundColor: Colors.primary },

  summaryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    gap: 6,
  },
  summaryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    backgroundColor: Colors.surface2,
  },
  summaryDot: { width: 6, height: 6, borderRadius: 3 },
  summaryChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },

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
  filterChipActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  filterChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.primary, fontWeight: FontWeight.semibold },

  list: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  appointmentList: { gap: Spacing.sm },

  errorCard: {
    alignItems: 'center',
    backgroundColor: Colors.errorMuted,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.error,
    padding: Spacing.lg,
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  errorText: { fontSize: FontSize.sm, color: Colors.error, textAlign: 'center' },
  retryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: Radius.full,
    backgroundColor: Colors.errorMuted,
    borderWidth: 1,
    borderColor: Colors.error,
    marginTop: 4,
  },
  retryBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.error },

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
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22, paddingHorizontal: Spacing.lg },
});
