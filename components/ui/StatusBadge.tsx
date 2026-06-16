import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppointmentStatus } from '@/constants/mock-data';
import { Colors, FontSize, FontWeight, Radius, Spacing } from '@/constants/theme';

const STATUS_MAP: Record<AppointmentStatus, { label: string; bg: string; color: string }> = {
  booked: { label: 'Agendado', bg: Colors.infoMuted, color: Colors.info },
  confirmed: { label: 'Confirmado', bg: Colors.successMuted, color: Colors.success },
  in_progress: { label: 'Em atendimento', bg: Colors.primaryMuted, color: Colors.primary },
  done: { label: 'Concluído', bg: 'rgba(107,114,128,0.12)', color: Colors.textMuted },
  cancelled: { label: 'Cancelado', bg: Colors.errorMuted, color: Colors.error },
  rescheduled: { label: 'Remarcado', bg: 'rgba(139,92,246,0.12)', color: '#8B5CF6' },
};

interface StatusBadgeProps {
  status: AppointmentStatus;
  small?: boolean;
}

export const StatusBadge = React.memo(function StatusBadge({ status, small }: StatusBadgeProps) {
  const config = STATUS_MAP[status];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }, small && styles.small]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.label, { color: config.color }, small && styles.labelSmall]}>
        {config.label}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  small: { paddingVertical: 3, paddingHorizontal: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, letterSpacing: 0.2 },
  labelSmall: { fontSize: 10 },
});
