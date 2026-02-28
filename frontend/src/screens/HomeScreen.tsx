import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  TextInput, TouchableOpacity, SafeAreaView, ScrollView,
} from 'react-native';
import { theme } from '../theme';
import { WineCard } from '../components/WineCard';
import { winesApi } from '../api/wines';
import { Wine } from '../types';

const WINE_TYPES = [
  { label: 'Все', value: '' },
  { label: '🍷 Красное', value: 'RED' },
  { label: '🥂 Белое', value: 'WHITE' },
  { label: '🌸 Розовое', value: 'ROSE' },
  { label: '🍾 Игристое', value: 'SPARKLING' },
  { label: '🍯 Десертное', value: 'DESSERT' },
  { label: '🥃 Крепленое', value: 'FORTIFIED' },
];

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [trending, setTrending] = useState<Wine[]>([]);
  const [searchResults, setSearchResults] = useState<Wine[]>([]);
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    winesApi.trending()
      .then(r => setTrending(r.wines))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = async (type?: string, q?: string) => {
    const activeType = type !== undefined ? type : selectedType;
    const activeQuery = q !== undefined ? q : query;
    if (!activeQuery && !activeType) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const r = await winesApi.search({ q: activeQuery, type: activeType || undefined });
      setSearchResults(r.wines);
    } finally {
      setSearching(false);
    }
  };

  const displayWines = searchResults.length > 0 || query || selectedType ? searchResults : trending;
  const title = query || selectedType
    ? `Результаты (${searchResults.length})`
    : 'Популярное 🔥';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Поиск вин, производителей..."
          placeholderTextColor={theme.colors.textLight}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => handleSearch()}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={() => handleSearch()}>
          <Text style={styles.searchBtnText}>🔍</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filtersRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
          {WINE_TYPES.map(t => (
            <TouchableOpacity
              key={t.value}
              style={[styles.filterChip, selectedType === t.value && styles.filterChipActive]}
              onPress={() => { setSelectedType(t.value); handleSearch(t.value, query); }}
            >
              <Text style={[styles.filterChipText, selectedType === t.value && styles.filterChipTextActive]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <Text style={styles.sectionTitle}>{title}</Text>

      {loading || searching ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={displayWines}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <WineCard wine={item} onPress={() => navigation.navigate('WineDetail', { wineId: item.id })} />
          )}
          ListEmptyComponent={<Text style={styles.empty}>Вина не найдены</Text>}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  searchRow: { flexDirection: 'row', margin: theme.spacing.md, gap: theme.spacing.sm },
  searchInput: {
    flex: 1, backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md, color: theme.colors.text,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  searchBtn: {
    backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.full,
    width: 44, height: 44, justifyContent: 'center', alignItems: 'center',
  },
  searchBtnText: { fontSize: 20 },
  filtersRow: { height: 56, marginBottom: 4 },
  filtersContent: { paddingHorizontal: theme.spacing.md, gap: theme.spacing.sm, alignItems: 'center', paddingVertical: 8 },
  filterChip: {
    paddingHorizontal: theme.spacing.md, paddingVertical: 6,
    borderRadius: theme.borderRadius.full, backgroundColor: theme.colors.white,
    borderWidth: 1, borderColor: theme.colors.border,
  },
  filterChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterChipText: { fontSize: theme.fontSize.sm, color: theme.colors.text },
  filterChipTextActive: { color: theme.colors.white, fontWeight: theme.fontWeight.semibold },
  sectionTitle: {
    fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold,
    color: theme.colors.text, marginLeft: theme.spacing.md, marginVertical: theme.spacing.md,
  },
  empty: { textAlign: 'center', color: theme.colors.textLight, marginTop: 40, fontSize: theme.fontSize.md },
});
