import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface Props {
  rating: number;
  onRate?: (rating: number) => void;
  size?: number;
}

export const StarRating: React.FC<Props> = ({ rating, onRate, size = 28 }) => {
  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map(star => (
        <TouchableOpacity key={star} onPress={() => onRate?.(star)} disabled={!onRate}>
          <Text style={[styles.star, { fontSize: size, color: star <= rating ? theme.colors.starFilled : theme.colors.starEmpty }]}>
            ★
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 2 },
  star: {},
});
