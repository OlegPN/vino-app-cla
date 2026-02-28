import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  TextInput, ScrollView, Platform, ActivityIndicator, Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme';
import { authApi } from '../api/wines';
import { telegramApi } from '../api/telegram';

// ── Telegram Login Widget (web only) ─────────────────────────────────────────
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

// ── Main Component ────────────────────────────────────────────────────────────
export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [mode, setMode]             = useState<'login' | 'register'>('login');
  const [name, setName]             = useState('');
  const [password, setPassword]     = useState('');
  const [loading, setLoading]       = useState(false);
  const [loggedIn, setLoggedIn]     = useState(false);
  const [user, setUser]             = useState<any>(null);
  const [error, setError]           = useState('');

  useEffect(() => {
    AsyncStorage.getItem('auth_token').then(token => {
      if (token) {
        AsyncStorage.getItem('auth_user').then(u => {
          if (u) { setUser(JSON.parse(u)); setLoggedIn(true); }
        });
      }
    });
  }, []);

  const saveSession = async (r: any) => {
    const token = r.accessToken || r.token;
    await AsyncStorage.setItem('auth_token', token);
    await AsyncStorage.setItem('auth_user', JSON.stringify(r.user));
    setUser(r.user);
    setLoggedIn(true);
  };

  const handleSubmit = async () => {
    setError('');
    if (!name.trim()) { setError('Введите имя'); return; }
    if (password.length < 6) { setError('Пароль — минимум 6 символов'); return; }
    setLoading(true);
    try {
      if (mode === 'login') {
        const r = await authApi.login(name.trim(), password);
        await saveSession(r);
      } else {
        const r = await authApi.register({ displayName: name.trim(), password });
        await saveSession(r);
      }
    } catch (e: any) {
      setError(e.message || 'Что-то пошло не так');
    } finally {
      setLoading(false);
    }
  };

  const handleTelegramAuth = async (tgUser: any) => {
    setLoading(true);
    setError('');
    try {
      const r = await telegramApi.login(tgUser);
      await saveSession(r);
    } catch (e: any) {
      setError(e.message || 'Ошибка входа через Telegram');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
    setLoggedIn(false);
    setUser(null);
    setName(''); setPassword(''); setError('');
  };

  // ── Logged in ─────────────────────────────────────────────────────────────
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
          {user.telegramId && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>✈️ Telegram</Text>
            </View>
          )}
          <View style={styles.statsRow}>
            <View style={styles.stat}><Text style={styles.statNum}>0</Text><Text style={styles.statLabel}>Отзывы</Text></View>
            <View style={styles.stat}><Text style={styles.statNum}>0</Text><Text style={styles.statLabel}>Подписки</Text></View>
            <View style={styles.stat}><Text style={styles.statNum}>0</Text><Text style={styles.statLabel}>Подписчики</Text></View>
          </View>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Выйти</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.authContent} keyboardShouldPersistTaps="handled">
        <Text style={styles.logo}>🍷</Text>
        <Text style={styles.title}>
          {mode === 'login' ? 'Войти' : 'Регистрация'}
        </Text>

        {/* Telegram */}
        <View style={styles.telegramWrap}>
          <TelegramLoginButton onAuth={handleTelegramAuth} />
        </View>

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>или</Text>
          <View style={styles.line} />
        </View>

        {/* Name */}
        <TextInput
          style={styles.input}
          placeholder="Имя"
          value={name}
          onChangeText={t => { setName(t); setError(''); }}
          placeholderTextColor={theme.colors.textLight}
          autoCapitalize="words"
        />

        {/* Password */}
        <TextInput
          style={styles.input}
          placeholder="Пароль"
          value={password}
          onChangeText={t => { setPassword(t); setError(''); }}
          secureTextEntry
          placeholderTextColor={theme.colors.textLight}
        />

        {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, loading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>{mode === 'login' ? 'Войти' : 'Зарегистрироваться'}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}>
          <Text style={styles.switchText}>
            {mode === 'login' ? 'Нет аккаунта? Зарегистрироваться' : 'Уже есть аккаунт? Войти'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  authContent: { padding: theme.spacing.xl, alignItems: 'center', gap: theme.spacing.md, paddingBottom: 40 },
  logo: { fontSize: 64 },
  title: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  telegramWrap: { width: '100%', alignItems: 'center', minHeight: 52 },
  divider: { flexDirection: 'row', alignItems: 'center', width: '100%' },
  line: { flex: 1, height: 1, backgroundColor: theme.colors.border },
  dividerText: { marginHorizontal: theme.spacing.md, color: theme.colors.textLight, fontSize: theme.fontSize.sm },
  input: {
    width: '100%', backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md, padding: theme.spacing.md,
    fontSize: theme.fontSize.md, color: theme.colors.text,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  errorText: { color: '#E53E3E', fontSize: theme.fontSize.sm, alignSelf: 'flex-start' },
  btn: {
    width: '100%', backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.md, padding: theme.spacing.md,
    alignItems: 'center', minHeight: 48, justifyContent: 'center',
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold },
  switchText: { color: theme.colors.primary, fontSize: theme.fontSize.sm },
  profileContent: { padding: theme.spacing.xl, alignItems: 'center', gap: theme.spacing.md },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center' },
  avatarInitials: { fontSize: theme.fontSize.xxxl, color: '#fff', fontWeight: theme.fontWeight.bold },
  displayName: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  badge: { backgroundColor: '#E8F4FD', borderRadius: theme.borderRadius.full, paddingHorizontal: theme.spacing.md, paddingVertical: 4, borderWidth: 1, borderColor: '#90CDF4' },
  badgeText: { color: '#2B6CB0', fontSize: theme.fontSize.sm },
  statsRow: { flexDirection: 'row', gap: theme.spacing.xl, marginVertical: theme.spacing.md },
  stat: { alignItems: 'center' },
  statNum: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  statLabel: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  logoutBtn: { marginTop: theme.spacing.lg, paddingHorizontal: 32, paddingVertical: 12, borderRadius: theme.borderRadius.full, borderWidth: 1, borderColor: theme.colors.primary },
  logoutText: { color: theme.colors.primary, fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.md },
});
