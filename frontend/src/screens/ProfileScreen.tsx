import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, Alert, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme';
import { authApi } from '../api/wines';

export const ProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);

  React.useEffect(() => {
    AsyncStorage.getItem('auth_token').then(token => {
      if (token) {
        AsyncStorage.getItem('auth_user').then(u => {
          if (u) { setUser(JSON.parse(u)); setLoggedIn(true); }
        });
      }
    });
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const r = await authApi.login(email, password);
      await AsyncStorage.setItem('auth_token', (r as any).accessToken || (r as any).token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(r.user));
      setUser(r.user);
      setLoggedIn(true);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    try {
      const r = await authApi.register({ email, password, username, displayName });
      await AsyncStorage.setItem('auth_token', (r as any).accessToken || (r as any).token);
      await AsyncStorage.setItem('auth_user', JSON.stringify(r.user));
      setUser(r.user);
      setLoggedIn(true);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
    setLoggedIn(false);
    setUser(null);
  };

  if (loggedIn && user) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.profileContent}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitials}>
              {user.displayName?.charAt(0).toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={styles.displayName}>{user.displayName}</Text>
          <Text style={styles.username}>@{user.username}</Text>
          <Text style={styles.email}>{user.email}</Text>

          <View style={styles.statsRow}>
            <View style={styles.stat}><Text style={styles.statNum}>0</Text><Text style={styles.statLabel}>Reviews</Text></View>
            <View style={styles.stat}><Text style={styles.statNum}>0</Text><Text style={styles.statLabel}>Following</Text></View>
            <View style={styles.stat}><Text style={styles.statNum}>0</Text><Text style={styles.statLabel}>Followers</Text></View>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.authContent}>
        <Text style={styles.logo}>🍷</Text>
        <Text style={styles.title}>{mode === 'login' ? 'Welcome back' : 'Create account'}</Text>

        {mode === 'register' && (
          <>
            <TextInput style={styles.input} placeholder="Display Name" value={displayName} onChangeText={setDisplayName} placeholderTextColor={theme.colors.textLight} />
            <TextInput style={styles.input} placeholder="Username" value={username} onChangeText={setUsername} autoCapitalize="none" placeholderTextColor={theme.colors.textLight} />
          </>
        )}
        <TextInput style={styles.input} placeholder="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholderTextColor={theme.colors.textLight} />
        <TextInput style={styles.input} placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={theme.colors.textLight} />

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={mode === 'login' ? handleLogin : handleRegister}
          disabled={loading}
        >
          <Text style={styles.btnText}>{loading ? 'Loading...' : mode === 'login' ? 'Login' : 'Register'}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setMode(mode === 'login' ? 'register' : 'login')}>
          <Text style={styles.switchText}>
            {mode === 'login' ? "Don't have an account? Register" : 'Already have an account? Login'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  authContent: { padding: theme.spacing.xl, alignItems: 'center', gap: theme.spacing.md },
  logo: { fontSize: 64, marginBottom: theme.spacing.sm },
  title: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.text, marginBottom: theme.spacing.md },
  input: { width: '100%', backgroundColor: theme.colors.white, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, fontSize: theme.fontSize.md, color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border },
  btn: { width: '100%', backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, alignItems: 'center', marginTop: theme.spacing.sm },
  btnText: { color: '#fff', fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold },
  switchText: { color: theme.colors.primary, fontSize: theme.fontSize.sm, marginTop: theme.spacing.sm },
  profileContent: { padding: theme.spacing.xl, alignItems: 'center', gap: theme.spacing.md },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: theme.colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing.sm },
  avatarInitials: { fontSize: theme.fontSize.xxxl, color: '#fff', fontWeight: theme.fontWeight.bold },
  displayName: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  username: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary },
  email: { fontSize: theme.fontSize.sm, color: theme.colors.textLight },
  statsRow: { flexDirection: 'row', gap: theme.spacing.xl, marginVertical: theme.spacing.md },
  stat: { alignItems: 'center' },
  statNum: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.text },
  statLabel: { fontSize: theme.fontSize.xs, color: theme.colors.textSecondary },
  logoutBtn: { marginTop: theme.spacing.lg, paddingHorizontal: 32, paddingVertical: 12, borderRadius: theme.borderRadius.full, borderWidth: 1, borderColor: theme.colors.primary },
  logoutText: { color: theme.colors.primary, fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.md },
});
