import { BadgeCheck } from 'lucide-react';
import { useNavigate } from 'react-router';
import { Winery } from '../data/wines';
import { StarRating } from './StarRating';

interface WineryCardProps {
  winery: Winery;
}

export function WineryCard({ winery }: WineryCardProps) {
  const navigate = useNavigate();

  return (
    <div
      className="relative rounded-xl overflow-hidden cursor-pointer"
      style={{ width: 280, height: 160, flexShrink: 0, boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
      onClick={() => navigate(`/winery/${winery.id}`)}
    >
      {/* Background image */}
      <img
        src={winery.image}
        alt={winery.name}
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Dark gradient overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)' }}
      />

      {/* Logo */}
      <div
        className="absolute top-3 left-3 rounded-full flex items-center justify-center"
        style={{
          width: 52,
          height: 52,
          background: 'rgba(255,255,255,0.95)',
          fontSize: 11,
          fontWeight: 800,
          color: '#722F37',
          letterSpacing: 0.5,
        }}
      >
        {winery.logo}
      </div>

      {/* Info at bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <span style={{ color: '#fff', fontSize: 16, fontWeight: 700 }}>{winery.name}</span>
          {winery.verified && <BadgeCheck size={16} color="#4A9EE8" fill="#fff" />}
        </div>
        <div className="flex items-center gap-1 mb-1">
          <span style={{ fontSize: 13 }}>{winery.flag}</span>
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
            {winery.region}, {winery.country}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600 }}>
            {winery.winesCount} вин
          </span>
          <StarRating rating={winery.rating} count={winery.ratingsCount} size={12} />
        </div>
      </div>
    </div>
  );
}
