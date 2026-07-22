import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAlert } from '@/template';
import { useAuth } from '@/hooks/useAuth';
import { useBarberShop, useAvailableSlots } from '@/hooks/useAppointments';
import { createAppointment } from '@/services/appointmentService';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '@/constants/theme';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

const SERVICES = [
  'Corte',
  'Corte + Barba',
  'Barba',
  'Sobrancelha',
  'Hidratação',
  'Coloração',
  'Corte Infantil',
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
      month: MONTHS_SHORT[d.getMonth()],
      isToday: i === 0,
    };
  });
}

export default function NewAppointmentScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showAlert } = useAlert();

  const { shop, loading: shopLoading } = useBarberShop(user?.id);

  const DATE_RANGE = buildDateRange(30);
  const [selectedDateIdx, setSelectedDateIdx] = useState(0);
  const [selectedDate, setSelectedDate] = useState(DATE_RANGE[0].date);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState(SERVICES[0]);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientWhatsapp, setClientWhatsapp] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { slots, loading: slotsLoading, refresh: refreshSlots } = useAvailableSlots(shop?.id, selectedDate);

  // Reset time when date changes
  useEffect(() => { setSelectedTime(null); }, [selectedDate]);

  const handleSelectDate = (idx: number) => {
    setSelectedDateIdx(idx);
    setSelectedDate(DATE_RANGE[idx].date);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!clientName.trim()) e.clientName = 'Nome é obrigatório';
    if (!clientPhone.trim()) e.clientPhone = 'Telefone é obrigatório';
    if (!selectedTime) e.time = 'Selecione um horário';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!shop || !user) return;

    setSaving(true);
    try {
      await createAppointment({
        barbershop_id: shop.id,
        barber_id: user.id,
        client_id: user.id, // barber creating on behalf — use barber id as placeholder; real client booking sets real client_id
        client_name: clientName.trim(),
        client_phone: clientPhone.trim(),
        client_whatsapp: clientWhatsapp.trim() || clientPhone.trim(),
        service: selectedService,
        appointment_date: selectedDate,
        appointment_time: selectedTime!,
        status: 'booked',
        notes: notes.trim() || undefined,
      });

      showAlert(
        'Agendamento criado!',
        `${clientName} — ${selectedDate} às ${selectedTime}`,
        [{ text: 'Ok', onPress: () => router.back() }]
      );
    } catch (err: any) {
      showAlert('Erro ao criar agendamento', err?.message ?? 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const clearError = (key: string) =>
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });

  const availableCount = slots.filter(s => s.available).length;

  if (shopLoading) {
    return (
      <View style={[styles.loadingWrap, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando barbearia...</Text>
      </View>
    );
  }

  if (!shop) {
    return (
      <View style={[styles.loadingWrap, { paddingTop: insets.top }]}>
        <MaterialIcons name="store" size={48} color={Colors.textMuted} />
        <Text style={styles.noShopTitle}>Barbearia não cadastrada</Text>
        <Text style={styles.noShopText}>Cadastre sua barbearia antes de criar agendamentos.</Text>
        <Pressable style={styles.noShopBtn} onPress={() => router.replace('/barber-shop')}>
          <Text style={styles.noShopBtnText}>Cadastrar Barbearia</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Novo Agendamento</Text>
          <Text style={styles.headerSub}>{shop.name}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ─── Date selector ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <MaterialIcons name="event" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Data</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.dateStrip}
          >
            {DATE_RANGE.map((d, i) => {
              const isActive = selectedDateIdx === i;
              return (
                <Pressable
                  key={d.date}
                  style={[styles.dateBtn, isActive && styles.dateBtnActive]}
                  onPress={() => handleSelectDate(i)}
                >
                  <Text style={[styles.dateDayLabel, isActive && styles.dateLabelActive]}>{d.dayLabel}</Text>
                  <Text style={[styles.dateDayNum, isActive && styles.dateLabelActive]}>{d.day}</Text>
                  <Text style={[styles.dateMonth, isActive && styles.dateLabelActive]}>{d.month}</Text>
                  {d.isToday ? <Text style={[styles.todayBadge, isActive && styles.todayBadgeActive]}>hoje</Text> : null}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ─── Time slots ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <MaterialIcons name="schedule" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Horário</Text>
            <View style={styles.sectionBadge}>
              {slotsLoading ? (
                <ActivityIndicator size={12} color={Colors.primary} />
              ) : (
                <Text style={styles.sectionBadgeText}>{availableCount} livres</Text>
              )}
            </View>
            <Pressable onPress={refreshSlots} hitSlop={8}>
              <MaterialIcons name="refresh" size={18} color={Colors.textMuted} />
            </Pressable>
          </View>

          {errors.time ? (
            <View style={styles.fieldError}>
              <MaterialIcons name="error-outline" size={14} color={Colors.error} />
              <Text style={styles.fieldErrorText}>{errors.time}</Text>
            </View>
          ) : null}

          {slotsLoading ? (
            <View style={styles.slotsLoading}>
              <ActivityIndicator color={Colors.primary} />
              <Text style={styles.slotsLoadingText}>Verificando horários...</Text>
            </View>
          ) : slots.length === 0 ? (
            <View style={styles.noSlots}>
              <MaterialIcons name="event-busy" size={28} color={Colors.textMuted} />
              <Text style={styles.noSlotsText}>Nenhum horário disponível</Text>
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
                    onPress={() => {
                      if (slot.available) {
                        setSelectedTime(slot.time);
                        clearError('time');
                      }
                    }}
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

        {/* ─── Service ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <MaterialIcons name="content-cut" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Serviço</Text>
          </View>
          <View style={styles.serviceGrid}>
            {SERVICES.map(s => (
              <Pressable
                key={s}
                style={[styles.serviceChip, selectedService === s && styles.serviceChipActive]}
                onPress={() => setSelectedService(s)}
              >
                <Text style={[styles.serviceChipText, selectedService === s && styles.serviceChipTextActive]}>
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ─── Client info ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <MaterialIcons name="person" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Dados do Cliente</Text>
          </View>

          <View style={styles.fieldWrap}>
            <View style={styles.fieldLabel}>
              <Text style={styles.label}>Nome completo</Text>
              <Text style={styles.required}>*</Text>
            </View>
            <View style={[styles.inputRow, !!errors.clientName && styles.inputRowError]}>
              <MaterialIcons name="person-outline" size={18} color={errors.clientName ? Colors.error : Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={clientName}
                onChangeText={t => { setClientName(t); clearError('clientName'); }}
                placeholder="Nome do cliente"
                placeholderTextColor={Colors.textMuted}
                autoCapitalize="words"
                selectionColor={Colors.primary}
                includeFontPadding={false}
              />
            </View>
            {errors.clientName ? (
              <View style={styles.fieldError}>
                <MaterialIcons name="error-outline" size={13} color={Colors.error} />
                <Text style={styles.fieldErrorText}>{errors.clientName}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.fieldWrap}>
            <View style={styles.fieldLabel}>
              <Text style={styles.label}>Telefone</Text>
              <Text style={styles.required}>*</Text>
            </View>
            <View style={[styles.inputRow, !!errors.clientPhone && styles.inputRowError]}>
              <MaterialIcons name="phone" size={18} color={errors.clientPhone ? Colors.error : Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={clientPhone}
                onChangeText={t => { setClientPhone(t); clearError('clientPhone'); }}
                placeholder="(11) 99999-9999"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                selectionColor={Colors.primary}
                includeFontPadding={false}
              />
            </View>
            {errors.clientPhone ? (
              <View style={styles.fieldError}>
                <MaterialIcons name="error-outline" size={13} color={Colors.error} />
                <Text style={styles.fieldErrorText}>{errors.clientPhone}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>WhatsApp <Text style={styles.optional}>(opcional)</Text></Text>
            <View style={styles.inputRow}>
              <MaterialIcons name="chat" size={18} color={Colors.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={clientWhatsapp}
                onChangeText={setClientWhatsapp}
                placeholder="(11) 99999-9999"
                placeholderTextColor={Colors.textMuted}
                keyboardType="phone-pad"
                selectionColor={Colors.primary}
                includeFontPadding={false}
              />
            </View>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.label}>Observações <Text style={styles.optional}>(opcional)</Text></Text>
            <View style={[styles.inputRow, styles.inputRowMulti]}>
              <MaterialIcons name="notes" size={18} color={Colors.textMuted} style={[styles.inputIcon, { marginTop: 2 }]} />
              <TextInput
                style={[styles.input, styles.inputMulti]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Ex: cliente prefere degradê..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                selectionColor={Colors.primary}
                includeFontPadding={false}
              />
            </View>
          </View>
        </View>

        {/* ─── Summary ─── */}
        {selectedTime ? (
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialIcons name="event-available" size={18} color={Colors.primary} />
              <Text style={styles.summaryTitle}>Resumo do Agendamento</Text>
            </View>
            <View style={styles.summaryRow}>
              <MaterialIcons name="schedule" size={16} color={Colors.textMuted} />
              <Text style={styles.summaryText}>
                {DATE_RANGE[selectedDateIdx].dayLabel}, {DATE_RANGE[selectedDateIdx].day} de {DATE_RANGE[selectedDateIdx].month} — {selectedTime}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <MaterialIcons name="content-cut" size={16} color={Colors.textMuted} />
              <Text style={styles.summaryText}>{selectedService}</Text>
            </View>
            {clientName ? (
              <View style={styles.summaryRow}>
                <MaterialIcons name="person" size={16} color={Colors.textMuted} />
                <Text style={styles.summaryText}>{clientName}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size={20} color={Colors.textInverse} />
          ) : (
            <MaterialIcons name="event-available" size={20} color={Colors.textInverse} />
          )}
          <Text style={styles.saveBtnText}>
            {saving ? 'Salvando...' : 'Criar Agendamento'}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  loadingWrap: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: Spacing.xl,
  },
  loadingText: { fontSize: FontSize.base, color: Colors.textSecondary },
  noShopTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  noShopText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  noShopBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 14,
    paddingHorizontal: 28,
    marginTop: 8,
  },
  noShopBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textInverse },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: Radius.md,
    backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center', marginTop: 2,
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  headerSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 3 },

  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, gap: Spacing.md },

  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  sectionIcon: {
    width: 34, height: 34, borderRadius: Radius.sm,
    backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: `${Colors.primary}30`,
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, flex: 1 },
  sectionBadge: {
    paddingVertical: 3, paddingHorizontal: 10,
    borderRadius: Radius.full, backgroundColor: Colors.primaryMuted,
    borderWidth: 1, borderColor: `${Colors.primary}40`,
  },
  sectionBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.primary },

  dateStrip: { gap: 8 },
  dateBtn: {
    width: 56, paddingVertical: 10,
    borderRadius: Radius.lg, alignItems: 'center', gap: 3,
    backgroundColor: Colors.surface2, borderWidth: 1, borderColor: Colors.border,
  },
  dateBtnActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  dateDayLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textMuted },
  dateDayNum: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  dateMonth: { fontSize: FontSize.xs, color: Colors.textMuted },
  dateLabelActive: { color: Colors.primary },
  todayBadge: { fontSize: 9, fontWeight: FontWeight.bold, color: Colors.primary },
  todayBadgeActive: { color: Colors.textInverse },

  timeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeSlot: {
    paddingVertical: 11, paddingHorizontal: 14,
    borderRadius: Radius.md, backgroundColor: Colors.surface2,
    borderWidth: 1, borderColor: Colors.border,
    alignItems: 'center', gap: 3,
  },
  timeSlotBusy: { opacity: 0.35 },
  timeSlotActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  timeSlotText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  timeSlotTextBusy: { color: Colors.textMuted },
  timeSlotTextActive: { color: Colors.primary },
  slotsLoading: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
  slotsLoadingText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  noSlots: { alignItems: 'center', paddingVertical: Spacing.lg, gap: 8 },
  noSlotsText: { fontSize: FontSize.sm, color: Colors.textMuted },

  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  serviceChip: {
    paddingVertical: 9, paddingHorizontal: 16,
    borderRadius: Radius.full, backgroundColor: Colors.surface2,
    borderWidth: 1, borderColor: Colors.border,
  },
  serviceChipActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  serviceChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  serviceChipTextActive: { color: Colors.primary },

  fieldWrap: { gap: 6 },
  fieldLabel: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  required: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.bold },
  optional: { color: Colors.textMuted, fontWeight: FontWeight.regular },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface2, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, height: 52,
  },
  inputRowError: { borderColor: Colors.error },
  inputRowMulti: { height: 'auto' as any, alignItems: 'flex-start', paddingVertical: 14, minHeight: 88 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary },
  inputMulti: { textAlignVertical: 'top', minHeight: 64 },
  fieldError: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fieldErrorText: { fontSize: FontSize.xs, color: Colors.error },

  summaryCard: {
    backgroundColor: Colors.surface2,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.gold,
  },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  summaryTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  summaryText: { fontSize: FontSize.sm, color: Colors.textSecondary },

  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.primary, borderRadius: Radius.lg, paddingVertical: 16,
    ...Shadow.gold,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textInverse },
});
