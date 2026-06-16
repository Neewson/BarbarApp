import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
} from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { BARBERSHOP_LIST, Barbershop } from '@/constants/mock-data';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '@/constants/theme';

export default function ExploreTab() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');

  const filtered = BARBERSHOP_LIST.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.address.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: Barbershop }) => (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push('/booking')}
    >
      <Image
        source={{ uri: item.photo }}
        style={styles.cardPhoto}
        contentFit="cover"
        transition={200}
      />
      <View style={styles.cardBody}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
          <View style={styles.ratingChip}>
            <MaterialIcons name="star" size={13} color={Colors.primary} />
            <Text style={styles.ratingText}>{item.rating}</Text>
            <Text style={styles.reviewCount}>({item.reviewCount})</Text>
          </View>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="location-on" size={14} color={Colors.textMuted} />
          <Text style={styles.address} numberOfLines={1}>{item.address}</Text>
        </View>
        <View style={styles.infoRow}>
          <MaterialIcons name="schedule" size={14} color={Colors.textMuted} />
          <Text style={styles.hours}>{item.workingHours.start} – {item.workingHours.end}</Text>
        </View>

        <ScrollableTags services={item.services.slice(0, 3).map(s => s.name)} />

        <View style={styles.cardFooter}>
          <Text style={styles.priceFrom}>
            A partir de{' '}
            <Text style={styles.priceValue}>
              R$ {Math.min(...item.services.map(s => s.price))}
            </Text>
          </Text>
          <Pressable style={styles.bookBtn} onPress={() => router.push('/booking')}>
            <Text style={styles.bookBtnText}>Agendar</Text>
            <MaterialIcons name="arrow-forward" size={14} color={Colors.textInverse} />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Barbearias</Text>
        <Text style={styles.subtitle}>{filtered.length} estabelecimentos</Text>
      </View>

      <View style={styles.searchWrap}>
        <MaterialIcons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar barbearia ou endereço..."
          placeholderTextColor={Colors.textMuted}
          value={search}
          onChangeText={setSearch}
          selectionColor={Colors.primary}
        />
        {search.length > 0 ? (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <MaterialIcons name="close" size={18} color={Colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialIcons name="search-off" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyText}>Nenhuma barbearia encontrada</Text>
          </View>
        }
      />
    </View>
  );
}

function ScrollableTags({ services }: { services: string[] }) {
  return (
    <View style={tagStyles.wrap}>
      {services.map(s => (
        <View key={s} style={tagStyles.tag}>
          <Text style={tagStyles.tagText}>{s}</Text>
        </View>
      ))}
    </View>
  );
}

const tagStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: Colors.surface3,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  tagText: { fontSize: 11, color: Colors.textSecondary, fontWeight: FontWeight.medium },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: { paddingHorizontal: Spacing.lg, paddingBottom: 4, paddingTop: Spacing.sm },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  subtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface2,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: 50,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    includeFontPadding: false,
  },

  list: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xxl, paddingTop: 4 },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    ...Shadow.md,
  },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  cardPhoto: { width: '100%', height: 180 },
  cardBody: { padding: Spacing.md, gap: 8 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardName: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, flex: 1 },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  ratingText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
  reviewCount: { fontSize: FontSize.xs, color: Colors.textMuted },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  address: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary },
  hours: { fontSize: FontSize.sm, color: Colors.textSecondary },

  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  priceFrom: { fontSize: FontSize.sm, color: Colors.textSecondary },
  priceValue: { fontWeight: FontWeight.bold, color: Colors.primary },
  bookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  bookBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textInverse },

  empty: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: FontSize.base, color: Colors.textSecondary },
});
