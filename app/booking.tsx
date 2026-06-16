import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAlert } from '@/template';
import { useClientAppointments } from '@/hooks/useAppointments';
import {
  MOCK_BARBERSHOP,
  BOOKED_TIMES_TODAY,
  generateTimeSlots,
  Appointment,
  Service,
} from '@/constants/mock-data';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '@/constants/theme';

const DATES = Array.from({ length: 14 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() + i);
  return {
    date: d.toISOString().split('T')[0],
    day: d.getDate(),
    dayLabel: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][d.getDay()],
    month: d.toLocaleString('pt-BR', { month: 'short' }),
    isToday: i === 0,
  };
});

type Step = 'service' | 'date' | 'time' | 'confirm';

export default function BookingScreen() {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const { addAppointment } = useClientAppointments();

  const [step, setStep] = useState<Step>('service');
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notifMethod, setNotifMethod] = useState<string[]>(['push']);

  const timeSlots = generateTimeSlots('08:00', '18:00', 30, BOOKED_TIMES_TODAY);

  const steps: Step[] = ['service', 'date', 'time', 'confirm'];
  const stepIndex = steps.indexOf(step);

  const handleBack = () => {
    if (stepIndex === 0) {
      router.back();
    } else {
      setStep(steps[stepIndex - 1]);
    }
  };

  const handleNext = () => {
    if (step === 'service' && !selectedService) {
      showAlert('Atenção', 'Selecione um serviço para continuar.');
      return;
    }
    if (step === 'date' && !selectedDate) {
      showAlert('Atenção', 'Selecione uma data para continuar.');
      return;
    }
    if (step === 'time' && !selectedTime) {
      showAlert('Atenção', 'Selecione um horário para continuar.');
      return;
    }
    if (step === 'confirm') {
      confirmBooking();
      return;
    }
    setStep(steps[stepIndex + 1]);
  };

  const confirmBooking = () => {
    const newAppt: Appointment = {
      id: `appt_${Date.now()}`,
      clientName: 'João Silva',
      clientPhone: '(11) 98765-1234',
      clientWhatsapp: '(11) 98765-1234',
      service: selectedService?.name ?? '',
      date: selectedDate ?? '',
      time: selectedTime ?? '',
      status: 'booked',
      barbershopId: MOCK_BARBERSHOP.id,
    };
    addAppointment(newAppt);
    showAlert(
      'Agendamento confirmado!',
      `Seu horário às ${selectedTime} foi reservado com sucesso. Você receberá um lembrete.`,
      [{ text: 'Ok', onPress: () => router.replace('/(tabs)') }]
    );
  };

  const toggleNotif = (method: string) => {
    setNotifMethod(prev =>
      prev.includes(method) ? prev.filter(m => m !== method) : [...prev, method]
    );
  };

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

      {/* Barbershop info */}
      <View style={styles.shopBanner}>
        <View style={styles.shopIconWrap}>
          <MaterialIcons name="store" size={20} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.shopName}>{MOCK_BARBERSHOP.name}</Text>
          <Text style={styles.shopAddr} numberOfLines={1}>{MOCK_BARBERSHOP.address}</Text>
        </View>
        <View style={styles.ratingWrap}>
          <MaterialIcons name="star" size={14} color={Colors.primary} />
          <Text style={styles.ratingText}>{MOCK_BARBERSHOP.rating}</Text>
        </View>
      </View>

      {/* Progress */}
      <View style={styles.progress}>
        {steps.map((s, i) => (
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
            {i < steps.length - 1 ? (
              <View style={[styles.progressLine, i < stepIndex && styles.progressLineDone]} />
            ) : null}
          </View>
        ))}
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent} showsVerticalScrollIndicator={false}>

        {/* Step: Service */}
        {step === 'service' ? (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Escolha o Serviço</Text>
            <View style={styles.serviceList}>
              {MOCK_BARBERSHOP.services.map(service => (
                <Pressable
                  key={service.id}
                  style={[styles.serviceCard, selectedService?.id === service.id && styles.serviceCardActive]}
                  onPress={() => setSelectedService(service)}
                >
                  <View style={styles.serviceLeft}>
                    <View style={[styles.serviceIcon, selectedService?.id === service.id && styles.serviceIconActive]}>
                      <MaterialIcons
                        name="content-cut"
                        size={20}
                        color={selectedService?.id === service.id ? Colors.textInverse : Colors.primary}
                      />
                    </View>
                    <View>
                      <Text style={styles.serviceName}>{service.name}</Text>
                      <Text style={styles.serviceDuration}>{service.duration} min</Text>
                    </View>
                  </View>
                  <View style={styles.serviceRight}>
                    <Text style={styles.servicePrice}>R$ {service.price}</Text>
                    {selectedService?.id === service.id ? (
                      <MaterialIcons name="check-circle" size={20} color={Colors.primary} />
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* Step: Date */}
        {step === 'date' ? (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Escolha a Data</Text>
            <View style={styles.dateGrid}>
              {DATES.map(d => (
                <Pressable
                  key={d.date}
                  style={[
                    styles.dateCard,
                    selectedDate === d.date && styles.dateCardActive,
                    d.isToday && styles.dateCardToday,
                  ]}
                  onPress={() => setSelectedDate(d.date)}
                >
                  <Text style={[styles.dateDayLabel, selectedDate === d.date && styles.dateLabelActive]}>
                    {d.dayLabel}
                  </Text>
                  <Text style={[styles.dateDayNum, selectedDate === d.date && styles.dateLabelActive]}>
                    {d.day}
                  </Text>
                  <Text style={[styles.dateMonth, selectedDate === d.date && styles.dateLabelActive]}>
                    {d.month}
                  </Text>
                  {d.isToday ? (
                    <Text style={[styles.todayLabel, selectedDate === d.date && { color: Colors.textInverse }]}>
                      hoje
                    </Text>
                  ) : null}
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* Step: Time */}
        {step === 'time' ? (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Escolha o Horário</Text>
            <Text style={styles.stepSub}>
              {timeSlots.filter(t => t.available).length} horários disponíveis
            </Text>
            <View style={styles.timeGrid}>
              {timeSlots.map(slot => (
                <Pressable
                  key={slot.time}
                  style={[
                    styles.timeSlot,
                    !slot.available && styles.timeSlotUnavailable,
                    selectedTime === slot.time && styles.timeSlotActive,
                  ]}
                  onPress={() => slot.available && setSelectedTime(slot.time)}
                  disabled={!slot.available}
                >
                  <Text
                    style={[
                      styles.timeSlotText,
                      !slot.available && styles.timeSlotTextUnavailable,
                      selectedTime === slot.time && styles.timeSlotTextActive,
                    ]}
                  >
                    {slot.time}
                  </Text>
                  {!slot.available ? (
                    <MaterialIcons name="block" size={10} color={Colors.textMuted} />
                  ) : null}
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* Step: Confirm */}
        {step === 'confirm' ? (
          <View style={styles.stepContent}>
            <Text style={styles.stepTitle}>Confirmar Agendamento</Text>

            <View style={styles.confirmCard}>
              <View style={styles.confirmRow}>
                <MaterialIcons name="content-cut" size={18} color={Colors.primary} />
                <View style={styles.confirmInfo}>
                  <Text style={styles.confirmLabel}>Serviço</Text>
                  <Text style={styles.confirmValue}>{selectedService?.name}</Text>
                </View>
                <Text style={styles.confirmPrice}>R$ {selectedService?.price}</Text>
              </View>
              <View style={styles.confirmDivider} />
              <View style={styles.confirmRow}>
                <MaterialIcons name="event" size={18} color={Colors.primary} />
                <View style={styles.confirmInfo}>
                  <Text style={styles.confirmLabel}>Data</Text>
                  <Text style={styles.confirmValue}>
                    {selectedDate ? new Date(selectedDate + 'T12:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : ''}
                  </Text>
                </View>
              </View>
              <View style={styles.confirmDivider} />
              <View style={styles.confirmRow}>
                <MaterialIcons name="schedule" size={18} color={Colors.primary} />
                <View style={styles.confirmInfo}>
                  <Text style={styles.confirmLabel}>Horário</Text>
                  <Text style={styles.confirmValue}>{selectedTime}</Text>
                </View>
              </View>
              <View style={styles.confirmDivider} />
              <View style={styles.confirmRow}>
                <MaterialIcons name="timer" size={18} color={Colors.primary} />
                <View style={styles.confirmInfo}>
                  <Text style={styles.confirmLabel}>Duração</Text>
                  <Text style={styles.confirmValue}>{selectedService?.duration} minutos</Text>
                </View>
              </View>
            </View>

            <Text style={styles.notifTitle}>Como deseja receber lembretes?</Text>
            {[
              { id: 'push', icon: 'notifications' as const, label: 'Push Notification' },
              { id: 'whatsapp', icon: 'chat' as const, label: 'WhatsApp' },
              { id: 'sms', icon: 'sms' as const, label: 'SMS' },
              { id: 'email', icon: 'email' as const, label: 'E-mail' },
            ].map(n => (
              <Pressable
                key={n.id}
                style={[styles.notifOption, notifMethod.includes(n.id) && styles.notifOptionActive]}
                onPress={() => toggleNotif(n.id)}
              >
                <MaterialIcons
                  name={n.icon}
                  size={20}
                  color={notifMethod.includes(n.id) ? Colors.primary : Colors.textMuted}
                />
                <Text style={[styles.notifLabel, notifMethod.includes(n.id) && styles.notifLabelActive]}>
                  {n.label}
                </Text>
                {notifMethod.includes(n.id) ? (
                  <MaterialIcons name="check-circle" size={20} color={Colors.primary} style={{ marginLeft: 'auto' }} />
                ) : null}
              </Pressable>
            ))}

            <View style={styles.reminderInfo}>
              <MaterialIcons name="info-outline" size={16} color={Colors.primary} />
              <Text style={styles.reminderText}>
                Lembretes automáticos: 24h antes, 1h antes e 30min antes do horário.
              </Text>
            </View>
          </View>
        ) : null}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          style={styles.nextBtn}
          onPress={handleNext}
        >
          <Text style={styles.nextBtnText}>
            {step === 'confirm' ? 'Confirmar Agendamento' : 'Continuar'}
          </Text>
          <MaterialIcons
            name={step === 'confirm' ? 'check' : 'arrow-forward'}
            size={20}
            color={Colors.textInverse}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { flex: 1, fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },

  shopBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface2,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  shopIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shopName: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  shopAddr: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  ratingWrap: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  ratingText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary },

  progress: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.md,
  },
  progressItem: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressDotActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  progressDotDone: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  progressDotText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textMuted },
  progressDotTextActive: { color: Colors.primary },
  progressLine: { flex: 1, height: 2, backgroundColor: Colors.border, marginHorizontal: 4 },
  progressLineDone: { backgroundColor: Colors.primary },

  body: { flex: 1 },
  bodyContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl },

  stepContent: { gap: Spacing.md },
  stepTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  stepSub: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: -8 },

  serviceList: { gap: Spacing.sm },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    ...Shadow.sm,
  },
  serviceCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  serviceLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  serviceIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceIconActive: { backgroundColor: Colors.primary },
  serviceName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  serviceDuration: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  serviceRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  servicePrice: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.primary },

  dateGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  dateCard: {
    width: '13%',
    minWidth: 48,
    flex: 1,
    maxWidth: 72,
    aspectRatio: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 2,
  },
  dateCardActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  dateCardToday: { borderColor: Colors.primaryLight },
  dateDayLabel: { fontSize: 10, fontWeight: FontWeight.medium, color: Colors.textMuted },
  dateDayNum: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  dateMonth: { fontSize: 10, color: Colors.textMuted },
  dateLabelActive: { color: Colors.textInverse },
  todayLabel: { fontSize: 9, color: Colors.primary, fontWeight: FontWeight.bold },

  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  timeSlot: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    gap: 3,
  },
  timeSlotUnavailable: { backgroundColor: Colors.surface2, opacity: 0.4 },
  timeSlotActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  timeSlotText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  timeSlotTextUnavailable: { color: Colors.textMuted },
  timeSlotTextActive: { color: Colors.primary },

  confirmCard: {
    backgroundColor: Colors.surface2,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
  },
  confirmRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  confirmInfo: { flex: 1 },
  confirmLabel: { fontSize: FontSize.xs, color: Colors.textMuted, fontWeight: FontWeight.medium },
  confirmValue: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginTop: 2 },
  confirmPrice: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary },
  confirmDivider: { height: 1, backgroundColor: Colors.border, marginVertical: Spacing.md },

  notifTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 4 },
  notifOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notifOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryMuted },
  notifLabel: { fontSize: FontSize.base, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  notifLabelActive: { color: Colors.primary },

  reminderInfo: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  reminderText: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },

  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    ...Shadow.gold,
  },
  nextBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textInverse },
});
