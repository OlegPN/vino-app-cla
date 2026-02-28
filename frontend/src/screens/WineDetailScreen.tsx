import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../theme';
import { Wine, Review } from '../types';
import { winesApi, reviewsApi, collectionApi } from '../api/wines';
import { StarRating } from '../components/StarRating';
import { getWineImageUri } from '../utils/wineImage';

const WINE_TYPE_LABEL: Record<string, string> = {
  RED: 'Красное', WHITE: 'Белое', ROSE: 'Розовое',
  SPARKLING: 'Игристое', DESSERT: 'Десертное', FORTIFIED: 'Крепленое',
};

export const WineDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { wineId } = route.params;
  const [wine, setWine] = useState<Wine | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewModal, setReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    winesApi.getById(wineId)
      .then(r => setWine(r.wine))
      .finally(() => setLoading(false));
  }, [wineId]);

  const handleAddToCollection = async (status: string) => {
    const token = await AsyncStorage.getItem('auth_token');
    if (!token) {
      Alert.alert('Требуется вход', 'Войдите, чтобы управлять коллекцией.', [
        { text: 'Отмена', style: 'cancel' },
        { text: 'Войти', onPress: () => navigation.navigate('Profile') },
      ]);
      return;
    }
    try {
      await collectionApi.add({ wineId, status });
      const labels: Record<string, string> = { HAVE: 'есть в наличии', WISHLIST: 'желаемое', DRANK: 'выпито' };
      Alert.alert('✅ Добавлено!', `Вино добавлено в список «${labels[status]}».`);
    } catch (e: any) {
      Alert.alert('Ошибка', e.message);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) { Alert.alert('Выберите оценку'); return; }
    setSubmitting(true);
    try {
      await reviewsApi.submit({ wineId, rating, text: reviewText });
      setReviewModal(false);
      const r = await winesApi.getById(wineId);
      setWine(r.wine);
      Alert.alert('Отзыв отправлен!');
    } catch (e: any) {
      Alert.alert('Ошибка', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color={theme.colors.primary} style={{ flex: 1, marginTop: 100 }} />;
  if (!wine) return <Text style={{ textAlign: 'center', marginTop: 40 }}>Вино не найдено</Text>;

  const reviews = (wine as any).reviews as Review[] || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Шапка */}
        <View style={styles.header}>
          <Image
            source={{ uri: getWineImageUri(wine.type, wine.name, wine.imageUrl, 'detail') }}
            style={styles.bottleImage}
            resizeMode="cover"
          />
          <View style={styles.headerInfo}>
            <Text style={styles.wineName}>{wine.name}</Text>
            {wine.winery && <Text style={styles.wineryName}>{wine.winery.name}</Text>}
            {wine.region && <Text style={styles.regionText}>{wine.region.name}, {wine.region.country}</Text>}
            {wine.vintage && <Text style={styles.vintage}>{wine.vintage} г.</Text>}
            <View style={styles.ratingRow}>
              <Text style={styles.ratingBig}>{wine.avgRating.toFixed(1)}</Text>
              <StarRating rating={wine.avgRating} size={20} />
              <Text style={styles.reviewCount}>{wine.reviewCount} отзывов</Text>
            </View>
          </View>
        </View>

        {/* Характеристики */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Характеристики</Text>
          <View style={styles.detailsGrid}>
            {wine.grapeVarieties.length > 0 && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Сорт винограда</Text>
                <Text style={styles.detailValue}>{wine.grapeVarieties.join(', ')}</Text>
              </View>
            )}
            {wine.alcoholPct && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Крепость</Text>
                <Text style={styles.detailValue}>{wine.alcoholPct}%</Text>
              </View>
            )}
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Тип</Text>
              <Text style={styles.detailValue}>{WINE_TYPE_LABEL[wine.type] || wine.type}</Text>
            </View>
          </View>
        </View>

        {/* Описание вкуса */}
        {wine.tastingNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Вкус и аромат</Text>
            <Text style={styles.tastingNotes}>{wine.tastingNotes}</Text>
          </View>
        )}

        {/* Сочетание с едой */}
        {wine.foodPairings && wine.foodPairings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Сочетание с едой</Text>
            <View style={styles.pairingsRow}>
              {wine.foodPairings.map(fp => (
                <View key={fp.id} style={styles.pairingChip}>
                  <Text style={styles.pairingText}>🍴 {fp.food}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Цены */}
        {wine.prices && wine.prices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Где купить</Text>
            {wine.prices.map(p => (
              <View key={p.id} style={styles.priceRow}>
                <Text style={styles.retailer}>{p.retailer}</Text>
                <Text style={styles.priceText}>{p.price.toLocaleString('ru-RU')} ₽</Text>
              </View>
            ))}
          </View>
        )}

        {/* Действия */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setReviewModal(true)}>
            <Text style={styles.primaryBtnText}>⭐ Оценить и написать отзыв</Text>
          </TouchableOpacity>
          <View style={styles.collectionBtns}>
            <TouchableOpacity style={styles.collectionBtn} onPress={() => handleAddToCollection('HAVE')}>
              <Text style={styles.collectionBtnText}>🍾 Есть</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.collectionBtn} onPress={() => handleAddToCollection('WISHLIST')}>
              <Text style={styles.collectionBtnText}>❤️ Хочу</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.collectionBtn} onPress={() => handleAddToCollection('DRANK')}>
              <Text style={styles.collectionBtnText}>✅ Пробовал</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Отзывы */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Отзывы ({reviews.length})</Text>
          {reviews.map((rev: Review) => (
            <View key={rev.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>{rev.user.displayName}</Text>
                <StarRating rating={rev.rating} size={14} />
                <Text style={styles.reviewDate}>{new Date(rev.createdAt).toLocaleDateString('ru-RU')}</Text>
              </View>
              {rev.text && <Text style={styles.reviewText}>{rev.text}</Text>}
            </View>
          ))}
          {reviews.length === 0 && <Text style={styles.emptyText}>Пока нет отзывов. Будьте первым!</Text>}
        </View>
      </ScrollView>

      {/* Модальное окно отзыва */}
      <Modal visible={reviewModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Оценить: {wine.name}</Text>
            <TouchableOpacity onPress={() => setReviewModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.rateLabel}>Ваша оценка</Text>
            <StarRating rating={rating} onRate={setRating} size={40} />
            <TextInput
              style={styles.reviewInput}
              placeholder="Поделитесь впечатлениями (необязательно)..."
              placeholderTextColor={theme.colors.textLight}
              multiline
              numberOfLines={4}
              value={reviewText}
              onChangeText={setReviewText}
            />
            <TouchableOpacity
              style={[styles.primaryBtn, submitting && { opacity: 0.6 }]}
              onPress={handleSubmitReview}
              disabled={submitting}
            >
              <Text style={styles.primaryBtnText}>{submitting ? 'Отправляем...' : 'Отправить отзыв'}</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.surface },
  header: { flexDirection: 'row', padding: theme.spacing.md, backgroundColor: theme.colors.white, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  bottleImage: { width: 100, height: 150, borderRadius: theme.borderRadius.sm },
  headerInfo: { flex: 1, marginLeft: theme.spacing.md, justifyContent: 'center' },
  wineName: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.text, marginBottom: 4 },
  wineryName: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary, marginBottom: 2 },
  regionText: { fontSize: theme.fontSize.sm, color: theme.colors.textLight, marginBottom: 2 },
  vintage: { fontSize: theme.fontSize.sm, color: theme.colors.primary, fontWeight: theme.fontWeight.semibold, marginBottom: 8 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ratingBig: { fontSize: theme.fontSize.xxl, fontWeight: theme.fontWeight.bold, color: theme.colors.primary },
  reviewCount: { fontSize: theme.fontSize.xs, color: theme.colors.textLight },
  section: { backgroundColor: theme.colors.white, marginTop: theme.spacing.sm, padding: theme.spacing.md },
  sectionTitle: { fontSize: theme.fontSize.lg, fontWeight: theme.fontWeight.bold, color: theme.colors.text, marginBottom: theme.spacing.sm },
  detailsGrid: { gap: theme.spacing.sm },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { fontSize: theme.fontSize.sm, color: theme.colors.textSecondary },
  detailValue: { fontSize: theme.fontSize.sm, color: theme.colors.text, fontWeight: theme.fontWeight.medium, flex: 1, textAlign: 'right' },
  tastingNotes: { fontSize: theme.fontSize.md, color: theme.colors.text, lineHeight: 22 },
  pairingsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
  pairingChip: { backgroundColor: theme.colors.surface, paddingHorizontal: theme.spacing.md, paddingVertical: 6, borderRadius: theme.borderRadius.full, borderWidth: 1, borderColor: theme.colors.border },
  pairingText: { fontSize: theme.fontSize.sm, color: theme.colors.text },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  retailer: { fontSize: theme.fontSize.md, color: theme.colors.text },
  priceText: { fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.bold, color: theme.colors.primary },
  actions: { padding: theme.spacing.md, gap: theme.spacing.sm },
  primaryBtn: { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, alignItems: 'center' },
  primaryBtnText: { color: theme.colors.white, fontSize: theme.fontSize.md, fontWeight: theme.fontWeight.semibold },
  collectionBtns: { flexDirection: 'row', gap: theme.spacing.sm },
  collectionBtn: { flex: 1, backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, padding: theme.spacing.sm, alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  collectionBtnText: { fontSize: theme.fontSize.sm, color: theme.colors.text },
  reviewItem: { paddingVertical: theme.spacing.sm, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  reviewHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm, marginBottom: 4 },
  reviewerName: { fontWeight: theme.fontWeight.semibold, color: theme.colors.text, fontSize: theme.fontSize.sm },
  reviewDate: { fontSize: theme.fontSize.xs, color: theme.colors.textLight, marginLeft: 'auto' },
  reviewText: { fontSize: theme.fontSize.sm, color: theme.colors.text, lineHeight: 20 },
  emptyText: { color: theme.colors.textLight, textAlign: 'center', paddingVertical: theme.spacing.md },
  modal: { flex: 1, backgroundColor: theme.colors.white },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  modalTitle: { fontSize: theme.fontSize.xl, fontWeight: theme.fontWeight.bold, color: theme.colors.text, flex: 1 },
  modalClose: { fontSize: 22, color: theme.colors.textSecondary, padding: theme.spacing.sm },
  modalBody: { padding: theme.spacing.md, gap: theme.spacing.md },
  rateLabel: { fontSize: theme.fontSize.md, color: theme.colors.textSecondary },
  reviewInput: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, fontSize: theme.fontSize.md, color: theme.colors.text, height: 120, textAlignVertical: 'top' },
});
