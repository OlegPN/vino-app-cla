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
  { label: 'All', value: '' },
  { label: '🍷 Red', value: 'RED' },
  { label: '🥂 White', value: 'WHITE' },
  { label: '🌸 Rosé', value: 'ROSE' },
  { label: '🍾 Sparkling', value: 'SPARKLING' },
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

  const handleSearch = async () => {
    if (!query && !selectedType) return;
    setSearching(true);
    try {
      const r = await winesApi.search({ q: query, type: selectedType || undefined });
      setSearchResults(r.wines);
    } finally {
      setSearching(false);
    }
  };

  const displayWines = searchResults.length > 0 || query ? searchResults : trending;
  const title = searchResults.length > 0 || query ? `Results (${searchResults.length})` : 'Trending 🔥';

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchRow}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search wines, wineries..."
          placeholderTextColor={theme.colors.textLight}
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          <Text style={styles.searchBtnText}>🔍</Text>
        </TouchableOpacity>
      </View>

      {/* Type filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow} contentContainerStyle={styles.filtersContent}>
        {WINE_TYPES.map(t => (
          <TouchableOpacity
            key={t.value}
            style={[styles.filterChip, selectedType === t.value && styles.filterChipActive]}
            onPress={() => { setSelectedType(t.value); setSearchResults([]); }}
          >
            <Text style={[styles.filterChipText, selectedType === t.value && styles.filterChipTextActive]}>
              {t.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <Text style={styles.sectionTitle}>{title}</Text>

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={displayWines}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <WineCard wine={item} onPress={() => navigation.navigate('WineDetail', { wineId: item.id })} />
          )}
          ListEmptyComponent={<Text style={styles.empty}>No wines found</Text>}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  searchRow: {
    flexDirection: 'row',
    margin: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    fontSize: theme.fontSize.md,
    color: theme.colors.text,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchBtn: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.borderRadius.full,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBtnText: { fontSize: 20 },
  filtersRow: { maxHeight: 48 },
  filtersContent: { paddingHorizontal: theme.spacing.md, gap: theme.spacing.sm, alignItems: 'center' },
  filterChip: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.white,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterChipActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
  filterChipText: { fontSize: theme.fontSize.sm, color: theme.colors.text },
  filterChipTextActive: { color: theme.colors.white, fontWeight: theme.fontWeight.semibold },
  sectionTitle: {
    fontSize: theme.fontSize.xl,
    fontWeight: theme.fontWeight.bold,
    color: theme.colors.text,
    marginLeft: theme.spacing.md,
    marginVertical: theme.spacing.md,
  },
  empty: { textAlign: 'center', color: theme.colors.textLight, marginTop: 40, fontSize: theme.fontSize.md },
});
