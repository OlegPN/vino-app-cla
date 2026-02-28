import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, SafeAreaView, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { theme } from '../theme';
import { collectionApi } from '../api/wines';
import { WineCard } from '../components/WineCard';
import { CollectionItem, CollectionStatus } from '../types';

const TABS: { label: string; status: CollectionStatus }[] = [
  { label: '🍾 Есть', status: 'HAVE' },
  { label: '✅ Пробовал', status: 'DRANK' },
  { label: '❤️ Хочу', status: 'WISHLIST' },
];

export const CollectionScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [items, setItems] = useState<CollectionItem[]>([]);
  const [activeTab, setActiveTab] = useState<CollectionStatus>('HAVE');
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const loadCollection = async () => {
    setLoading(true);
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) { setIsLoggedIn(false); setLoading(false); return; }
    setIsLoggedIn(true);
    try {
      const r = await collectionApi.get();
      setItems(r.collection?.items || []);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { loadCollection(); }, []));

  const filtered = items.filter(i => i.status === activeTab);

  if (!isLoggedIn && !loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>🔒</Text>
          <Text style={styles.emptyText}>Войдите, чтобы увидеть коллекцию</Text>
          <Text style={styles.emptySubtext}>Перейдите в профиль для входа или регистрации</Text>
          <TouchableOpacity style={styles.loginBtn} onPress={() => navigation.navigate('Profile')}>
            <Text style={styles.loginBtnText}>Перейти в профиль →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.tabs}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t.status}
            style={[styles.tab, activeTab === t.status && styles.tabActive]}
            onPress={() => setActiveTab(t.status)}
          >
            <Text style={[styles.tabText, activeTab === t.status && styles.tabTextActive]}>{t.label}</Text>
            <Text style={[styles.tabCount, activeTab === t.status && styles.tabCountActive]}>
              {items.filter(i => i.status === t.status).length}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <WineCard
              wine={item.wine}
              onPress={() => navigation.navigate('WineDetail', { wineId: item.wine.id })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🍷</Text>
              <Text style={styles.emptyText}>Здесь пока ничего нет</Text>
              <Text style={styles.emptySubtext}>Найдите вино и добавьте его в коллекцию</Text>
            </View>
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  tabs: { flexDirection: 'row', backgroundColor: theme.colors.white, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  tab: { flex: 1, paddingVertical: theme.spacing.md, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: theme.colors.primary },
  tabText: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, fontWeight: theme.fontWeight.medium },
  tabTextActive: { color: theme.colors.primary, fontWeight: theme.fontWeight.bold },
  tabCount: { fontSize: theme.fontSize.xs, color: theme.colors.textLight, backgroundColor: theme.colors.surfaceAlt, paddingHorizontal: 6, paddingVertical: 2, borderRadius: theme.borderRadius.full },
  tabCountActive: { color: theme.colors.primary, backgroundColor: theme.colors.surfaceAlt },
  empty: { flex: 1, alignItems: 'center', marginTop: 80, padding: theme.spacing.xl },
  emptyIcon: { fontSize: 56, marginBottom: theme.spacing.md },
  emptyText: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.text, marginBottom: theme.spacing.sm, textAlign: 'center' },
  emptySubtext: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary, textAlign: 'center' },
  loginBtn: { marginTop: 20, backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.full, paddingHorizontal: 32, paddingVertical: 12 },
  loginBtnText: { color: '#fff', fontWeight: theme.fontWeight.semibold, fontSize: theme.fontSize.md },
});
