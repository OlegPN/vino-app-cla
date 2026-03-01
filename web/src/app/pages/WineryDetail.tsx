import { ArrowLeft, BadgeCheck, MapPin, Wine as WineIcon, Star } from 'lucide-react';
import { useParams, useNavigate } from 'react-router';
import { wineries, wines, formatPrice, wineTypeLabel, wineTypeColor } from '../data/wines';
import { StarRating } from '../components/StarRating';

export default function WineryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const winery = wineries.find((w) => w.id === id);

  if (!winery) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-screen"
        style={{ maxWidth: 480, margin: '0 auto' }}
      >
        <span style={{ fontSize: 48, marginBottom: 16 }}>🏰</span>
        <p style={{ color: '#888' }}>Винодельня не найдена</p>
        <button
          className="mt-4 px-6 py-2 rounded-full"
          style={{ background: '#722F37', color: '#fff', fontWeight: 600 }}
          onClick={() => navigate(-1)}
        >
          Назад
        </button>
      </div>
    );
  }

  // Wines that belong to this winery (by name match)
  const wineryWines = wines.filter(
    (w) => w.winery.toLowerCase() === winery.name.toLowerCase()
  );

  return (
    <div
      className="min-h-screen pb-32"
      style={{ background: '#f8f4f2', maxWidth: 480, margin: '0 auto' }}
    >
      {/* Hero image */}
      <div className="relative" style={{ height: 220 }}>
        <img
          src={winery.image}
          alt={winery.name}
          className="w-full h-full object-cover"
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.0) 50%, rgba(0,0,0,0.55) 100%)' }}
        />

        {/* Back button */}
        <button
          className="absolute top-4 left-4 flex items-center justify-center rounded-full"
          style={{ width: 38, height: 38, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)' }}
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={20} color="#fff" />
        </button>

        {/* Winery name on photo */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span style={{ fontSize: 20 }}>{winery.flag}</span>
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
                  {winery.region}, {winery.country}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800 }}>{winery.name}</h1>
                {winery.verified && <BadgeCheck size={18} color="#E8A838" fill="#E8A838" />}
              </div>
            </div>
            {/* Logo badge */}
            <div
              className="rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                width: 52,
                height: 52,
                background: '#722F37',
                color: '#fff',
                fontSize: 16,
                fontWeight: 800,
                boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
              }}
            >
              {winery.logo}
            </div>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div
        className="flex divide-x mx-4 mt-4 rounded-2xl overflow-hidden"
        style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderColor: '#f0ebe8' }}
      >
        {[
          { icon: <Star size={16} color="#E8A838" fill="#E8A838" />, label: 'Рейтинг', value: winery.rating.toFixed(1) },
          { icon: <WineIcon size={16} color="#722F37" />, label: 'Вин', value: winery.winesCount.toString() },
          { icon: <MapPin size={16} color="#722F37" />, label: 'Регион', value: winery.region },
        ].map((stat) => (
          <div key={stat.label} className="flex-1 flex flex-col items-center gap-1 py-4 px-2">
            <div className="flex items-center gap-1">
              {stat.icon}
              <span style={{ fontSize: 17, fontWeight: 800, color: '#1a1a1a' }}>{stat.value}</span>
            </div>
            <span style={{ fontSize: 11, color: '#aaa', fontWeight: 500 }}>{stat.label}</span>
          </div>
        ))}
      </div>

      {/* About section */}
      <div className="mx-4 mt-4 rounded-2xl p-4" style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>О винодельне</h2>
        <p style={{ fontSize: 14, color: '#555', lineHeight: 1.65 }}>
          {winery.name} — известная винодельня региона {winery.region}, {winery.country}.
          Основана с любовью к традиционному виноделию и производит вина высочайшего качества.
          Рейтинг винодельни основан на{' '}
          <span style={{ fontWeight: 700, color: '#722F37' }}>
            {winery.ratingsCount.toLocaleString('ru-RU')}
          </span>{' '}
          оценках пользователей.
        </p>
      </div>

      {/* Wines list */}
      <div className="mx-4 mt-4">
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a', marginBottom: 12 }}>
          Вина винодельни
        </h2>

        {wineryWines.length > 0 ? (
          <div className="flex flex-col gap-3">
            {wineryWines.map((wine) => {
              const typeColor = wineTypeColor[wine.type];
              return (
                <button
                  key={wine.id}
                  className="flex items-center gap-3 rounded-2xl p-3 w-full text-left"
                  style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
                  onClick={() => navigate(`/wine/${wine.id}`)}
                >
                  <div
                    className="rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ width: 64, height: 96, background: '#f5f0ee' }}
                  >
                    <img
                      src={wine.image}
                      alt={wine.name}
                      style={{ height: '85%', width: 'auto', objectFit: 'contain' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span
                      className="inline-block rounded-full px-2 py-0.5 mb-1"
                      style={{ background: typeColor + '20', color: typeColor, fontSize: 11, fontWeight: 700 }}
                    >
                      {wineTypeLabel[wine.type]}
                    </span>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 }}>
                      {wine.name}
                    </p>
                    <p style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>
                      {wine.year} · {wine.region}
                    </p>
                    <StarRating rating={wine.rating} count={wine.ratingsCount} size={13} />
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a' }}>
                      {formatPrice(wine.price)}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div
            className="rounded-2xl p-8 flex flex-col items-center gap-3"
            style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <WineIcon size={36} color="#ccc" />
            <p style={{ color: '#aaa', fontSize: 14 }}>Вина этой винодельни пока не добавлены</p>
          </div>
        )}
      </div>
    </div>
  );
}
