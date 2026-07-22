import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAlert } from '@/template';
import { useAuth } from '@/hooks/useAuth';
import { useAvailableSlots } from '@/hooks/useAppointments';
import { createAppointment, fetchAvailableSlots } from '@/services/appointmentService';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '@/constants/theme';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const SERVICES = ['Corte', 'Corte + Barba', 'Barba', 'Sobrancelha', 'Hidratação', 'Coloração', 'Corte Infantil'];
const NOTIF_OPTIONS = [
  { id: 'push', icon: 'notifications' as const, label: 'Push Notification' },
  { id: 'whatsapp', icon: 'chat' as const, label: 'WhatsApp' },
  { id: 'sms', icon: 'sms' as const, label: 'SMS' },
  { id: 'email', icon: 'email' as const, label: 'E-mail' },
];

function buildDateRange(days = 30) {
  const today = new Date();
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      date: d.toISOString().split('T')[0],
      day: d.getDate(),
      dayLabel: DAYS[d.getDay()],
      month: MONTHS[d.getMonth()],
      fullLabel: d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }),
      isToday: i === 0,
    };
  });
}

const DATE_RANGE = buildDateRange(30);
type Step = 'service' | 'date' | 'time' | 'confirm';
const STEPS: Step[] = ['service', 'date', 'time', 'confirm'];
const STEP_LABELS = ['Serviço', 'Data', 'Horário', 'Confirmar'];

export default function BookingScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { user } = useAuth();
  const params = useLocalSearchParams<{ shopId: string; shopName: string; shopAddress: string }>();

  const shopId = params.shopId ?? '';
  const shopName = params.shopName ?? 'Barbearia';
  const shopAddress = params.shopAddress ?? '';

  const [step, setStep] = useState<Step>('service');
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedDate, setSelectedDate] = useState(DATE_RANGE[0].date);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notifMethods, setNotifMethods] = useState<string[]>(['push']);
  const [saving, setSaving] = useState(false);

  const { slots, loading: slotsLoading, refresh: refreshSlots } = useAvailableSlots(
    shopId || undefined,
    selectedDate
  );

  useEffect(() => { setSelectedTime(null); }, [selectedDate]);

  const stepIndex = STEPS.indexOf(step);

  const handleBack = () => {
    if (stepIndex === 0) router.back();
    else setStep(STEPS[stepIndex - 1]);
  };

  const handleNext = () => {
    if (step === 'service') {
      if (!selectedService) { showAlert('Atenção', 'Selecione um serviço para continuar.'); return; }
    }
    if (step === 'time') {
      if (!selectedTime) { showAlert('Atenção', 'Selecione um horário para continuar.'); return; }
    }
    if (step === 'confirm') { handleConfirm(); return; }
    setStep(STEPS[stepIndex + 1]);
  };

  const handleConfirm = async () => {
    if (!user || !shopId) return;
    setSaving(true);
    try {
      // We need barber_id — fetch the shop to get owner_id
      const { getSupabaseClient } = await import('@/template');
      const supabase = getSupabaseClient();
      const { data: shopData } = await supabase
        .from('barbershops')
        .select('owner_id')
        .eq('id', shopId)
        .single();

      if (!shopData) throw new Error('Barbearia não encontrada');

      await createAppointment({
        barbershop_id: shopId,
        barber_id: shopData.owner_id,
        client_id: user.id,
        client_name: user.name ?? user.email,
        client_phone: user.phone ?? '',
        client_whatsapp: user.whatsapp ?? user.phone ?? '',
        service: selectedService!,
        appointment_date: selectedDate,
        appointment_time: selectedTime!,
        status: 'booked',
      });

      showAlert(
        'Agendamento confirmado!',
        `Seu horário às ${selectedTime} foi reservado com sucesso.`,
        [{ text: 'Ok', onPress: () => router.replace('/(tabs)') }]
      );
    } catch (err: any) {
      showAlert('Erro ao confirmar', err?.message ?? 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const toggleNotif = (id: string) =>
    setNotifMethods(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);

  const availableCount = slots.filter(s => s.available).length;
  const currentDate = DATE_RANGE[selectedDateIdx];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backBtn} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Agendar Serviço</Text>
        <Pressable onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name="close" size={22} color={Colors.textMuted} />
        </Pressable>
      </View>

      {/* Shop banner */}
      <View style={styles.shopBanner}>
        <View style={styles.shopIconWrap}>
          <MaterialIcons name="storefront" size={20} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.shopName} numberOfLines={1}>{shopName}</Text>
          <Text style={styles.shopAddr} numberOfLines={1}>{shopAddress}</Text>
        </View>
      </View>

      {/* Progress steps */}
      <View style={styles.progress}>
        {STEPS.map((s, i) => (
          <View key={s} style={styles.progressItem}>
            <View style={[
              styles.progressDot,
              i < stepIndex && styles.progressDotDone,
              i === stepIndex && styles.progressDotActive,
            ]}>
              {i < stepIndex ? (
                <MaterialIcons name="check" size={12} color={Colors.textInverse} />
              ) : (
                <Text style={[styles.progressDotText, i === stepIndex && styles.progressDotTextActive]}>
                  {i + 1}
                </Text>
              )}
            </View>
            <Text style={[styles.progressLabel, i === stepIndex && styles.progressLabelActive]}>
              {STEP_LABELS[i]}
            </Text>
            {i < STEPS.length - 1 ? (
              <View style={[styles.progressLine, i < stepIndex && styles.progressLineDone]} />
            ) : null}
          </View>
        ))}
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>

        {/* ── Step: Service ── */}
        {step === 'service' ? (
          <View style={styles.stepWrap}>
            <Text style={styles.stepTitle}>Escolha o Serviço</Text>
            <View style={styles.serviceList}>
              {SERVICES.map(s => {
                const isActive = selectedService === s;
                return (
                  <Pressable
                    key={s}
                    style={[styles.serviceCard, isActive && styles.serviceCardActive]}
                    onPress={() => setSelectedService(s)}
                  >
                    <View style={[styles.serviceIcon, isActive && styles.serviceIconActive]}>
                      <MaterialIcons name="content-cut" size={20} color={isActive ? Colors.textInverse : Colors.primary} />
                    </View>
                    <Text style={[styles.serviceName, isActive && styles.serviceNameActive]}>{s}</Text>
                    {isActive ? (
                      <MaterialIcons name="check-circle" size={20} color={Colors.primary} style={{ marginLeft: 'auto' }} />
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* ── Step: Date ── */}
        {step === 'date' ? (
          <View style={styles.stepWrap}>
            <Text style={styles.stepTitle}>Escolha a Data</Text>
            <View style={styles.dateGrid}>
              {DATE_RANGE.map((d, i) => {
                const isActive = selectedDateIdx === i;
                return (
                  <Pressable
                    key={d.date}
                    style={[styles.dateCard, isActive && styles.dateCardActive, d.isToday && !isActive && styles.dateCardToday]}
                    onPress={() => { setSelectedDateIdx(i); setSelectedDate(d.date); }}
                  >
                    <Text style={[styles.dateDayLabel, isActive && styles.dateLabelActive]}>{d.dayLabel}</Text>
                    <Text style={[styles.dateDayNum, isActive && styles.dateLabelActive]}>{d.day}</Text>
                    <Text style={[styles.dateMonth, isActive && styles.dateLabelActive]}>{d.month}</Text>
                    {d.isToday ? (
                      <Text style={[styles.todayPill, isActive && styles.todayPillActive]}>hoje</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ) : null}

        {/* ── Step: Time ── */}
        {step === 'time' ? (
          <View style={styles.stepWrap}>
            <Text style={styles.stepTitle}>Escolha o Horário</Text>
            <Text style={styles.stepSub}>{currentDate.fullLabel}</Text>

            <View style={styles.slotsHeader}>
              {slotsLoading ? (
                <ActivityIndicator size={16} color={Colors.primary} />
              ) : (
                <Text style={styles.slotsCount}>
                  {availableCount} horário{availableCount !== 1 ? 's' : ''} disponível{availableCount !== 1 ? 'is' : ''}
                </Text>
              )}
              <Pressable onPress={refreshSlots} hitSlop={8}>
                <MaterialIcons name="refresh" size={18} color={Colors.textMuted} />
              </Pressable>
            </View>

            {slotsLoading ? (
              <View style={styles.slotsLoading}>
                <ActivityIndicator color={Colors.primary} />
                <Text style={styles.slotsLoadingText}>Verificando disponibilidade...</Text>
              </View>
            ) : slots.length === 0 ? (
              <View style={styles.noSlots}>
                <MaterialIcons name="event-busy" size={36} color={Colors.textMuted} />
                <Text style={styles.noSlotsTitle}>Sem horários</Text>
                <Text style={styles.noSlotsText}>Nenhum horário disponível nesta data.</Text>
              </View>
            ) : (
              <View style={styles.timeGrid}>
                {slots.map(slot => {
                  const isActive = selectedTime === slot.time;
                  return (
                    <Pressable
                      key={slot.time}
                      style={[
                        styles.timeSlot,
                        !slot.available && styles.timeSlotBusy,
                        isActive && styles.timeSlotActive,
                      ]}
                      onPress={() => slot.available && setSelectedTime(slot.time)}
                      disabled={!slot.available}
                    >
                      <Text style={[
                        styles.timeSlotText,
                        !slot.available && styles.timeSlotTextBusy,
                        isActive && styles.timeSlotTextActive,
                      ]}>
                        {slot.time}
                      </Text>
                      {!slot.available ? (
                        <MaterialIcons name="block" size={10} color={Colors.textMuted} />
                      ) : null}
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}

        {/* ── Step: Confirm ── */}
        {step === 'confirm' ? (
          <View style={styles.stepWrap}>
            <Text style={styles.stepTitle}>Confirmar Agendamento</Text>

            <View style={styles.confirmCard}>
              <View style={styles.confirmRow}>
                <View style={styles.confirmIconWrap}>
                  <MaterialIcons name="content-cut" size={18} color={Colors.primary} />
                </View>
                <View style={styles.confirmInfo}>
                  <Text style={styles.confirmLabel}>Serviço</Text>
                  <Text style={styles.confirmValue}>{selectedService}</Text>
                </View>
              </View>
              <View style={styles.confirmDivider} />
              <View style={styles.confirmRow}>
                <View style={styles.confirmIconWrap}>
                  <MaterialIcons name="event" size={18} color={Colors.primary} />
                </View>
                <View style={styles.confirmInfo}>
                  <Text style={styles.confirmLabel}>Data</Text>
                  <Text style={styles.confirmValue}>{currentDate.fullLabel}</Text>
                </View>
              </View>
              <View style={styles.confirmDivider} />
              <View style={styles.confirmRow}>
                <View style={styles.confirmIconWrap}>
                  <MaterialIcons name="schedule" size={18} color={Colors.primary} />
                </View>
                <View style={styles.confirmInfo}>
                  <Text style={styles.confirmLabel}>Horário</Text>
                  <Text style={styles.confirmValue}>{selectedTime}</Text>
                </View>
              </View>
              <View style={styles.confirmDivider} />
              <View style={styles.confirmRow}>
                <View style={styles.confirmIconWrap}>
                  <MaterialIcons name="storefront" size={18} color={Colors.primary} />
                </View>
                <View style={styles.confirmInfo}>
                  <Text style={styles.confirmLabel}>Barbearia</Text>
                  <Text style={styles.confirmValue}>{shopName}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.notifTitle}>Receber lembretes por:</Text>
            {NOTIF_OPTIONS.map(n => {
              const isActive = notifMethods.includes(n.id);
              return (
                <Pressable
                  key={n.id}
                  style={[styles.notifOption, isActive && styles.notifOptionActive]}
                  onPress={() => toggleNotif(n.id)}
                >
                  <MaterialIcons name={n.icon} size={20} color={isActive ? Colors.primary : Colors.textMuted} />
                  <Text style={[styles.notifLabel, isActive && styles.notifLabelActive]}>{n.label}</Text>
                  {isActive ? (
                    <MaterialIcons name="check-circle" size={20} color={Colors.primary} style={{ marginLeft: 'auto' }} />
                  ) : null}
                </Pressable>
              );
            })}

            <View style={styles.reminderBanner}>
              <MaterialIcons name="info-outline" size={16} color={Colors.primary} />
              <Text style={styles.reminderText}>
                Lembretes automáticos: 24h antes, 1h antes e 30min antes.
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={[styles.nextBtn, saving && styles.nextBtnDisabled]}
          onPress={handleNext}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size={20} color={Colors.textInverse} />
          ) : (
            <MaterialIcons
              name={step === 'confirm' ? 'check' : 'arrow-forward'}
              size={20}
              color={Colors.textInverse}
            />
          )}
          <Text style={styles.nextBtnText}>
            {saving ? 'Confirmando...' : step === 'confirm' ? 'Confirmar Agendamento' : 'Continuar'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radius.md,
    backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },

  shopBanner: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    marginHorizontal: Spacing.lg, backgroundColor: Colors.surface2,
    borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.sm,
  },
  shopIconWrap: {
    width: 40, height: 40, borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center',
  },
  shopName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  shopAddr: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },

  progress: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderBottomColor: Colors.border, gap: 0,
  },
  progressItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  progressDot: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  progressDotActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  progressDotDone: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  progressDotText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted },
  progressDotTextActive: { color: Colors.primary },
  progressLabel: { fontSize: 10, color: Colors.textMuted, fontWeight: FontWeight.medium },
  progressLabelActive: { color: Colors.primary, fontWeight: FontWeight.semibold },
  progressLine: { flex: 1, height: 1, backgroundColor: Colors.border, marginHorizontal: 2 },
  progressLineDone: { backgroundColor: Colors.primary },

  body: { flex: 1 },
  bodyContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.xl, gap: Spacing.md },

  stepWrap: { gap: Spacing.md },
  stepTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  stepSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: -8 },

  serviceList: { gap: Spacing.sm },
  serviceCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border, padding: Spacing.md, ...Shadow.sm,
  },
  serviceCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  serviceIcon: {
    width: 44, height: 44, borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center',
  },
  serviceIconActive: { backgroundColor: Colors.primary },
  serviceName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary, flex: 1 },
  serviceNameActive: { color: Colors.primary },

  dateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dateCard: {
    width: 56, paddingVertical: 10, alignItems: 'center', gap: 2,
    backgroundColor: Colors.surface, borderRadius: Radius.lg, borderWidth: 1, borderColor: Colors.border,
  },
  dateCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dateCardToday: { borderColor: Colors.primaryLight },
  dateDayLabel: { fontSize: 10, fontWeight: FontWeight.medium, color: Colors.textMuted },
  dateDayNum: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  dateMonth: { fontSize: 10, color: Colors.textMuted },
  dateLabelActive: { color: Colors.textInverse },
  todayPill: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.primary },
  todayPillActive: { color: Colors.textInverse },

  slotsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  slotsCount: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  slotsLoading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  slotsLoadingText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  noSlots: { alignItems: 'center', paddingVertical: Spacing.xl, gap: 10 },
  noSlotsTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  noSlotsText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeSlot: {
    paddingVertical: 12, paddingHorizontal: 16, borderRadius: Radius.md,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', gap: 3,
  },
  timeSlotBusy: { opacity: 0.35 },
  timeSlotActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  timeSlotText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  timeSlotTextBusy: { color: Colors.textMuted },
  timeSlotTextActive: { color: Colors.primary },

  confirmCard: {
    backgroundColor: Colors.surface2, borderRadius: Radius.xl,
    borderWidth: 1, borderColor: Colors.borderLight, padding: Spacing.lg,
  },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  confirmIconWrap: {
    width: 38, height: 38, borderRadius: Radius.sm,
    backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: `${Colors.primary}30`,
  },
  confirmInfo: { flex: 1 },
  confirmLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
  confirmValue: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginTop: 2 },
  confirmDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },

  notifTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  notifOption: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md, borderRadius: Radius.lg,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  notifOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  notifLabel: { fontSize: FontSize.base, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  notifLabelActive: { color: Colors.primary },
  reminderBanner: {
    flexDirection: 'row', gap: 8, backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: `${Colors.primary}30`,
  },
  reminderText: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },

  footer: {
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md,
    borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.background,
  },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 16, ...Shadow.gold,
  },
  nextBtnDisabled: { opacity: 0.7 },
  nextBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textInverse },
});
