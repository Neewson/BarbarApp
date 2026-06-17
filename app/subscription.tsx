import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useAlert } from '@/template';
import { useAuth } from '@/hooks/useAuth';
import { STRIPE_PLANS, createCheckoutSession, createCustomerPortalSession } from '@/services/subscriptionService';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '@/constants/theme';

const FEATURES = [
  'Agenda ilimitada de agendamentos',
  'Dashboard com métricas e relatórios',
  'Notificações automáticas para clientes',
  'Gestão completa da barbearia',
  'Controle de horários e bloqueios',
  'Histórico de atendimentos',
  'Suporte prioritário',
  'Atualizações gratuitas',
];

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const { user, subscription, refreshSubscription } = useAuth();
  const { showAlert } = useAlert();
  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const plan = STRIPE_PLANS.barber;

  // Listen for deep link return from Stripe
  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const { url } = event;
      if (url.includes('subscription/success')) {
        setRefreshing(true);
        await refreshSubscription();
        setRefreshing(false);
        showAlert('Assinatura ativada!', 'Seu plano Barbeiro foi ativado com sucesso. Aproveite todos os recursos!');
      } else if (url.includes('subscription/cancel')) {
        showAlert('Pagamento cancelado', 'Nenhuma cobrança foi realizada.');
      }
    };

    const sub = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then(url => {
      if (url) handleDeepLink({ url });
    });

    return () => sub.remove();
  }, []);

  const handleSubscribe = async () => {
    setLoadingCheckout(true);
    try {
      const { url, error } = await createCheckoutSession(plan.price_id);
      if (error || !url) {
        showAlert('Erro', error ?? 'Não foi possível iniciar o pagamento.');
        return;
      }
      await WebBrowser.openBrowserAsync(url);
    } finally {
      setLoadingCheckout(false);
    }
  };

  const handleManage = async () => {
    setLoadingPortal(true);
    try {
      const { url, error } = await createCustomerPortalSession();
      if (error || !url) {
        showAlert('Erro', error ?? 'Não foi possível abrir o portal.');
        return;
      }
      await WebBrowser.openBrowserAsync(url);
    } finally {
      setLoadingPortal(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshSubscription();
    setRefreshing(false);
  };

  const isSubscribed = subscription.subscribed;
  const subEndDate = subscription.subscription_end
    ? new Date(subscription.subscription_end).toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : null;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Assinatura</Text>
        <Pressable onPress={handleRefresh} style={styles.refreshBtn} hitSlop={8} disabled={refreshing}>
          {refreshing
            ? <ActivityIndicator size={18} color={Colors.primary} />
            : <MaterialIcons name="refresh" size={22} color={Colors.primary} />
          }
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>

        {/* Status Banner */}
        {isSubscribed ? (
          <View style={styles.activeBanner}>
            <View style={styles.activeBannerLeft}>
              <View style={styles.activeIndicator} />
              <View>
                <Text style={styles.activeBannerTitle}>Plano Ativo</Text>
                {subEndDate ? (
                  <Text style={styles.activeBannerSub}>Renovação em {subEndDate}</Text>
                ) : null}
              </View>
            </View>
            <View style={styles.checkWrap}>
              <MaterialIcons name="verified" size={28} color={Colors.success} />
            </View>
          </View>
        ) : (
          <View style={styles.inactiveBanner}>
            <MaterialIcons name="lock-outline" size={22} color={Colors.textMuted} />
            <View style={{ flex: 1 }}>
              <Text style={styles.inactiveBannerTitle}>Sem assinatura ativa</Text>
              <Text style={styles.inactiveBannerSub}>Assine para desbloquear todos os recursos</Text>
            </View>
          </View>
        )}

        {/* Plan Card */}
        <View style={[styles.planCard, isSubscribed && styles.planCardActive]}>
          {/* Badge */}
          <View style={styles.planBadgeRow}>
            <View style={styles.planBadge}>
              <MaterialIcons name="content-cut" size={14} color={Colors.textInverse} />
              <Text style={styles.planBadgeText}>PLANO BARBEIRO</Text>
            </View>
            {isSubscribed ? (
              <View style={styles.currentPlanBadge}>
                <Text style={styles.currentPlanBadgeText}>Seu plano</Text>
              </View>
            ) : null}
          </View>

          {/* Pricing */}
          <View style={styles.priceRow}>
            <Text style={styles.pricePrefix}>R$</Text>
            <Text style={styles.priceAmount}>49</Text>
            <Text style={styles.priceCents}>,90</Text>
            <Text style={styles.priceInterval}> /mês</Text>
          </View>
          <Text style={styles.priceNote}>Cobrado mensalmente • Cancele quando quiser</Text>

          <View style={styles.divider} />

          {/* Features */}
          <View style={styles.featureList}>
            {FEATURES.map(f => (
              <View key={f} style={styles.featureItem}>
                <View style={styles.featureCheck}>
                  <MaterialIcons name="check" size={14} color={Colors.textInverse} />
                </View>
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>

          <View style={styles.divider} />

          {/* Security badges */}
          <View style={styles.securityRow}>
            {[
              { icon: 'lock' as const, label: 'Pagamento seguro' },
              { icon: 'replay' as const, label: 'Cancele fácil' },
              { icon: 'verified-user' as const, label: 'Dados protegidos' },
            ].map(s => (
              <View key={s.label} style={styles.securityItem}>
                <MaterialIcons name={s.icon} size={16} color={Colors.primary} />
                <Text style={styles.securityLabel}>{s.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Action Button */}
        {isSubscribed ? (
          <View style={styles.actionGroup}>
            <Pressable
              style={[styles.manageBtn, loadingPortal && styles.btnDisabled]}
              onPress={handleManage}
              disabled={loadingPortal}
            >
              {loadingPortal
                ? <ActivityIndicator size={20} color={Colors.primary} />
                : <MaterialIcons name="settings" size={20} color={Colors.primary} />
              }
              <Text style={styles.manageBtnText}>Gerenciar Assinatura</Text>
              <MaterialIcons name="open-in-new" size={16} color={Colors.primary} />
            </Pressable>
            <Text style={styles.manageNote}>
              Cancele, altere método de pagamento ou atualize seus dados de faturamento pelo portal seguro do Stripe.
            </Text>
          </View>
        ) : (
          <View style={styles.actionGroup}>
            <Pressable
              style={[styles.subscribeBtn, loadingCheckout && styles.btnDisabled]}
              onPress={handleSubscribe}
              disabled={loadingCheckout}
            >
              {loadingCheckout ? (
                <ActivityIndicator size={20} color={Colors.textInverse} />
              ) : (
                <MaterialIcons name="star" size={20} color={Colors.textInverse} />
              )}
              <Text style={styles.subscribeBtnText}>
                {loadingCheckout ? 'Aguardando...' : 'Assinar Agora — R$ 49,90/mês'}
              </Text>
            </Pressable>
            <Text style={styles.subscribeNote}>
              Você será redirecionado para o checkout seguro do Stripe. Cancele a qualquer momento.
            </Text>
          </View>
        )}

        {/* FAQ */}
        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Perguntas Frequentes</Text>
          {[
            { q: 'Posso cancelar a qualquer momento?', a: 'Sim. Cancele pelo portal de assinatura sem taxa ou burocracia. Você mantém o acesso até o fim do período pago.' },
            { q: 'Como funciona a cobrança?', a: 'R$ 49,90 cobrados mensalmente no seu cartão via Stripe (PCI DSS compliant).' },
            { q: 'E se eu não for um barbeiro?', a: 'O plano é exclusivo para donos de barbearia. Clientes usam o app gratuitamente.' },
          ].map(item => (
            <View key={item.q} style={styles.faqItem}>
              <MaterialIcons name="help-outline" size={18} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.faqQ}>{item.q}</Text>
                <Text style={styles.faqA}>{item.a}</Text>
              </View>
            </View>
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
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: { paddingHorizontal: Spacing.lg, gap: Spacing.lg },

  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.successMuted,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.success}50`,
  },
  activeBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  activeIndicator: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.success },
  activeBannerTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.success },
  activeBannerSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  checkWrap: {},

  inactiveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface2,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inactiveBannerTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary },
  inactiveBannerSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },

  planCard: {
    backgroundColor: Colors.surface2,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.md,
  },
  planCardActive: {
    borderColor: Colors.primary,
    borderWidth: 2,
  },

  planBadgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: Radius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
  },
  planBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textInverse, letterSpacing: 1 },
  currentPlanBadge: {
    backgroundColor: Colors.successMuted,
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.success,
  },
  currentPlanBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.success },

  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  pricePrefix: { fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.primary, marginBottom: 6 },
  priceAmount: { fontSize: 52, fontWeight: FontWeight.extrabold, color: Colors.primary, lineHeight: 58 },
  priceCents: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.primary, marginBottom: 6 },
  priceInterval: { fontSize: FontSize.base, color: Colors.textSecondary, marginBottom: 8 },
  priceNote: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: -Spacing.sm },

  divider: { height: 1, backgroundColor: Colors.border },

  featureList: { gap: 10 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  featureCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary },

  securityRow: { flexDirection: 'row', justifyContent: 'space-around' },
  securityItem: { alignItems: 'center', gap: 4 },
  securityLabel: { fontSize: 10, color: Colors.textMuted, textAlign: 'center' },

  actionGroup: { gap: Spacing.sm },

  subscribeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 18,
    ...Shadow.gold,
  },
  subscribeBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textInverse },
  subscribeNote: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },

  manageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.primary,
    paddingVertical: 16,
  },
  manageBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.primary },
  manageNote: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', lineHeight: 18 },

  btnDisabled: { opacity: 0.6 },

  faqSection: { gap: Spacing.md },
  faqTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  faqItem: {
    flexDirection: 'row',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
  },
  faqQ: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, marginBottom: 4 },
  faqA: { fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
});
