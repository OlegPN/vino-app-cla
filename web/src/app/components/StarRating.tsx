import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  count?: number;
  size?: number;
  showCount?: boolean;
}

export function StarRating({ rating, count, size = 14, showCount = true }: StarRatingProps) {
  return (
    <div className="flex items-center gap-1">
      <Star
        size={size}
        fill="#E8A838"
        color="#E8A838"
      />
      <span style={{ color: '#E8A838', fontSize: size, fontWeight: 600 }}>
        {rating.toFixed(1)}
      </span>
      {showCount && count !== undefined && (
        <span style={{ color: '#888', fontSize: size - 1 }}>({count.toLocaleString('ru-RU')})</span>
      )}
    </div>
  );
}
