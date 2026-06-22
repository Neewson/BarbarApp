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
import { useBarberAppointments } from '@/hooks/useAppointments';
import { AppointmentCard } from '@/components/feature/AppointmentCard';
import { MetricCard } from '@/components/feature/MetricCard';
import { router } from 'expo-router';
import { BARBER_STATS, MOCK_BARBERSHOP } from '@/constants/mock-data';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '@/constants/theme';

export default function BarberDashboard() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getTodayAppointments, updateStatus } = useBarberAppointments();
  const todayAppts = getTodayAppointments();
  const nextAppt = todayAppts.find(a => a.status === 'booked' || a.status === 'confirmed');

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
          <Pressable style={styles.notifBtn}>
            <MaterialIcons name="notifications-none" size={24} color={Colors.textPrimary} />
            <View style={styles.notifDot} />
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
        {/* Shop Info */}
        <Pressable style={styles.shopCard} onPress={() => router.push('/barber-shop')}>
          <View style={styles.shopCardLeft}>
            <View style={styles.shopIconWrap}>
              <MaterialIcons name="store" size={22} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.shopName}>{MOCK_BARBERSHOP.name}</Text>
              <View style={styles.shopStatus}>
                <View style={styles.onlineDot} />
                <Text style={styles.shopStatusText}>Aberto agora</Text>
              </View>
            </View>
          </View>
          <View style={styles.shopCardRight}>
            <View style={styles.ratingWrap}>
              <MaterialIcons name="star" size={14} color={Colors.primary} />
              <Text style={styles.ratingText}>{MOCK_BARBERSHOP.rating}</Text>
            </View>
            <View style={styles.editShopBtn}>
              <MaterialIcons name="edit" size={14} color={Colors.primary} />
              <Text style={styles.editShopBtnText}>Editar</Text>
            </View>
          </View>
        </Pressable>

        {/* Metrics */}
        <Text style={styles.sectionTitle}>Hoje</Text>
        <View style={styles.metricsRow}>
          <MetricCard
            label="Agendamentos"
            value={BARBER_STATS.todayAppointments}
            icon="event"
            color={Colors.info}
          />
          <MetricCard
            label="Concluídos"
            value={BARBER_STATS.completedToday}
            icon="check-circle"
            color={Colors.success}
          />
        </View>
        <View style={styles.metricsRow}>
          <MetricCard
            label="Livres"
            value={BARBER_STATS.freeSlots}
            icon="schedule"
            color={Colors.primary}
            trend={`+${BARBER_STATS.freeSlots} slots`}
          />
          <MetricCard
            label="Comparecimento"
            value={`${BARBER_STATS.attendanceRate}%`}
            icon="trending-up"
            color={Colors.success}
            trend="Excelente"
          />
        </View>

        {/* Revenue card */}
        <View style={styles.revenueCard}>
          <View>
            <Text style={styles.revenueLabel}>Receita do mês</Text>
            <Text style={styles.revenueValue}>
              R$ {BARBER_STATS.monthRevenue.toLocaleString('pt-BR')}
            </Text>
          </View>
          <View style={styles.revenueIcon}>
            <MaterialIcons name="attach-money" size={28} color={Colors.primary} />
          </View>
        </View>

        {/* Next appointment */}
        {nextAppt ? (
          <View>
            <Text style={styles.sectionTitle}>Próximo Atendimento</Text>
            <View style={styles.nextCard}>
              <View style={styles.nextTime}>
                <Text style={styles.nextTimeText}>{nextAppt.time}</Text>
                <Text style={styles.nextTimeLabel}>horário</Text>
              </View>
              <View style={styles.nextInfo}>
                <Text style={styles.nextName}>{nextAppt.clientName}</Text>
                <Text style={styles.nextService}>{nextAppt.service}</Text>
                <Text style={styles.nextPhone}>{nextAppt.clientPhone}</Text>
              </View>
              <Pressable
                style={styles.startBtn}
                onPress={() => updateStatus(nextAppt.id, 'in_progress')}
              >
                <MaterialIcons name="play-arrow" size={20} color={Colors.textInverse} />
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Today's agenda */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Agenda do Dia</Text>
          <Text style={styles.sectionCount}>{todayAppts.length} agendamentos</Text>
        </View>
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
    paddingBottom: Spacing.md,
    paddingTop: Spacing.sm,
  },
  headerLeft: {},
  greeting: { fontSize: FontSize.sm, color: Colors.textSecondary },
  userName: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  notifBtn: { position: 'relative', padding: 4 },
  notifDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.background,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.md },

  shopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.md,
  },
  shopCardLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  shopIconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  shopStatus: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  shopStatusText: { fontSize: FontSize.xs, color: Colors.success, fontWeight: FontWeight.medium },
  shopCardRight: { alignItems: 'flex-end', gap: 6 },
  ratingWrap: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  editShopBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
  },
  editShopBtnText: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.primary },

  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionCount: { fontSize: FontSize.sm, color: Colors.textSecondary },

  metricsRow: { flexDirection: 'row', gap: Spacing.sm },

  revenueCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.accentLight,
    ...Shadow.md,
  },
  revenueLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', fontWeight: FontWeight.medium },
  revenueValue: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 4 },
  revenueIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  nextCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface2,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadow.gold,
  },
  nextTime: {
    alignItems: 'center',
    minWidth: 52,
    paddingRight: Spacing.md,
    borderRightWidth: 1,
    borderRightColor: Colors.borderLight,
  },
  nextTimeText: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.primary },
  nextTimeLabel: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },
  nextInfo: { flex: 1, gap: 3 },
  nextName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  nextService: { fontSize: FontSize.sm, color: Colors.textSecondary },
  nextPhone: { fontSize: FontSize.xs, color: Colors.textMuted },
  startBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  appointmentList: { gap: Spacing.sm },
});
