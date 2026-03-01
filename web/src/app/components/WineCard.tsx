import { MoreVertical, Heart, BookmarkPlus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Wine, formatPrice, wineTypeColor } from '../data/wines';
import { StarRating } from './StarRating';

interface WineCardProps {
  wine: Wine;
  compact?: boolean;
}

export function WineCard({ wine, compact = false }: WineCardProps) {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [wished, setWished] = useState(wine.wishlist ?? false);

  const typeColor = wineTypeColor[wine.type];

  return (
    <div
      className="bg-white rounded-xl overflow-hidden cursor-pointer relative"
      style={{ width: compact ? 160 : 185, boxShadow: '0 2px 10px rgba(0,0,0,0.1)', flexShrink: 0 }}
      onClick={() => navigate(`/wine/${wine.id}`)}
    >
      {/* Menu button */}
      <button
        className="absolute top-2 right-2 z-10 p-1 rounded-full"
        style={{ background: 'rgba(255,255,255,0.9)' }}
        onClick={(e) => {
          e.stopPropagation();
          setMenuOpen(!menuOpen);
        }}
      >
        <MoreVertical size={16} color="#666" />
      </button>

      {menuOpen && (
        <div
          className="absolute top-8 right-2 z-20 rounded-xl overflow-hidden"
          style={{ background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', width: 160 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50"
            onClick={() => { setWished(!wished); setMenuOpen(false); }}
          >
            <Heart size={16} color={wished ? '#E8A838' : '#666'} fill={wished ? '#E8A838' : 'none'} />
            <span style={{ fontSize: 14, color: '#333' }}>{wished ? 'Убрать из желаемого' : 'В желаемое'}</span>
          </button>
          <button
            className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50"
            onClick={() => setMenuOpen(false)}
          >
            <BookmarkPlus size={16} color="#666" />
            <span style={{ fontSize: 14, color: '#333' }}>В коллекцию</span>
          </button>
        </div>
      )}

      {/* Wine image */}
      <div
        className="flex items-center justify-center"
        style={{ height: 200, background: '#f5f5f5' }}
      >
        <img
          src={wine.image}
          alt={wine.name}
          style={{ height: '85%', width: 'auto', objectFit: 'contain' }}
        />
      </div>

      {/* Wine info */}
      <div className="px-3 pb-3 pt-2">
        <div style={{ fontSize: 12, color: typeColor, fontWeight: 600, marginBottom: 1 }}>
          {wine.winery}
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.3, marginBottom: 4 }}>
          {wine.name} {wine.year}
        </div>
        <StarRating rating={wine.rating} count={wine.ratingsCount} size={13} />
        <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginTop: 6 }}>
          {formatPrice(wine.price)}
        </div>
      </div>
    </div>
  );
}
