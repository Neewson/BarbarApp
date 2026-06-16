import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAlert } from '@/template';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserRole } from '@/contexts/AuthContext';
import { Colors, FontSize, FontWeight, Spacing, Radius } from '@/constants/theme';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register, isLoading } = useAuth();
  const { showAlert } = useAlert();

  const [role, setRole] = useState<UserRole>('client');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Nome é obrigatório';
    if (!phone.trim()) e.phone = 'Telefone é obrigatório';
    if (!whatsapp.trim()) e.whatsapp = 'WhatsApp é obrigatório';
    if (!password) e.password = 'Senha é obrigatória';
    else if (password.length < 6) e.password = 'Mínimo 6 caracteres';
    if (password !== confirm) e.confirm = 'Senhas não conferem';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;
    try {
      await register({ name, email, phone, whatsapp, password, role });
      router.replace('/(tabs)');
    } catch {
      showAlert('Erro', 'Não foi possível criar sua conta. Tente novamente.');
    }
  };

  const field = (key: string, v: string, fn: (t: string) => void) => ({
    value: v,
    onChangeText: (t: string) => { fn(t); setErrors(e => { const n = { ...e }; delete n[key]; return n; }); },
    error: errors[key],
  });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <MaterialIcons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <View style={styles.logoRow}>
            <View style={styles.logoMark}>
              <MaterialIcons name="content-cut" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.logoText}>BARBAR<Text style={{ color: Colors.primary }}>.APP</Text></Text>
          </View>
        </View>

        <Text style={styles.heading}>Criar Conta</Text>
        <Text style={styles.subheading}>Preencha seus dados para começar</Text>

        {/* Role Toggle */}
        <View style={styles.roleToggle}>
          {(['client', 'barber'] as UserRole[]).map(r => (
            <Pressable
              key={r}
              style={[styles.roleBtn, role === r && styles.roleBtnActive]}
              onPress={() => setRole(r)}
            >
              <MaterialIcons
                name={r === 'barber' ? 'content-cut' : 'person'}
                size={18}
                color={role === r ? Colors.primary : Colors.textMuted}
              />
              <View>
                <Text style={[styles.roleBtnTitle, role === r && styles.roleBtnTitleActive]}>
                  {r === 'barber' ? 'Barbeiro' : 'Cliente'}
                </Text>
                <Text style={styles.roleBtnSub}>
                  {r === 'barber' ? 'Gerenciar barbearia' : 'Agendar serviços'}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>

        <View style={styles.form}>
          <Input
            label="Nome completo"
            leftIcon="person"
            placeholder="João Silva"
            {...field('name', name, setName)}
            autoCapitalize="words"
          />
          <Input
            label="Telefone"
            leftIcon="phone"
            placeholder="(11) 99999-9999"
            {...field('phone', phone, setPhone)}
            keyboardType="phone-pad"
          />
          <Input
            label="WhatsApp"
            leftIcon="chat"
            placeholder="(11) 99999-9999"
            {...field('whatsapp', whatsapp, setWhatsapp)}
            keyboardType="phone-pad"
          />
          <Input
            label="E-mail (opcional)"
            leftIcon="email"
            placeholder="seu@email.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            label="Senha"
            leftIcon="lock"
            placeholder="Mínimo 6 caracteres"
            {...field('password', password, setPassword)}
            isPassword
          />
          <Input
            label="Confirmar senha"
            leftIcon="lock-outline"
            placeholder="Repita sua senha"
            {...field('confirm', confirm, setConfirm)}
            isPassword
          />
        </View>

        <View style={styles.terms}>
          <MaterialIcons name="security" size={16} color={Colors.primary} />
          <Text style={styles.termsText}>
            Seus dados são protegidos com criptografia de ponta. Ao se cadastrar, você concorda com nossa{' '}
            <Text style={styles.termsLink}>Política de Privacidade</Text> (LGPD).
          </Text>
        </View>

        <Button
          title="Criar Minha Conta"
          onPress={handleRegister}
          loading={isLoading}
          fullWidth
          size="lg"
        />

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Já tem conta? </Text>
          <Pressable onPress={() => router.replace('/login')}>
            <Text style={styles.loginLink}>Entrar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },

  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    letterSpacing: 2,
  },

  heading: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  subheading: { fontSize: FontSize.base, color: Colors.textSecondary, marginTop: -8 },

  roleToggle: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleBtnActive: {
    backgroundColor: Colors.primaryMuted,
    borderColor: Colors.primary,
  },
  roleBtnTitle: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textMuted },
  roleBtnTitleActive: { color: Colors.primary },
  roleBtnSub: { fontSize: FontSize.xs, color: Colors.textMuted, marginTop: 2 },

  form: { gap: Spacing.md },

  terms: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Colors.primaryMuted,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
  },
  termsText: { flex: 1, fontSize: FontSize.xs, color: Colors.textSecondary, lineHeight: 18 },
  termsLink: { color: Colors.primary, fontWeight: FontWeight.semibold },

  loginRow: { flexDirection: 'row', justifyContent: 'center' },
  loginText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  loginLink: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },
});
