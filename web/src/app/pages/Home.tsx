import { useState } from 'react';

import { useNavigate } from 'react-router';
import { wines } from '../data/wines';
import { WineCard } from '../components/WineCard';

const priceFilters = [
  { label: '500₽ - 1000₽', min: 500, max: 1000 },
  { label: '1000₽ - 2000₽', min: 1000, max: 2000 },
  { label: 'Более 2000₽', min: 2000, max: Infinity },
];

export default function Home() {
  const navigate = useNavigate();
  const [activePriceFilter, setActivePriceFilter] = useState(0);

  const filtered = wines.filter((w) => {
    const { min, max } = priceFilters[activePriceFilter];
    return w.price >= min && w.price <= max;
  });

  return (
    <div
      className="min-h-screen pb-32"
      style={{ background: '#f8f4f2', maxWidth: 480, margin: '0 auto' }}
    >
      {/* Header */}
      <div style={{ background: '#722F37' }}>
        <div className="flex items-center justify-center px-4 pt-4 pb-4">
          <div style={{ letterSpacing: 4 }}>
            <span style={{ color: '#fff', fontSize: 22, fontWeight: 900, fontFamily: 'Georgia, serif' }}>В</span>
            <span style={{ color: '#fff', fontSize: 22, fontWeight: 400, fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>И</span>
            <span style={{ color: '#fff', fontSize: 22, fontWeight: 900, fontFamily: 'Georgia, serif' }}>Н</span>
            <span style={{ color: '#E8C97A', fontSize: 22, fontWeight: 900, fontFamily: 'Georgia, serif' }}>А</span>
          </div>
        </div>
      </div>

      {/* Top Ratings Section */}
      <div className="px-4 mb-4">
        <h2 style={{ fontSize: 20, fontWeight: 900, color: '#1a1a1a', marginBottom: 2, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Лучшие российские вина
        </h2>

      </div>

      {/* Price filter chips */}
      <div className="px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {priceFilters.map((filter, i) => (
            <button
              key={filter.label}
              onClick={() => setActivePriceFilter(i)}
              className="rounded-full px-4 py-2 whitespace-nowrap transition-all"
              style={{
                background: activePriceFilter === i ? '#1a1a1a' : '#fff',
                color: activePriceFilter === i ? '#fff' : '#1a1a1a',
                border: `1.5px solid ${activePriceFilter === i ? '#1a1a1a' : '#ddd'}`,
                fontSize: 14,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Wine cards horizontal scroll */}
      <div className="px-4 mb-6">
        {filtered.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {filtered.map((wine) => (
              <WineCard key={wine.id} wine={wine} />
            ))}
          </div>
        ) : (
          <div
            className="rounded-xl p-6 text-center"
            style={{ background: '#fff', color: '#888', fontSize: 14 }}
          >
            Нет вин в этом ценовом диапазоне
          </div>
        )}
      </div>

      {/* Top Wines by Type */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>
            Топ по типу вина
          </h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Красные', type: 'red', color: '#8B2635', emoji: '🍷' },
            { label: 'Белые', type: 'white', color: '#C9A84C', emoji: '🥂' },
            { label: 'Розовые', type: 'rose', color: '#E8748A', emoji: '🌸' },
            { label: 'Игристые', type: 'sparkling', color: '#7B9EA6', emoji: '✨' },
          ].map((item) => (
            <button
              key={item.type}
              className="rounded-xl p-4 flex flex-col items-start gap-1 transition-opacity hover:opacity-90"
              style={{ background: item.color }}
              onClick={() => navigate(`/explore?type=${item.type}`)}
            >
              <span style={{ fontSize: 24 }}>{item.emoji}</span>
              <span style={{ color: '#fff', fontSize: 15, fontWeight: 700 }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>


      {/* «Про вино» Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between px-4 mb-3">
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>
            Про вино
          </h2>
          <button style={{ color: '#722F37', fontSize: 14, fontWeight: 600 }}>
            Все статьи
          </button>
        </div>

        {/* Article 1 */}
        <div
          className="mx-4 mb-3 rounded-2xl overflow-hidden cursor-pointer relative"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
        >
          <img
            src="https://0d314c86-f76b-45cc-874e-45816116a667.selcdn.net/79a9b6bb-73b4-4056-bd44-54717f01f4d8.jpg"
            alt="Люсьен Оливье: не только салат"
            className="w-full object-cover"
            style={{ height: 180 }}
          />
          <div
            className="absolute inset-0 flex flex-col justify-end p-4"
            style={{ background: 'linear-gradient(to bottom, transparent 10%, rgba(20,10,10,0.78) 100%)' }}
          >
            <span
              className="rounded-full px-2 py-0.5 mb-2 self-start"
              style={{ background: '#722F37', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}
            >
              ИСТОРИЯ
            </span>
            <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>
              Люсьен Оливье: не только салат
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>
              5 мин · Snob
            </p>
          </div>
        </div>

        {/* Article 2 */}
        <div
          className="mx-4 rounded-2xl overflow-hidden cursor-pointer relative"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
        >
          <img
            src="https://0d314c86-f76b-45cc-874e-45816116a667.selcdn.net/483807fd-65e6-4e3f-970e-69700516a6d6.jpg"
            alt="Виноделческая династия Мело"
            className="w-full object-cover"
            style={{ height: 180 }}
          />
          <div
            className="absolute inset-0 flex flex-col justify-end p-4"
            style={{ background: 'linear-gradient(to bottom, transparent 10%, rgba(20,10,10,0.78) 100%)' }}
          >
            <span
              className="rounded-full px-2 py-0.5 mb-2 self-start"
              style={{ background: '#722F37', color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: 0.3 }}
            >
              ВИНОДЕЛЬНЯ
            </span>
            <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>
              Виноделческая династия Мело: как оставаться на плаву 500 лет
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>
              7 мин · Snob
            </p>
          </div>
        </div>
      </div>

      {/* Recently Added */}
      <div className="px-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>
            Недавно добавленные
          </h2>
          <button
            style={{ color: '#722F37', fontSize: 14, fontWeight: 600 }}
            onClick={() => navigate('/explore')}
          >
            Все
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {wines.slice().reverse().map((wine) => (
            <WineCard key={wine.id} wine={wine} />
          ))}
        </div>
      </div>
    </div>
  );
}
