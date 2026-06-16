import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Appointment, AppointmentStatus } from '@/constants/mock-data';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Colors, FontSize, FontWeight, Radius, Spacing, Shadow } from '@/constants/theme';

interface AppointmentCardProps {
  appointment: Appointment;
  onPress?: () => void;
  onStatusChange?: (id: string, status: AppointmentStatus) => void;
  showActions?: boolean;
  compact?: boolean;
}

export const AppointmentCard = React.memo(function AppointmentCard({
  appointment,
  onPress,
  onStatusChange,
  showActions = false,
  compact = false,
}: AppointmentCardProps) {
  const { id, clientName, service, time, status, clientPhone } = appointment;

  const initials = clientName
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase();

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
    >
      <View style={styles.timeBlock}>
        <Text style={styles.time}>{time}</Text>
        <View style={[styles.indicator, status === 'in_progress' ? styles.indicatorActive : null]} />
      </View>

      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{clientName}</Text>
        <Text style={styles.service} numberOfLines={1}>{service}</Text>
        {!compact ? (
          <View style={styles.row}>
            <StatusBadge status={status} small />
          </View>
        ) : null}
      </View>

      {showActions && status === 'booked' ? (
        <View style={styles.actions}>
          <Pressable
            style={[styles.actionBtn, styles.confirmBtn]}
            onPress={() => onStatusChange?.(id, 'confirmed')}
            hitSlop={4}
          >
            <MaterialIcons name="check" size={16} color={Colors.success} />
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.cancelBtn]}
            onPress={() => onStatusChange?.(id, 'cancelled')}
            hitSlop={4}
          >
            <MaterialIcons name="close" size={16} color={Colors.error} />
          </Pressable>
        </View>
      ) : (
        <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },

  timeBlock: {
    alignItems: 'center',
    width: 44,
    gap: 4,
  },
  time: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.primary,
  },
  indicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.border,
  },
  indicatorActive: { backgroundColor: Colors.primary },

  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.accentMuted,
    borderWidth: 1,
    borderColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.bold,
    color: Colors.accentLight,
  },

  info: { flex: 1, gap: 3 },
  name: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  service: { fontSize: FontSize.sm, color: Colors.textSecondary },
  row: { marginTop: 2 },

  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  confirmBtn: { backgroundColor: Colors.successMuted, borderColor: Colors.success },
  cancelBtn: { backgroundColor: Colors.errorMuted, borderColor: Colors.error },
});
