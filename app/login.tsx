import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAlert } from '@/template';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserRole } from '@/contexts/AuthContext';
import { Colors, FontSize, FontWeight, Spacing, Radius, Shadow } from '@/constants/theme';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, operationLoading } = useAuth();
  const { showAlert } = useAlert();

  const [role, setRole] = useState<UserRole>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) e.email = 'E-mail é obrigatório';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'E-mail inválido';
    if (!password) e.password = 'Senha é obrigatória';
    else if (password.length < 6) e.password = 'Mínimo 6 caracteres';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      await login(email, password, role);
      router.replace('/(tabs)');
    } catch (err: any) {
      showAlert('Erro ao entrar', err?.message ?? 'Verifique suas credenciais e tente novamente.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo */}
        <View style={styles.logoArea}>
          <View style={styles.logoMark}>
            <MaterialIcons name="content-cut" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.logoText}>BARBAR</Text>
          <Text style={styles.logoSub}>.APP</Text>
        </View>

        <Text style={styles.heading}>Bem-vindo de volta</Text>
        <Text style={styles.subheading}>Acesse sua conta com segurança</Text>

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
              <Text style={[styles.roleBtnText, role === r && styles.roleBtnTextActive]}>
                {r === 'barber' ? 'Barbeiro' : 'Cliente'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label="E-mail"
            leftIcon="email"
            placeholder="seu@email.com"
            value={email}
            onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: undefined })); }}
            keyboardType="email-address"
            error={errors.email}
            autoCapitalize="none"
          />
          <Input
            label="Senha"
            leftIcon="lock"
            placeholder="••••••••"
            value={password}
            onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
            isPassword
            error={errors.password}
          />
          <Pressable style={styles.forgotBtn}>
            <Text style={styles.forgotText}>Esqueci minha senha</Text>
          </Pressable>
        </View>

        <Pressable
          style={[styles.loginBtn, operationLoading && styles.loginBtnDisabled]}
          onPress={handleLogin}
          disabled={operationLoading}
        >
          {operationLoading ? (
            <ActivityIndicator size={20} color={Colors.textInverse} />
          ) : (
            <MaterialIcons name="lock-open" size={20} color={Colors.textInverse} />
          )}
          <Text style={styles.loginBtnText}>{operationLoading ? 'Entrando...' : 'Entrar'}</Text>
        </Pressable>

        {/* Register */}
        <View style={styles.registerRow}>
          <Text style={styles.registerText}>Não tem conta? </Text>
          <Pressable onPress={() => router.push('/register')}>
            <Text style={styles.registerLink}>Cadastrar</Text>
          </Pressable>
        </View>

        {/* Security note */}
        <View style={styles.securityNote}>
          <MaterialIcons name="verified-user" size={14} color={Colors.success} />
          <Text style={styles.securityNoteText}>Conexão segura • Dados criptografados (JWT)</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: Spacing.lg, gap: Spacing.lg },

  logoArea: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  logoMark: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    backgroundColor: Colors.primaryMuted,
    borderWidth: 1,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.gold,
  },
  logoText: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, letterSpacing: 3 },
  logoSub: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.primary, letterSpacing: 3 },

  heading: { fontSize: FontSize.xxxl, fontWeight: FontWeight.bold, color: Colors.textPrimary, letterSpacing: -0.5 },
  subheading: { fontSize: FontSize.base, color: Colors.textSecondary, marginTop: -8 },

  roleToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface2,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 4,
    gap: 4,
  },
  roleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  roleBtnActive: { backgroundColor: Colors.primaryMuted, borderWidth: 1, borderColor: Colors.primary },
  roleBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.medium, color: Colors.textMuted },
  roleBtnTextActive: { color: Colors.primary },

  form: { gap: Spacing.md },
  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: { fontSize: FontSize.sm, color: Colors.primary, fontWeight: FontWeight.medium },

  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
    paddingVertical: 16,
    ...Shadow.gold,
  },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnText: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textInverse },

  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerText: { fontSize: FontSize.sm, color: Colors.textSecondary },
  registerLink: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.primary },

  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  securityNoteText: { fontSize: FontSize.xs, color: Colors.textMuted },
});
