import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { theme } from '../theme';
import { Wine } from '../types';

const WINE_TYPE_LABEL: Record<string, string> = {
  RED: '🍷 Red', WHITE: '🥂 White', ROSE: '🌸 Rosé',
  SPARKLING: '🍾 Sparkling', DESSERT: '🍯 Dessert', FORTIFIED: '🥃 Fortified',
};

const WINE_TYPE_COLORS: Record<string, { bg: string; text: string; emoji: string }> = {
  RED:       { bg: '#6B2020', text: '#F5E6E6', emoji: '🍷' },
  WHITE:     { bg: '#C8A84B', text: '#FFF8E7', emoji: '🥂' },
  ROSE:      { bg: '#D4687A', text: '#FFF0F3', emoji: '🌸' },
  SPARKLING: { bg: '#2C5F8A', text: '#E8F4FD', emoji: '🍾' },
  DESSERT:   { bg: '#8B6914', text: '#FFF8E1', emoji: '🍯' },
  FORTIFIED: { bg: '#5C3317', text: '#F5EBE0', emoji: '🥃' },
};

function getWineImageUri(wine: Wine): string {
  // Use provided imageUrl only if it's a real image (not placeholder services)
  if (wine.imageUrl && !wine.imageUrl.includes('placeholder') && !wine.imageUrl.includes('placehold')) {
    return wine.imageUrl;
  }
  const colors = WINE_TYPE_COLORS[wine.type] || WINE_TYPE_COLORS.RED;
  const emoji = colors.emoji;
  const name = (wine.name || '').replace(/[<>&'"]/g, '');
  const vintage = wine.vintage ? String(wine.vintage) : '';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" viewBox="0 0 300 400">
    <rect width="300" height="400" fill="${colors.bg}" rx="12"/>
    <rect x="100" y="60" width="100" height="200" fill="${colors.text}" fill-opacity="0.15" rx="50"/>
    <rect x="120" y="40" width="60" height="30" fill="${colors.text}" fill-opacity="0.15" rx="8"/>
    <text x="150" y="310" font-size="48" text-anchor="middle" dominant-baseline="middle">${emoji}</text>
    <text x="150" y="355" font-size="14" text-anchor="middle" fill="${colors.text}" font-family="sans-serif" font-weight="bold">${name.substring(0, 22)}</text>
    <text x="150" y="378" font-size="12" text-anchor="middle" fill="${colors.text}" font-family="sans-serif" fill-opacity="0.8">${vintage}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

interface Props {
  wine: Wine;
  onPress: () => void;
  compact?: boolean;
}

export const WineCard: React.FC<Props> = ({ wine, onPress, compact }) => {
  const stars = '★'.repeat(Math.round(wine.avgRating)) + '☆'.repeat(5 - Math.round(wine.avgRating));

  return (
    <TouchableOpacity style={[styles.card, compact && styles.compact]} onPress={onPress} activeOpacity={0.85}>
      <Image
        source={{ uri: getWineImageUri(wine) }}
        style={compact ? styles.imageCompact : styles.image}
        resizeMode="cover"
      />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{wine.name}</Text>
        {wine.winery && <Text style={styles.winery} numberOfLines={1}>{wine.winery.name}</Text>}
        <Text style={styles.meta}>
          {WINE_TYPE_LABEL[wine.type]}{wine.vintage ? ` · ${wine.vintage}` : ''}
          {wine.region ? ` · ${wine.region.country}` : ''}
        </Text>
        <View style={styles.ratingRow}>
          <Text style={styles.stars}>{stars}</Text>
          <Text style={styles.ratingText}>{wine.avgRating.toFixed(1)}</Text>
          <Text style={styles.reviewCount}>({wine.reviewCount})</Text>
        </View>
        {wine.prices && wine.prices.length > 0 && (
          <Text style={styles.price}>
            From ${Math.min(...wine.prices.map(p => p.price))}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: theme.colors.white,
    borderRadius: theme.borderRadius.md,
    marginHorizontal: theme.spacing.md,
    marginVertical: theme.spacing.sm,
    padding: theme.spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  compact: { marginHorizontal: 0 },
  image: {
    width: 80,
    height: 110,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceAlt,
  },
  imageCompact: {
    width: 60,
    height: 80,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: theme.colors.surfaceAlt,
  },
  info: { flex: 1, marginLeft: theme.spacing.md, justifyContent: 'center' },
  name: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.semibold, color: theme.colors.text, marginBottom: 2 },
  winery: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary, marginBottom: 4 },
  meta: { fontSize: theme.fontSize.xs, color: theme.colors.textLight, marginBottom: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stars: { color: theme.colors.starFilled, fontSize: theme.fontSize.sm },
  ratingText: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, color: theme.colors.primary },
  reviewCount: { fontSize: theme.fontSize.xs, color: theme.colors.textLight },
  price: { marginTop: 6, fontSize: theme.fontSize.sm, fontWeight: theme.fontWeight.semibold, color: theme.colors.primary },
});
