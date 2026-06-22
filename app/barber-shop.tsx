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
import { getSupabaseClient } from '@/template';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '@/constants/theme';

const INTERVALS = [15, 20, 30, 45, 60, 90];

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => {
  const h = String(i).padStart(2, '0');
  return [`${h}:00`, `${h}:30`];
}).flat();

interface BarberShop {
  id?: string;
  name: string;
  address: string;
  phone: string;
  whatsapp: string;
  description: string;
  work_start: string;
  work_end: string;
  slot_interval: number;
}

const DEFAULT_SHOP: BarberShop = {
  name: '',
  address: '',
  phone: '',
  whatsapp: '',
  description: '',
  work_start: '08:00',
  work_end: '18:00',
  slot_interval: 30,
};

function FieldWrapper({ label, required, children, error }: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <View style={fw.wrap}>
      <View style={fw.labelRow}>
        <Text style={fw.label}>{label}</Text>
        {required ? <Text style={fw.required}>*</Text> : null}
      </View>
      {children}
      {error ? (
        <View style={fw.errorRow}>
          <MaterialIcons name="error-outline" size={13} color={Colors.error} />
          <Text style={fw.errorText}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

const fw = StyleSheet.create({
  wrap: { gap: 6 },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  required: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.bold },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  errorText: { fontSize: FontSize.xs, color: Colors.error },
});

function FieldInput({
  value,
  onChangeText,
  placeholder,
  icon,
  keyboardType,
  multiline,
  numberOfLines,
  error,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  keyboardType?: 'default' | 'phone-pad' | 'email-address';
  multiline?: boolean;
  numberOfLines?: number;
  error?: boolean;
}) {
  return (
    <View style={[
      fi.row,
      multiline && fi.rowMulti,
      error && fi.rowError,
    ]}>
      {icon ? (
        <MaterialIcons
          name={icon}
          size={18}
          color={error ? Colors.error : Colors.textMuted}
          style={fi.icon}
        />
      ) : null}
      <TextInput
        style={[fi.input, multiline && fi.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        keyboardType={keyboardType ?? 'default'}
        multiline={multiline}
        numberOfLines={numberOfLines}
        autoCapitalize="sentences"
        selectionColor={Colors.primary}
        includeFontPadding={false}
      />
    </View>
  );
}

const fi = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface2,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  rowMulti: {
    height: 'auto' as any,
    alignItems: 'flex-start',
    paddingVertical: 14,
    minHeight: 96,
  },
  rowError: { borderColor: Colors.error },
  icon: { marginRight: 10, marginTop: 2 },
  input: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },
  inputMulti: {
    textAlignVertical: 'top',
    minHeight: 72,
  },
});

export default function BarberShopScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { showAlert } = useAlert();
  const supabase = getSupabaseClient();

  const [shop, setShop] = useState<BarberShop>(DEFAULT_SHOP);
  const [errors, setErrors] = useState<Partial<Record<keyof BarberShop, string>>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Time picker modal state
  const [timePicker, setTimePicker] = useState<{ field: 'work_start' | 'work_end' } | null>(null);

  const loadShop = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data } = await supabase
        .from('barbershops')
        .select('*')
        .eq('owner_id', user.id)
        .single();
      if (data) {
        setShop({
          id: data.id,
          name: data.name,
          address: data.address,
          phone: data.phone ?? '',
          whatsapp: data.whatsapp ?? '',
          description: data.description ?? '',
          work_start: data.work_start,
          work_end: data.work_end,
          slot_interval: data.slot_interval,
        });
        setIsEditing(true);
      }
    } catch {
      // No shop yet — show empty form
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadShop();
  }, [loadShop]);

  const set = (key: keyof BarberShop) => (value: string | number) => {
    setShop(prev => ({ ...prev, [key]: value }));
    setErrors(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof BarberShop, string>> = {};
    if (!shop.name.trim()) e.name = 'Nome é obrigatório';
    if (!shop.address.trim()) e.address = 'Endereço é obrigatório';
    if (!shop.phone.trim()) e.phone = 'Telefone é obrigatório';
    if (!shop.whatsapp.trim()) e.whatsapp = 'WhatsApp é obrigatório';
    if (shop.work_start >= shop.work_end) e.work_end = 'Horário final deve ser após o inicial';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!user?.id) return;
    setSaving(true);
    try {
      const payload = {
        owner_id: user.id,
        name: shop.name.trim(),
        address: shop.address.trim(),
        phone: shop.phone.trim(),
        whatsapp: shop.whatsapp.trim(),
        description: shop.description.trim(),
        work_start: shop.work_start,
        work_end: shop.work_end,
        slot_interval: shop.slot_interval,
        updated_at: new Date().toISOString(),
      };

      if (isEditing && shop.id) {
        const { error } = await supabase
          .from('barbershops')
          .update(payload)
          .eq('id', shop.id);
        if (error) throw new Error(error.message);
      } else {
        const { data, error } = await supabase
          .from('barbershops')
          .insert(payload)
          .select('id')
          .single();
        if (error) throw new Error(error.message);
        setShop(prev => ({ ...prev, id: data.id }));
        setIsEditing(true);
      }

      showAlert(
        isEditing ? 'Barbearia atualizada!' : 'Barbearia cadastrada!',
        'Os dados foram salvos com sucesso.',
        [{ text: 'Ok', onPress: () => router.back() }]
      );
    } catch (err: any) {
      showAlert('Erro ao salvar', err?.message ?? 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  // Preview: generate time slots count
  const slotCount = (() => {
    const [sh, sm] = shop.work_start.split(':').map(Number);
    const [eh, em] = shop.work_end.split(':').map(Number);
    const totalMins = (eh * 60 + em) - (sh * 60 + sm);
    return totalMins > 0 ? Math.floor(totalMins / shop.slot_interval) : 0;
  })();

  if (loading) {
    return (
      <View style={[styles.loadingWrap, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Carregando dados...</Text>
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
          <Text style={styles.headerTitle}>
            {isEditing ? 'Editar Barbearia' : 'Cadastrar Barbearia'}
          </Text>
          <Text style={styles.headerSub}>
            {isEditing ? 'Atualize os dados do seu estabelecimento' : 'Preencha os dados do seu estabelecimento'}
          </Text>
        </View>
        {isEditing ? (
          <View style={styles.editBadge}>
            <MaterialIcons name="edit" size={12} color={Colors.primary} />
            <Text style={styles.editBadgeText}>Editar</Text>
          </View>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ─── Section: Informações Gerais ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <MaterialIcons name="store" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Informações Gerais</Text>
          </View>

          <FieldWrapper label="Nome da barbearia" required error={errors.name}>
            <FieldInput
              value={shop.name}
              onChangeText={set('name')}
              placeholder="Ex: Barbearia Premium"
              icon="storefront"
              error={!!errors.name}
            />
          </FieldWrapper>

          <FieldWrapper label="Endereço completo" required error={errors.address}>
            <FieldInput
              value={shop.address}
              onChangeText={set('address')}
              placeholder="Rua, número, bairro, cidade"
              icon="location-on"
              error={!!errors.address}
            />
          </FieldWrapper>

          <FieldWrapper label="Descrição" error={errors.description}>
            <FieldInput
              value={shop.description}
              onChangeText={set('description')}
              placeholder="Fale um pouco sobre sua barbearia..."
              icon="notes"
              multiline
              numberOfLines={3}
            />
          </FieldWrapper>
        </View>

        {/* ─── Section: Contato ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <MaterialIcons name="phone" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Contato</Text>
          </View>

          <FieldWrapper label="Telefone" required error={errors.phone}>
            <FieldInput
              value={shop.phone}
              onChangeText={set('phone')}
              placeholder="(11) 99999-9999"
              icon="phone"
              keyboardType="phone-pad"
              error={!!errors.phone}
            />
          </FieldWrapper>

          <FieldWrapper label="WhatsApp" required error={errors.whatsapp}>
            <FieldInput
              value={shop.whatsapp}
              onChangeText={set('whatsapp')}
              placeholder="(11) 99999-9999"
              icon="chat"
              keyboardType="phone-pad"
              error={!!errors.whatsapp}
            />
          </FieldWrapper>
        </View>

        {/* ─── Section: Horário de Atendimento ─── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionIcon}>
              <MaterialIcons name="schedule" size={18} color={Colors.primary} />
            </View>
            <Text style={styles.sectionTitle}>Horário de Atendimento</Text>
          </View>

          <View style={styles.timeRow}>
            <FieldWrapper label="Horário inicial" required style={styles.timeField}>
              <Pressable
                style={[styles.timeBtn, errors.work_start && styles.timeBtnError]}
                onPress={() => setTimePicker({ field: 'work_start' })}
              >
                <MaterialIcons name="wb-sunny" size={18} color={Colors.primary} />
                <Text style={styles.timeBtnText}>{shop.work_start}</Text>
                <MaterialIcons name="expand-more" size={18} color={Colors.textMuted} />
              </Pressable>
            </FieldWrapper>

            <View style={styles.timeSeparator}>
              <MaterialIcons name="arrow-forward" size={18} color={Colors.textMuted} />
            </View>

            <FieldWrapper label="Horário final" required error={errors.work_end} style={styles.timeField}>
              <Pressable
                style={[styles.timeBtn, !!errors.work_end && styles.timeBtnError]}
                onPress={() => setTimePicker({ field: 'work_end' })}
              >
                <MaterialIcons name="nights-stay" size={18} color={Colors.primary} />
                <Text style={styles.timeBtnText}>{shop.work_end}</Text>
                <MaterialIcons name="expand-more" size={18} color={Colors.textMuted} />
              </Pressable>
            </FieldWrapper>
          </View>

          <FieldWrapper label="Intervalo entre atendimentos" required>
            <View style={styles.intervalGrid}>
              {INTERVALS.map(mins => (
                <Pressable
                  key={mins}
                  style={[styles.intervalChip, shop.slot_interval === mins && styles.intervalChipActive]}
                  onPress={() => set('slot_interval')(mins)}
                >
                  <Text style={[styles.intervalChipText, shop.slot_interval === mins && styles.intervalChipTextActive]}>
                    {mins} min
                  </Text>
                </Pressable>
              ))}
            </View>
          </FieldWrapper>
        </View>

        {/* ─── Preview ─── */}
        <View style={styles.previewCard}>
          <View style={styles.previewHeader}>
            <MaterialIcons name="preview" size={18} color={Colors.primary} />
            <Text style={styles.previewTitle}>Prévia da agenda</Text>
          </View>
          <Text style={styles.previewSub}>
            Com estas configurações, sua agenda terá:
          </Text>
          <View style={styles.previewStats}>
            <View style={styles.previewStat}>
              <Text style={styles.previewStatNum}>{slotCount}</Text>
              <Text style={styles.previewStatLabel}>horários/dia</Text>
            </View>
            <View style={styles.previewDivider} />
            <View style={styles.previewStat}>
              <Text style={styles.previewStatNum}>{shop.slot_interval}'</Text>
              <Text style={styles.previewStatLabel}>por cliente</Text>
            </View>
            <View style={styles.previewDivider} />
            <View style={styles.previewStat}>
              <Text style={styles.previewStatNum}>{shop.work_start}</Text>
              <Text style={styles.previewStatLabel}>primeiro slot</Text>
            </View>
          </View>
          <View style={styles.previewExamples}>
            {Array.from({ length: Math.min(6, slotCount) }, (_, i) => {
              const [sh2, sm2] = shop.work_start.split(':').map(Number);
              const totalMins = sh2 * 60 + sm2 + i * shop.slot_interval;
              const hh = String(Math.floor(totalMins / 60)).padStart(2, '0');
              const mm = String(totalMins % 60).padStart(2, '0');
              return `${hh}:${mm}`;
            }).map(t => (
              <View key={t} style={styles.previewSlot}>
                <Text style={styles.previewSlotText}>{t}</Text>
              </View>
            ))}
            {slotCount > 6 ? (
              <View style={[styles.previewSlot, styles.previewSlotMore]}>
                <Text style={styles.previewSlotMoreText}>+{slotCount - 6}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </ScrollView>

      {/* Save button */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size={20} color={Colors.textInverse} />
          ) : (
            <MaterialIcons name={isEditing ? 'save' : 'check'} size={20} color={Colors.textInverse} />
          )}
          <Text style={styles.saveBtnText}>
            {saving ? 'Salvando...' : isEditing ? 'Salvar alterações' : 'Cadastrar Barbearia'}
          </Text>
        </Pressable>
      </View>

      {/* Time picker modal */}
      {timePicker ? (
        <Pressable
          style={styles.pickerOverlay}
          onPress={() => setTimePicker(null)}
        >
          <Pressable
            style={[styles.pickerSheet, { paddingBottom: insets.bottom + 16 }]}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.pickerHandle} />
            <Text style={styles.pickerTitle}>
              {timePicker.field === 'work_start' ? 'Horário inicial' : 'Horário final'}
            </Text>
            <ScrollView
              style={styles.pickerList}
              showsVerticalScrollIndicator={false}
            >
              {HOUR_OPTIONS.map(h => {
                const isSelected = shop[timePicker.field] === h;
                return (
                  <Pressable
                    key={h}
                    style={[styles.pickerItem, isSelected && styles.pickerItemActive]}
                    onPress={() => {
                      set(timePicker.field)(h);
                      setTimePicker(null);
                    }}
                  >
                    <Text style={[styles.pickerItemText, isSelected && styles.pickerItemTextActive]}>
                      {h}
                    </Text>
                    {isSelected ? (
                      <MaterialIcons name="check" size={18} color={Colors.primary} />
                    ) : null}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  loadingWrap: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', gap: 16 },
  loadingText: { fontSize: FontSize.base, color: Colors.textSecondary },

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
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  headerSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 3, lineHeight: 16 },
  editBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
  },
  editBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary },

  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, gap: Spacing.lg },

  section: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  sectionIcon: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },

  timeRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm },
  timeField: { flex: 1 } as any,
  timeSeparator: { paddingBottom: 14, paddingHorizontal: 4 },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface2,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 52,
  },
  timeBtnError: { borderColor: Colors.error },
  timeBtnText: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },

  intervalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  intervalChip: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  intervalChipActive: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  intervalChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  intervalChipTextActive: { color: Colors.primary },

  previewCard: {
    backgroundColor: Colors.surface2,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  previewHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  previewTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  previewSub: { fontSize: FontSize.sm, color: Colors.textSecondary },
  previewStats: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  previewStat: { flex: 1, alignItems: 'center', gap: 4 },
  previewStatNum: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.primary },
  previewStatLabel: { fontSize: FontSize.xs, color: Colors.textSecondary },
  previewDivider: { width: 1, height: 40, backgroundColor: Colors.border },
  previewExamples: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  previewSlot: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: Colors.surface3,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  previewSlotText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary },
  previewSlotMore: { backgroundColor: Colors.primaryMuted, borderColor: Colors.primary },
  previewSlotMoreText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },

  footer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    ...Shadow.gold,
  },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textInverse },

  // Time picker
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(8,11,17,0.7)',
    justifyContent: 'flex-end',
  },
  pickerSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.lg,
    paddingTop: 12,
    maxHeight: 400,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  pickerHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },
  pickerTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  pickerList: { flex: 1 },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: 2,
  },
  pickerItemActive: { backgroundColor: Colors.primaryMuted },
  pickerItemText: { fontSize: FontSize.base, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  pickerItemTextActive: { color: Colors.primary, fontWeight: FontWeight.bold },
});
