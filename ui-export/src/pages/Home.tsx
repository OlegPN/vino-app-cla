import { useState } from 'react';
import { Bell } from 'lucide-react';
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
      <div className="flex items-center justify-end px-4 pt-4 pb-2">
        <button className="relative p-2">
          <Bell size={24} color="#333" />
          <span
            className="absolute top-1 right-1 rounded-full"
            style={{ width: 8, height: 8, background: '#E8A838' }}
          />
        </button>
      </div>

      {/* Top Ratings Section */}
      <div className="px-4 mb-4">
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#1a1a1a', marginBottom: 2 }}>
          Лучший рейтинг в России
        </h2>
        <p style={{ fontSize: 13, color: '#888' }}>Обновляется каждый четверг</p>
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

      {/* Promo Banner */}
      <div className="mx-4 rounded-2xl overflow-hidden mb-6 relative cursor-pointer">
        <img
          src="https://images.unsplash.com/photo-1660814807979-8482e075420c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800"
          alt="wine tasting"
          className="w-full object-cover"
          style={{ height: 140 }}
        />
        <div
          className="absolute inset-0 flex flex-col justify-end p-4"
          style={{ background: 'linear-gradient(to bottom, transparent 20%, rgba(114,47,55,0.85) 100%)' }}
        >
          <h3 style={{ color: '#fff', fontSize: 17, fontWeight: 700 }}>
            Откройте для себя новые вина
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13 }}>
            Дегустационные наборы от экспертов Vivino
          </p>
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

        {/* Featured article — большое превью */}
        <div
          className="mx-4 mb-3 rounded-2xl overflow-hidden cursor-pointer relative"
          style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
        >
          <img
            src="https://images.unsplash.com/photo-1767510533241-d7c86c88d097?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800"
            alt="Как правильно дегустировать вино"
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
              ГАЙД
            </span>
            <h3 style={{ color: '#fff', fontSize: 16, fontWeight: 700, lineHeight: 1.3 }}>
              Как правильно дегустировать вино: пошаговый гид для начинающих
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, marginTop: 4 }}>
              5 мин · Эксперт Vivino
            </p>
          </div>
        </div>

        {/* Second article — горизонтальная карточка */}
        <div
          className="mx-4 rounded-2xl overflow-hidden cursor-pointer flex"
          style={{ background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
        >
          <img
            src="https://images.unsplash.com/photo-1764186373647-76092911b735?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=400"
            alt="Урожай 2023"
            className="object-cover flex-shrink-0"
            style={{ width: 110, height: 110 }}
          />
          <div className="flex flex-col justify-center px-4 py-3 flex-1">
            <span
              className="rounded-full px-2 py-0.5 mb-1 self-start"
              style={{ background: '#F5ECD7', color: '#C9A84C', fontSize: 11, fontWeight: 700 }}
            >
              УРОЖАЙ
            </span>
            <p style={{ color: '#1a1a1a', fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>
              Урожай 2023: почему этот год стал особенным для российских вин
            </p>
            <p style={{ color: '#999', fontSize: 12, marginTop: 4 }}>
              3 мин · Редакция
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
