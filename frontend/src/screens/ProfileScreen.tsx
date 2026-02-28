import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  TextInput, Alert, ScrollView, Platform, ActivityIndicator, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme';
import { authApi } from '../api/wines';
import { telegramApi } from '../api/telegram';

// ── Telegram Login Widget (web only) ────────────────────────────────────────
const TelegramLoginButton: React.FC<{ onAuth: (user: any) => void }> = ({ onAuth }) => {
  const ref = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS !== 'web' || !ref.current) return;
    (window as any).onTelegramAuth = (tgUser: any) => onAuth(tgUser);

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.setAttribute('data-telegram-login', 'provin0_bot');
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-radius', '8');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.async = true;
    ref.current.innerHTML = '';
    ref.current.appendChild(script);

    return () => { delete (window as any).onTelegramAuth; };
  }, [onAuth]);

  if (Platform.OS !== 'web') return null;
  return <div ref={ref} style={{ marginTop: 8, marginBottom: 8, display: 'flex', justifyContent: 'center' }} />;
};

// ── Helpers ─────────────────────────────────────────────────────────────────
function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validatePassword(pw: string) {
  return pw.length >= 6;
}
function validateUsername(u: string) {
  return /^[a-zA-Z0-9_]{3,30}$/.test(u);
}

interface FieldError { email?: string; password?: string; username?: string; displayName?: string; }

// ── Main Component ───────────────────────────────────────────────────────────
export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [username, setUsername]     = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading]       = useState(false);
  const [loggedIn, setLoggedIn]     = useState(false);
  const [user, setUser]             = useState<any>(null);
  const [errors, setErrors]         = useState<FieldError>({});
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('auth_token').then(token => {
      if (token) {
        AsyncStorage.getItem('auth_user').then(u => {
          if (u) { setUser(JSON.parse(u)); setLoggedIn(true); }
        });
      }
    });
  }, []);

  // ── Validation ─────────────────────────────────────────────────────────────
  const validateLogin = (): boolean => {
    const errs: FieldError = {};
    if (!validateEmail(email)) errs.email = 'Введите корректный email';
    if (!validatePassword(password)) errs.password = 'Пароль минимум 6 символов';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateRegister = (): boolean => {
    const errs: FieldError = {};
    if (!displayName.trim()) errs.displayName = 'Введите имя';
    if (!validateUsername(username)) errs.username = 'Только буквы, цифры, _ (3–30 символов)';
    if (!validateEmail(email)) errs.email = 'Введите корректный email';
    if (!validatePassword(password)) errs.password = 'Пароль минимум 6 символов';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const saveSession = async (r: any) => {
    const token = r.accessToken || r.token;
    await AsyncStorage.setItem('auth_token', token);
    await AsyncStorage.setItem('auth_user', JSON.stringify(r.user));
    setUser(r.user);
    setLoggedIn(true);
  };

  const handleTelegramAuth = async (tgUser: any) => {
    setLoading(true);
    setServerError('');
    try {
      const r = await telegramApi.login(tgUser);
      await saveSession(r);
    } catch (e: any) {
      setServerError(e.message || 'Ошибка входа через Telegram');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setServerError('');
    if (!validateLogin()) return;
    setLoading(true);
    try {
      const r = await authApi.login(email, password);
      await saveSession(r);
    } catch (e: any) {
      setServerError(e.message === 'Invalid credentials' ? 'Неверный email или пароль' : e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setServerError('');
    if (!validateRegister()) return;
    setLoading(true);
    try {
      const r = await authApi.register({ email, password, username, displayName });
      await saveSession(r);
    } catch (e: any) {
      if (e.message?.includes('already taken') || e.message?.includes('409')) {
        setServerError('Email или username уже заняты');
      } else {
        setServerError(e.message || 'Ошибка регистрации');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
    setLoggedIn(false);
    setUser(null);
    setEmail(''); setPassword(''); setUsername(''); setDisplayName('');
    setErrors({}); setServerError('');
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setErrors({});
    setServerError('');
  };

  // ── Logged-in view ─────────────────────────────────────────────────────────
  if (loggedIn && user) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.profileContent}>
          {user.avatarUrl ? (
            <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarInitials}>
                {user.displayName?.charAt(0).toUpperCase() || '?'}
              </Text>
            </View>
          )}
          <Text style={styles.displayName}>{user.displayName}</Text>
          {user.username && <Text style={styles.username}>@{user.username}</Text>}
          {user.email && <Text style={styles.email}>{user.email}</Text>}
          {user.telegramId && (
            <View style={styles.telegramBadge}>
              <Text style={styles.telegramBadgeText}>✈️ Telegram аккаунт</Text>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statNum}>0</Text>
              <Text style={styles.statLabel}>Отзывы</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>0</Text>
              <Text style={styles.statLabel}>Подписки</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statNum}>0</Text>
              <Text style={styles.statLabel}>Подписчики</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Выйти</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Auth view ──────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.authContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>🍷</Text>
        <Text style={styles.title}>
          {mode === 'login' ? 'Добро пожаловать' : 'Создать аккаунт'}
        </Text>

        {/* Telegram */}
        <View style={styles.telegramSection}>
          <TelegramLoginButton onAuth={handleTelegramAuth} />
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>или</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Register fields */}
        {mode === 'register' && (
          <>
            <View style={styles.fieldWrap}>
              <TextInput
                style={[styles.input, errors.displayName && styles.inputError]}
                placeholder="Имя (отображается в профиле)"
                value={displayName}
                onChangeText={t => { setDisplayName(t); setErrors(e => ({ ...e, displayName: undefined })); }}
                placeholderTextColor={theme.colors.textLight}
              />
              {errors.displayName && <Text style={styles.errorText}>{errors.displayName}</Text>}
            </View>
            <View style={styles.fieldWrap}>
              <TextInput
                style={[styles.input, errors.username && styles.inputError]}
                placeholder="Username (латиница, цифры, _)"
                value={username}
                onChangeText={t => { setUsername(t.toLowerCase()); setErrors(e => ({ ...e, username: undefined })); }}
                autoCapitalize="none"
                placeholderTextColor={theme.colors.textLight}
              />
              {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
            </View>
          </>
        )}

        <View style={styles.fieldWrap}>
          <TextInput
            style={[styles.input, errors.email && styles.inputError]}
            placeholder="Email"
            value={email}
            onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: undefined })); }}
            autoCapitalize="none"
            keyboardType="email-address"
            placeholderTextColor={theme.colors.textLight}
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
        </View>

        <View style={styles.fieldWrap}>
          <TextInput
            style={[styles.input, errors.password && styles.inputError]}
            placeholder="Пароль (минимум 6 символов)"
            value={password}
            onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
            secureTextEntry
            placeholderTextColor={theme.colors.textLight}
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
        </View>

        {serverError ? (
          <View style={styles.serverError}>
            <Text style={styles.serverErrorText}>⚠️ {serverError}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={mode === 'login' ? handleLogin : handleRegister}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>{mode === 'login' ? 'Войти' : 'Зарегистрироваться'}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={switchMode} style={styles.switchWrap}>
          <Text style={styles.switchText}>
            {mode === 'login'
              ? 'Нет аккаунта? Зарегистрироваться'
              : 'Уже есть аккаунт? Войти'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },

  // Auth
  authContent: { padding: theme.spacing.xl, alignItems: 'center', gap: theme.spacing.sm, paddingBottom: 40 },
  logo: { fontSize: 64, marginBottom: 4 },
  title: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.text, marginBottom: theme.spacing.sm },
  telegramSection: { width: '100%', alignItems: 'center', minHeight: 52 },
  divider: { flexDirection: 'row', alignItems: 'center', width: '100%', marginVertical: theme.spacing.sm },
  dividerLine: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { marginHorizontal: theme.spacing.md, color: theme.colors.textLight, fontSize: theme.fontSize.sm },
  fieldWrap: { width: '100%', marginBottom: 4 },
  input: {
    width: '100%', backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md, padding: theme.spacing.md,
    fontSize: theme.fontSize.md, color: theme.colors.text,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  inputError: { borderColor: '#E53E3E' },
  errorText: { color: '#E53E3E', fontSize: theme.fontSize.xs, marginTop: 4, marginLeft: 4 },
  serverError: {
    width: '100%', backgroundColor: '#FFF5F5', borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md, borderWidth: 1, borderColor: '#FED7D7',
  },
  serverErrorText: { color: '#C53030', fontSize: theme.fontSize.sm },
  btn: {
    width: '100%', backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md, padding: theme.spacing.md,
    alignItems: 'center', marginTop: theme.spacing.sm, minHeight: 48, justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold },
  switchWrap: { marginTop: theme.spacing.sm },
  switchText: { color: theme.colors.primary, fontSize: theme.fontSize.sm },

  // Profile
  profileContent: { padding: theme.spacing.xl, alignItems: 'center', gap: theme.spacing.md },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: theme.spacing.sm },
  avatarCircle: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: theme.colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.sm,
  },
  avatarInitials: { fontSize: theme.fontSize.xxxl, color: '#fff', fontWeight: theme.fontWeight.bold },
  displayName: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  username: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary },
  email: { fontSize: theme.fontSize.sm, color: theme.colors.textLight },
  telegramBadge: {
    backgroundColor: '#E8F4FD', borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md, paddingVertical: 4,
    borderWidth: 1, borderColor: '#90CDF4',
  },
  telegramBadgeText: { color: '#2B6CB0', fontSize: theme.fontSize.sm },
  statsRow: { flexDirection: 'row', gap: theme.spacing.xl, marginVertical: theme.spacing.md },
  stat: { alignItems: 'center' },
  statNum: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  statLabel: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  logoutBtn: {
    marginTop: theme.spacing.lg, paddingHorizontal: 32, paddingVertical: 12,
    borderRadius: theme.borderRadius.full, borderWidth: 1, borderColor: theme.colors.primary,
  },
  logoutText: { color: theme.colors.primary, fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.md },
});
