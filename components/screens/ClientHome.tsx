import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useClientAppointments } from '@/hooks/useAppointments';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { BARBERSHOP_LIST, MOCK_BARBERSHOP } from '@/constants/mock-data';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '@/constants/theme';

export default function ClientHome() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { getUpcoming } = useClientAppointments();
  const upcoming = getUpcoming();
  const nextAppt = upcoming[0];

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
        <View>
          <Text style={styles.greeting}>{greeting()},</Text>
          <Text style={styles.userName}>{user?.name?.split(' ')[0]}</Text>
        </View>
        <Pressable style={styles.notifBtn}>
          <MaterialIcons name="notifications-none" size={24} color={Colors.textPrimary} />
          <View style={styles.notifDot} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Next appointment banner */}
        {nextAppt ? (
          <View style={styles.nextCard}>
            <View style={styles.nextCardTop}>
              <View>
                <Text style={styles.nextCardLabel}>Próximo agendamento</Text>
                <Text style={styles.nextCardTime}>Hoje às {nextAppt.time}</Text>
              </View>
              <StatusBadge status={nextAppt.status} />
            </View>
            <View style={styles.nextCardDivider} />
            <View style={styles.nextCardBottom}>
              <View style={styles.nextCardInfo}>
                <MaterialIcons name="content-cut" size={16} color={Colors.primary} />
                <Text style={styles.nextCardService}>{nextAppt.service}</Text>
              </View>
              <View style={styles.nextCardInfo}>
                <MaterialIcons name="store" size={16} color={Colors.textSecondary} />
                <Text style={styles.nextCardShop}>{MOCK_BARBERSHOP.name}</Text>
              </View>
            </View>
            <Pressable
              style={styles.cancelBtn}
              onPress={() => router.push('/agenda')}
            >
              <Text style={styles.cancelBtnText}>Ver detalhes</Text>
              <MaterialIcons name="arrow-forward" size={14} color={Colors.primary} />
            </Pressable>
          </View>
        ) : (
          <Pressable style={styles.ctaBanner} onPress={() => router.push('/booking')}>
            <View>
              <Text style={styles.ctaBannerTitle}>Agendar agora</Text>
              <Text style={styles.ctaBannerSub}>Encontre seu barbeiro favorito</Text>
            </View>
            <View style={styles.ctaBannerIcon}>
              <MaterialIcons name="content-cut" size={24} color={Colors.primary} />
            </View>
          </Pressable>
        )}

        {/* Quick actions */}
        <View style={styles.quickActions}>
          {[
            { icon: 'event-available' as const, label: 'Agendar', onPress: () => router.push('/booking') },
            { icon: 'history' as const, label: 'Histórico', onPress: () => router.push('/agenda') },
            { icon: 'star-outline' as const, label: 'Favoritos', onPress: () => {} },
            { icon: 'person-outline' as const, label: 'Perfil', onPress: () => router.push('/(tabs)/profile') },
          ].map(a => (
            <Pressable key={a.label} style={styles.quickBtn} onPress={a.onPress}>
              <View style={styles.quickIcon}>
                <MaterialIcons name={a.icon} size={22} color={Colors.primary} />
              </View>
              <Text style={styles.quickLabel}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Barbershops */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Barbearias Próximas</Text>
          <Pressable onPress={() => router.push('/explore')}>
            <Text style={styles.seeAll}>Ver todas</Text>
          </Pressable>
        </View>

        <View style={styles.shopList}>
          {BARBERSHOP_LIST.map(shop => (
            <Pressable
              key={shop.id}
              style={styles.shopCard}
              onPress={() => router.push('/booking')}
            >
              <Image
                source={{ uri: shop.photo }}
                style={styles.shopPhoto}
                contentFit="cover"
                transition={200}
              />
              <View style={styles.shopInfo}>
                <View style={styles.shopRow}>
                  <Text style={styles.shopName} numberOfLines={1}>{shop.name}</Text>
                  <View style={styles.ratingPill}>
                    <MaterialIcons name="star" size={12} color={Colors.primary} />
                    <Text style={styles.ratingText}>{shop.rating}</Text>
                  </View>
                </View>
                <Text style={styles.shopAddress} numberOfLines={1}>{shop.address}</Text>
                <View style={styles.shopMeta}>
                  <Text style={styles.shopHours}>
                    {shop.workingHours.start} - {shop.workingHours.end}
                  </Text>
                  <View style={styles.shopPriceRange}>
                    <Text style={styles.shopPriceText}>
                      A partir de R$ {Math.min(...shop.services.map(s => s.price))}
                    </Text>
                  </View>
                </View>
              </View>
            </Pressable>
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
  greeting: { fontSize: FontSize.sm, color: Colors.textSecondary },
  userName: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
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

  content: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.lg },

  nextCard: {
    backgroundColor: Colors.surface2,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.gold,
  },
  nextCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  nextCardLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: FontWeight.medium },
  nextCardTime: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary, marginTop: 4 },
  nextCardDivider: { height: 1, backgroundColor: Colors.border },
  nextCardBottom: { gap: 8 },
  nextCardInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nextCardService: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  nextCardShop: { fontSize: FontSize.sm, color: Colors.textSecondary },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
  },
  cancelBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },

  ctaBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.accentLight,
  },
  ctaBannerTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  ctaBannerSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  ctaBannerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickBtn: { alignItems: 'center', gap: 8, flex: 1 },
  quickIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  seeAll: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.semibold },

  shopList: { gap: Spacing.md },
  shopCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.md,
  },
  shopPhoto: { width: '100%', height: 160 },
  shopInfo: { padding: Spacing.md, gap: 6 },
  shopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  shopName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, flex: 1 },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
  },
  ratingText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.primary },
  shopAddress: { fontSize: FontSize.sm, color: Colors.textSecondary },
  shopMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  shopHours: { fontSize: FontSize.xs, color: Colors.textMuted },
  shopPriceRange: {},
  shopPriceText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.primary },
});
