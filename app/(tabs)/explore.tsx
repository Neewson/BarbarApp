import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { fetchAllBarbershops, Barbershop } from '@/services/appointmentService';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '@/constants/theme';

export default function ExploreTab() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [barbershops, setBarbershops] = useState<Barbershop[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllBarbershops();
      setBarbershops(data);
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao carregar barbearias');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = barbershops.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.address ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const handleBook = (shop: Barbershop) => {
    router.push({ pathname: '/booking', params: { shopId: shop.id, shopName: shop.name, shopAddress: shop.address } });
  };

  const renderItem = ({ item }: { item: Barbershop }) => (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => handleBook(item)}
    >
      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={styles.shopIconWrap}>
          <MaterialIcons name="storefront" size={24} color={Colors.primary} />
        </View>
        <View style={styles.shopInfo}>
          <Text style={styles.shopName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.shopAddressRow}>
            <MaterialIcons name="location-on" size={13} color={Colors.textMuted} />
            <Text style={styles.shopAddress} numberOfLines={1}>{item.address}</Text>
          </View>
        </View>
        <View style={styles.openBadge}>
          <View style={styles.openDot} />
          <Text style={styles.openText}>Aberto</Text>
        </View>
      </View>

      {/* Details row */}
      <View style={styles.detailRow}>
        <View style={styles.detailItem}>
          <MaterialIcons name="schedule" size={14} color={Colors.primary} />
          <Text style={styles.detailText}>{item.work_start} – {item.work_end}</Text>
        </View>
        <View style={styles.detailDivider} />
        <View style={styles.detailItem}>
          <MaterialIcons name="timer" size={14} color={Colors.primary} />
          <Text style={styles.detailText}>{item.slot_interval} min/atend.</Text>
        </View>
        {item.phone ? (
          <>
            <View style={styles.detailDivider} />
            <View style={styles.detailItem}>
              <MaterialIcons name="phone" size={14} color={Colors.primary} />
              <Text style={styles.detailText} numberOfLines={1}>{item.phone}</Text>
            </View>
          </>
        ) : null}
      </View>

      {/* Description */}
      {item.description ? (
        <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
      ) : null}

      {/* Footer */}
      <View style={styles.cardFooter}>
        {item.whatsapp ? (
          <View style={styles.whatsappBadge}>
            <MaterialIcons name="chat" size={13} color={Colors.success} />
            <Text style={styles.whatsappText}>WhatsApp</Text>
          </View>
        ) : <View />}
        <Pressable style={styles.bookBtn} onPress={() => handleBook(item)}>
          <Text style={styles.bookBtnText}>Agendar</Text>
          <MaterialIcons name="arrow-forward" size={14} color={Colors.textInverse} />
        </Pressable>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Barbearias</Text>
        <Text style={styles.subtitle}>
          {loading ? 'Carregando...' : `${filtered.length} estabelecimento${filtered.length !== 1 ? 's' : ''}`}
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar barbearia ou endereço..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          selectionColor={Colors.primary}
          includeFontPadding={false}
        />
        {search.length > 0 ? (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <MaterialIcons name="close" size={18} color={Colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <View style={styles.errorWrap}>
          <MaterialIcons name="error-outline" size={20} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable style={styles.retryBtn} onPress={load}>
            <Text style={styles.retryBtnText}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
          refreshControl={
            <RefreshControl
              refreshing={loading}
              onRefresh={load}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.empty}>
                {search.length > 0 ? (
                  <>
                    <MaterialIcons name="search-off" size={48} color={Colors.textMuted} />
                    <Text style={styles.emptyTitle}>Nenhum resultado</Text>
                    <Text style={styles.emptyText}>Tente outro nome ou endereço</Text>
                  </>
                ) : (
                  <>
                    <MaterialIcons name="store" size={48} color={Colors.textMuted} />
                    <Text style={styles.emptyTitle}>Nenhuma barbearia cadastrada</Text>
                    <Text style={styles.emptyText}>As barbearias aparecerão aqui quando se cadastrarem.</Text>
                  </>
                )}
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: { paddingHorizontal: Spacing.lg, paddingBottom: 4, paddingTop: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface2, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.border,
    marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md, height: 50,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, fontSize: FontSize.base, color: Colors.textPrimary },

  list: { paddingHorizontal: Spacing.lg, paddingTop: 4 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadow.md,
  },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },

  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  shopIconWrap: {
    width: 52, height: 52, borderRadius: Radius.lg,
    backgroundColor: Colors.primaryMuted, alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: `${Colors.primary}40`,
  },
  shopInfo: { flex: 1 },
  shopName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  shopAddressRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 },
  shopAddress: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary },
  openBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(16,201,123,0.1)', borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: 'rgba(16,201,123,0.3)',
  },
  openDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.success },
  openText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.success },

  detailRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface2, borderRadius: Radius.md,
    padding: Spacing.md, gap: Spacing.sm,
  },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  detailDivider: { width: 1, height: 16, backgroundColor: Colors.border, marginHorizontal: 4 },
  detailText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: FontWeight.medium },

  description: { fontSize: FontSize.sm, color: Colors.textSecondary, lineHeight: 20, paddingHorizontal: 2 },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  whatsappBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(16,201,123,0.1)', borderRadius: Radius.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  whatsappText: { fontSize: FontSize.xs, color: Colors.success, fontWeight: FontWeight.medium },
  bookBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.primary, borderRadius: Radius.md,
    paddingVertical: 10, paddingHorizontal: 16,
    ...Shadow.gold,
  },
  bookBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textInverse },

  errorWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: Spacing.xl },
  errorText: { fontSize: FontSize.sm, color: Colors.error, textAlign: 'center' },
  retryBtn: {
    paddingVertical: 10, paddingHorizontal: 24, borderRadius: Radius.full,
    backgroundColor: Colors.errorMuted, borderWidth: 1, borderColor: Colors.error,
  },
  retryBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.error },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.xl },
});
