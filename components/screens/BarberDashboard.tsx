import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useBarberAppointments, useBarberMetrics, useBarberShop } from '@/hooks/useAppointments';
import { Appointment } from '@/services/appointmentService';
import { AppointmentCard } from '@/components/feature/AppointmentCard';
import { router } from 'expo-router';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '@/constants/theme';

const TODAY = new Date().toISOString().split('T')[0];

function MetricTile({
  label,
  value,
  icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  sub?: string;
}) {
  return (
    <View style={[tile.wrap, { borderColor: `${color}30` }]}>
      <View style={[tile.iconWrap, { backgroundColor: `${color}18` }]}>
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <Text style={tile.value}>{value}</Text>
      <Text style={tile.label}>{label}</Text>
      {sub ? <Text style={[tile.sub, { color }]}>{sub}</Text> : null}
    </View>
  );
}

const tile = StyleSheet.create({
  wrap: {
    flex: 1, backgroundColor: Colors.surface,
    borderRadius: Radius.lg, borderWidth: 1,
    padding: Spacing.md, gap: 4, ...Shadow.sm,
  },
  iconWrap: {
    width: 36, height: 36, borderRadius: Radius.sm,
    alignItems: 'center', justifyContent: 'center', marginBottom: 2,
  },
  value: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary },
  label: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  sub: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
});

export default function BarberDashboard() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { appointments: todayAppts, updateStatus } = useBarberAppointments(user?.id, TODAY);
  const { metrics, loading: metricsLoading } = useBarberMetrics(user?.id, TODAY);
  const { shop } = useBarberShop(user?.id);

  const nextAppt = todayAppts.find((a: Appointment) => a.status === 'booked' || a.status === 'confirmed');

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text style={styles.userName}>{user?.name?.split(' ')[0]}</Text>
        </View>
        <View style={styles.headerRight}>
          <Pressable
            style={styles.addBtn}
            onPress={() => router.push('/new-appointment')}
            hitSlop={4}
          >
            <MaterialIcons name="add" size={20} color={Colors.textInverse} />
          </Pressable>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Shop card */}
        <Pressable style={styles.shopCard} onPress={() => router.push('/barber-shop')}>
          <View style={styles.shopCardLeft}>
            <View style={styles.shopIconWrap}>
              <MaterialIcons name="storefront" size={22} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.shopName}>{shop?.name ?? 'Minha Barbearia'}</Text>
              {shop ? (
                <View style={styles.shopStatus}>
                  <View style={styles.onlineDot} />
                  <Text style={styles.shopStatusText}>
                    {shop.work_start} – {shop.work_end} · {shop.slot_interval}min
                  </Text>
                </View>
              ) : (
                <Text style={styles.shopSetupText}>Toque para cadastrar</Text>
              )}
            </View>
          </View>
          <View style={styles.editShopBtn}>
            <MaterialIcons name="edit" size={14} color={Colors.primary} />
            <Text style={styles.editShopBtnText}>Editar</Text>
          </View>
        </Pressable>

        {/* Metrics */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Hoje</Text>
          {metricsLoading ? <ActivityIndicator size={14} color={Colors.primary} /> : null}
        </View>

        <View style={styles.metricsRow}>
          <MetricTile
            label="Agendamentos"
            value={metrics.totalToday}
            icon="event"
            color={Colors.info}
          />
          <MetricTile
            label="Concluídos"
            value={metrics.completedToday}
            icon="check-circle"
            color={Colors.success}
          />
        </View>
        <View style={styles.metricsRow}>
          <MetricTile
            label="Horários livres"
            value={metrics.freeSlots}
            icon="schedule"
            color={Colors.primary}
            sub={metrics.totalSlots > 0 ? `de ${metrics.totalSlots} total` : undefined}
          />
          <MetricTile
            label="Comparecimento"
            value={`${metrics.attendanceRate}%`}
            icon="trending-up"
            color={metrics.attendanceRate >= 80 ? Colors.success : Colors.warning}
            sub={metrics.attendanceRate >= 80 ? 'Excelente' : 'Regular'}
          />
        </View>

        {/* Next appointment */}
        {nextAppt ? (
          <>
            <Text style={styles.sectionTitle}>Próximo Atendimento</Text>
            <View style={styles.nextCard}>
              <View style={styles.nextTime}>
                <Text style={styles.nextTimeText}>{nextAppt.appointment_time}</Text>
                <Text style={styles.nextTimeLabel}>horário</Text>
              </View>
              <View style={styles.nextInfo}>
                <Text style={styles.nextName}>{nextAppt.client_name}</Text>
                <Text style={styles.nextService}>{nextAppt.service}</Text>
                {nextAppt.client_phone ? (
                  <Text style={styles.nextPhone}>{nextAppt.client_phone}</Text>
                ) : null}
              </View>
              <Pressable
                style={styles.startBtn}
                onPress={() => updateStatus(nextAppt.id, 'in_progress')}
              >
                <MaterialIcons name="play-arrow" size={20} color={Colors.textInverse} />
              </Pressable>
            </View>
          </>
        ) : null}

        {/* Today's agenda */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Agenda do Dia</Text>
          <View style={styles.sectionActions}>
            <Text style={styles.sectionCount}>{todayAppts.length} agendamentos</Text>
            <Pressable
              style={styles.newApptBtn}
              onPress={() => router.push('/new-appointment')}
            >
              <MaterialIcons name="add" size={16} color={Colors.primary} />
              <Text style={styles.newApptBtnText}>Novo</Text>
            </Pressable>
          </View>
        </View>

        {todayAppts.length === 0 ? (
          <View style={styles.emptyDay}>
            <MaterialIcons name="event-available" size={36} color={Colors.textMuted} />
            <Text style={styles.emptyDayTitle}>Dia livre</Text>
            <Text style={styles.emptyDayText}>Nenhum agendamento para hoje.</Text>
            <Pressable style={styles.addFirstBtn} onPress={() => router.push('/new-appointment')}>
              <MaterialIcons name="add" size={18} color={Colors.textInverse} />
              <Text style={styles.addFirstBtnText}>Criar agendamento</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.appointmentList}>
            {todayAppts.slice(0, 5).map(appt => (
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, paddingTop: Spacing.sm,
  },
  headerLeft: {},
  greeting: { fontSize: FontSize.sm, color: Colors.textSecondary },
  userName: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    ...Shadow.gold,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.primaryMuted, borderWidth: 2, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.md },

  shopCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.borderLight, padding: Spacing.md,
  },
  shopCardLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  shopIconWrap: {
    width: 44, height: 44, borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted, borderWidth: 1, borderColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  shopName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  shopStatus: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  shopStatusText: { fontSize: FontSize.xs, color: Colors.success, fontWeight: FontWeight.medium },
  shopSetupText: { fontSize: FontSize.xs, color: Colors.primary, marginTop: 2, fontWeight: FontWeight.medium },
  editShopBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryMuted, borderRadius: Radius.full,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: `${Colors.primary}40`,
  },
  editShopBtnText: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.primary },

  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  sectionActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionCount: { fontSize: FontSize.sm, color: Colors.textSecondary },
  newApptBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.primaryMuted, borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: `${Colors.primary}40`,
  },
  newApptBtnText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary },

  metricsRow: { flexDirection: 'row', gap: Spacing.sm },

  nextCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface2, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.primary,
    padding: Spacing.md, gap: Spacing.md, ...Shadow.gold,
  },
  nextTime: {
    alignItems: 'center', minWidth: 52,
    paddingRight: Spacing.md, borderRightWidth: 1, borderRightColor: Colors.borderLight,
  },
  nextTimeText: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.primary },
  nextTimeLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  nextInfo: { flex: 1, gap: 3 },
  nextName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  nextService: { fontSize: FontSize.sm, color: Colors.textSecondary },
  nextPhone: { fontSize: FontSize.xs, color: Colors.textMuted },
  startBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
  },

  emptyDay: {
    alignItems: 'center', paddingVertical: Spacing.xl,
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.border, gap: Spacing.sm,
  },
  emptyDayTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptyDayText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  addFirstBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: 10, paddingHorizontal: 20, marginTop: 4,
  },
  addFirstBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textInverse },

  appointmentList: { gap: Spacing.sm },
});
