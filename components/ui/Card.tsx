import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Spacing, Shadow } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'gold';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card = React.memo(function Card({
  children,
  style,
  variant = 'default',
  padding = 'md',
}: CardProps) {
  return (
    <View
      style={[
        styles.card,
        styles[variant],
        padding !== 'none' && styles[`pad_${padding}`],
        style,
      ]}
    >
      {children}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  default: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    ...Shadow.sm,
  },
  elevated: {
    backgroundColor: Colors.surface2,
    borderColor: Colors.borderLight,
    ...Shadow.md,
  },
  gold: {
    backgroundColor: Colors.surface2,
    borderColor: Colors.primary,
    ...Shadow.gold,
  },
  pad_sm: { padding: Spacing.sm },
  pad_md: { padding: Spacing.md },
  pad_lg: { padding: Spacing.lg },
});
