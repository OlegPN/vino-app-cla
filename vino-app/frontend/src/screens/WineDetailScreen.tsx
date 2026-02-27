import React, { useEffect, useState } from 'react';
import {
  View, Text, Image, ScrollView, StyleSheet, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert, Modal, TextInput,
} from 'react-native';
import { theme } from '../theme';
import { Wine, Review } from '../types';
import { winesApi, reviewsApi, collectionApi } from '../api/wines';
import { StarRating } from '../components/StarRating';

export const WineDetailScreen: React.FC<{ route: any; navigation: any }> = ({ route }) => {
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
    try {
      await collectionApi.add({ wineId, status });
      Alert.alert('Added!', `Wine added to your ${status.toLowerCase()} list.`);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) { Alert.alert('Please select a rating'); return; }
    setSubmitting(true);
    try {
      await reviewsApi.submit({ wineId, rating, text: reviewText });
      setReviewModal(false);
      // Refresh
      const r = await winesApi.getById(wineId);
      setWine(r.wine);
      Alert.alert('Review submitted!');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <ActivityIndicator size="large" color={theme.colors.primary} style={{ flex: 1, marginTop: 100 }} />;
  if (!wine) return <Text style={{ textAlign: 'center', marginTop: 40 }}>Wine not found</Text>;

  const reviews = (wine as any).reviews as Review[] || [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={{ uri: wine.imageUrl || 'https://via.placeholder.com/150x200/722F37/FFFFFF?text=🍷' }}
            style={styles.bottleImage}
            resizeMode="contain"
          />
          <View style={styles.headerInfo}>
            <Text style={styles.wineName}>{wine.name}</Text>
            {wine.winery && <Text style={styles.wineryName}>{wine.winery.name}</Text>}
            {wine.region && <Text style={styles.regionText}>{wine.region.name}, {wine.region.country}</Text>}
            {wine.vintage && <Text style={styles.vintage}>{wine.vintage}</Text>}
            <View style={styles.ratingRow}>
              <Text style={styles.ratingBig}>{wine.avgRating.toFixed(1)}</Text>
              <StarRating rating={wine.avgRating} size={20} />
              <Text style={styles.reviewCount}>{wine.reviewCount} reviews</Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsGrid}>
            {wine.grapeVarieties.length > 0 && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Grapes</Text>
                <Text style={styles.detailValue}>{wine.grapeVarieties.join(', ')}</Text>
              </View>
            )}
            {wine.alcoholPct && (
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>Alcohol</Text>
                <Text style={styles.detailValue}>{wine.alcoholPct}%</Text>
              </View>
            )}
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Type</Text>
              <Text style={styles.detailValue}>{wine.type}</Text>
            </View>
          </View>
        </View>

        {/* Tasting Notes */}
        {wine.tastingNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tasting Notes</Text>
            <Text style={styles.tastingNotes}>{wine.tastingNotes}</Text>
          </View>
        )}

        {/* Food Pairings */}
        {wine.foodPairings && wine.foodPairings.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Food Pairings</Text>
            <View style={styles.pairingsRow}>
              {wine.foodPairings.map(fp => (
                <View key={fp.id} style={styles.pairingChip}>
                  <Text style={styles.pairingText}>🍴 {fp.food}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Prices */}
        {wine.prices && wine.prices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Where to Buy</Text>
            {wine.prices.map(p => (
              <View key={p.id} style={styles.priceRow}>
                <Text style={styles.retailer}>{p.retailer}</Text>
                <Text style={styles.priceText}>${p.price} {p.currency}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => setReviewModal(true)}>
            <Text style={styles.primaryBtnText}>⭐ Rate & Review</Text>
          </TouchableOpacity>
          <View style={styles.collectionBtns}>
            <TouchableOpacity style={styles.collectionBtn} onPress={() => handleAddToCollection('HAVE')}>
              <Text style={styles.collectionBtnText}>🍾 Have it</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.collectionBtn} onPress={() => handleAddToCollection('WISHLIST')}>
              <Text style={styles.collectionBtnText}>❤️ Wishlist</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.collectionBtn} onPress={() => handleAddToCollection('DRANK')}>
              <Text style={styles.collectionBtnText}>✅ Drank it</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
          {reviews.map((rev: Review) => (
            <View key={rev.id} style={styles.reviewItem}>
              <View style={styles.reviewHeader}>
                <Text style={styles.reviewerName}>{rev.user.displayName}</Text>
                <StarRating rating={rev.rating} size={14} />
                <Text style={styles.reviewDate}>{new Date(rev.createdAt).toLocaleDateString()}</Text>
              </View>
              {rev.text && <Text style={styles.reviewText}>{rev.text}</Text>}
            </View>
          ))}
          {reviews.length === 0 && <Text style={styles.emptyText}>No reviews yet. Be the first!</Text>}
        </View>
      </ScrollView>

      {/* Review Modal */}
      <Modal visible={reviewModal} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Rate {wine.name}</Text>
            <TouchableOpacity onPress={() => setReviewModal(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalBody}>
            <Text style={styles.rateLabel}>Your Rating</Text>
            <StarRating rating={rating} onRate={setRating} size={40} />
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your thoughts (optional)..."
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
              <Text style={styles.primaryBtnText}>{submitting ? 'Submitting...' : 'Submit Review'}</Text>
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
