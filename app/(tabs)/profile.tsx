import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAlert } from '@/template';
import { useAuth } from '@/hooks/useAuth';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '@/constants/theme';

interface SettingItem {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  toggle?: boolean;
  value?: boolean;
  onToggle?: (v: boolean) => void;
  danger?: boolean;
  badge?: string;
}

export default function ProfileTab() {
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { showAlert } = useAlert();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);
  const [smsEnabled, setSmsEnabled] = useState(false);

  const isBarber = user?.role === 'barber';

  const handleLogout = () => {
    showAlert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Sair',
        style: 'destructive',
        onPress: () => {
          logout();
          router.replace('/login');
        },
      },
    ]);
  };

  const sections: { title: string; items: SettingItem[] }[] = [
    {
      title: 'Conta',
      items: [
        { icon: 'person-outline', label: 'Dados pessoais', subtitle: 'Nome, telefone, e-mail', onPress: () => {} },
        { icon: 'lock-outline', label: 'Segurança', subtitle: 'Senha e autenticação', onPress: () => {} },
        isBarber
          ? { icon: 'store', label: 'Minha Barbearia', subtitle: 'Configurar estabelecimento', onPress: () => {}, badge: 'PRO' }
          : { icon: 'history', label: 'Histórico', subtitle: 'Cortes e agendamentos', onPress: () => {} },
      ],
    },
    {
      title: 'Notificações',
      items: [
        {
          icon: 'notifications-active',
          label: 'Push Notification',
          subtitle: 'Alertas no celular',
          toggle: true,
          value: pushEnabled,
          onToggle: setPushEnabled,
        },
        {
          icon: 'chat',
          label: 'WhatsApp',
          subtitle: 'Lembretes por WhatsApp',
          toggle: true,
          value: whatsappEnabled,
          onToggle: setWhatsappEnabled,
        },
        {
          icon: 'sms',
          label: 'SMS',
          subtitle: 'Lembretes por SMS',
          toggle: true,
          value: smsEnabled,
          onToggle: setSmsEnabled,
        },
      ],
    },
    {
      title: 'Privacidade e Segurança',
      items: [
        { icon: 'shield', label: 'Política de Privacidade', subtitle: 'LGPD e seus direitos', onPress: () => {} },
        { icon: 'article', label: 'Termos de Uso', onPress: () => {} },
        { icon: 'manage-accounts', label: 'Gerenciar Dados', subtitle: 'Exportar ou excluir dados', onPress: () => {} },
      ],
    },
    {
      title: 'Suporte',
      items: [
        { icon: 'help-outline', label: 'Central de Ajuda', onPress: () => {} },
        { icon: 'star-outline', label: 'Avaliar o App', onPress: () => {} },
        { icon: 'info-outline', label: 'Versão 1.0.0', subtitle: 'Barbar.app' },
      ],
    },
  ];

  const initials = user?.name?.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() ?? 'U';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.pageTitle}>Perfil</Text>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Pressable style={styles.editAvatarBtn}>
              <MaterialIcons name="camera-alt" size={14} color={Colors.textInverse} />
            </Pressable>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name}</Text>
            <View style={styles.rolePill}>
              <MaterialIcons
                name={isBarber ? 'content-cut' : 'person'}
                size={13}
                color={Colors.primary}
              />
              <Text style={styles.rolePillText}>{isBarber ? 'Barbeiro' : 'Cliente'}</Text>
            </View>
            <Text style={styles.profileEmail}>{user?.email || user?.phone}</Text>
          </View>
        </View>

        {/* Security indicator */}
        <View style={styles.securityBadge}>
          <MaterialIcons name="verified-user" size={18} color={Colors.success} />
          <View style={styles.securityText}>
            <Text style={styles.securityTitle}>Conta Verificada</Text>
            <Text style={styles.securitySub}>Criptografia JWT ativa • Dados protegidos (LGPD)</Text>
          </View>
          <View style={styles.securityDot} />
        </View>

        {/* Settings sections */}
        {sections.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.items.map((item, idx) => (
                <Pressable
                  key={item.label}
                  style={[
                    styles.settingItem,
                    idx < section.items.length - 1 && styles.settingItemBorder,
                  ]}
                  onPress={item.toggle ? undefined : item.onPress}
                  disabled={!item.onPress && !item.toggle}
                >
                  <View style={[styles.settingIcon, item.danger && styles.settingIconDanger]}>
                    <MaterialIcons
                      name={item.icon}
                      size={20}
                      color={item.danger ? Colors.error : Colors.primary}
                    />
                  </View>
                  <View style={styles.settingContent}>
                    <Text style={[styles.settingLabel, item.danger && styles.settingLabelDanger]}>
                      {item.label}
                    </Text>
                    {item.subtitle ? (
                      <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
                    ) : null}
                  </View>
                  {item.badge ? (
                    <View style={styles.badgePill}>
                      <Text style={styles.badgePillText}>{item.badge}</Text>
                    </View>
                  ) : null}
                  {item.toggle ? (
                    <Switch
                      value={item.value}
                      onValueChange={item.onToggle}
                      trackColor={{ false: Colors.border, true: Colors.primaryMuted }}
                      thumbColor={item.value ? Colors.primary : Colors.textMuted}
                    />
                  ) : item.onPress ? (
                    <MaterialIcons name="chevron-right" size={20} color={Colors.textMuted} />
                  ) : null}
                </Pressable>
              ))}
            </View>
          </View>
        ))}

        {/* Logout */}
        <Pressable style={styles.logoutBtn} onPress={handleLogout}>
          <MaterialIcons name="logout" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  pageTitle: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },

  content: { paddingHorizontal: Spacing.lg, gap: Spacing.lg },

  profileCard: {
    backgroundColor: Colors.surface2,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadow.md,
  },
  avatarWrap: { position: 'relative' },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: `${Colors.primary}40`,
  },
  rolePillText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, color: Colors.primary },
  profileEmail: { fontSize: FontSize.sm, color: Colors.textSecondary },

  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.successMuted,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.success}40`,
  },
  securityText: { flex: 1 },
  securityTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.success },
  securitySub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  securityDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.success },

  section: { gap: Spacing.sm },
  sectionTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textMuted, letterSpacing: 0.5, textTransform: 'uppercase' },
  sectionCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  settingItemBorder: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingIconDanger: { backgroundColor: Colors.errorMuted },
  settingContent: { flex: 1 },
  settingLabel: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.textPrimary },
  settingLabelDanger: { color: Colors.error },
  settingSubtitle: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 1 },
  badgePill: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgePillText: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.textInverse },

  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.errorMuted,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.error,
    padding: Spacing.md,
  },
  logoutText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.error },
});
