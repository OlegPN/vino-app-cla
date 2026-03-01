import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useSearchParams } from 'react-router';
import { wines, wineries, wineTypeLabel, WineType } from '../data/wines';
import { WineCard } from '../components/WineCard';
import { WineryCard } from '../components/WineryCard';

const tabs = [
  { key: 'wines', label: 'Вина' },
  { key: 'wineries', label: 'Винодельни' },
];

const typeFilters: { key: WineType | 'all'; label: string }[] = [
  { key: 'all', label: 'Все' },
  { key: 'red', label: 'Красные' },
  { key: 'white', label: 'Белые' },
  { key: 'rose', label: 'Розовые' },
  { key: 'sparkling', label: 'Игристые' },
];

export default function Explore() {
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'wines';
  const defaultType = (searchParams.get('type') || 'all') as WineType | 'all';

  const [activeTab, setActiveTab] = useState(defaultTab);
  const [typeFilter, setTypeFilter] = useState<WineType | 'all'>(defaultType);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredWines = wines.filter((w) => {
    const matchesType = typeFilter === 'all' || w.type === typeFilter;
    const matchesSearch =
      !searchQuery ||
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.winery.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.country.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const filteredWineries = wineries.filter((w) => {
    return (
      !searchQuery ||
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.country.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div
      className="min-h-screen pb-32"
      style={{ background: '#f8f4f2', maxWidth: 480, margin: '0 auto' }}
    >
      {/* Header */}
      <div className="px-4 pt-6 pb-4" style={{ background: '#fff', borderBottom: '1px solid #f0ebe8' }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 14 }}>
          Исследование
        </h1>
        {/* Search bar */}
        <div
          className="flex items-center gap-2 px-3 rounded-xl"
          style={{ background: '#f5f0ee', height: 44 }}
        >
          <Search size={18} color="#999" />
          <input
            type="text"
            placeholder="Поиск вин, виноделен, регионов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none"
            style={{ fontSize: 14, color: '#333' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')}>
              <X size={16} color="#999" />
            </button>
          )}
          <button
            className="p-1 rounded-lg"
            style={{ background: '#722F37' }}
          >
            <SlidersHorizontal size={16} color="#fff" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-0 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-2 text-center transition-colors"
              style={{
                borderBottom: `2.5px solid ${activeTab === tab.key ? '#722F37' : 'transparent'}`,
                color: activeTab === tab.key ? '#722F37' : '#888',
                fontSize: 15,
                fontWeight: activeTab === tab.key ? 700 : 500,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'wines' && (
        <>
          {/* Type filter chips */}
          <div
            className="flex gap-2 overflow-x-auto px-4 py-3"
            style={{ scrollbarWidth: 'none', background: '#fff' }}
          >
            {typeFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => setTypeFilter(f.key)}
                className="rounded-full px-3 py-1.5 whitespace-nowrap transition-all"
                style={{
                  background: typeFilter === f.key ? '#722F37' : '#f5f0ee',
                  color: typeFilter === f.key ? '#fff' : '#555',
                  fontSize: 13,
                  fontWeight: 600,
                  flexShrink: 0,
                  border: 'none',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Results count */}
          <div className="px-4 py-3">
            <p style={{ fontSize: 13, color: '#888' }}>
              Найдено {filteredWines.length} вин
            </p>
          </div>

          {/* Wine grid */}
          <div className="px-4 pb-4">
            {filteredWines.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {filteredWines.map((wine) => (
                  <WineCard key={wine.id} wine={wine} compact />
                ))}
              </div>
            ) : (
              <div
                className="rounded-xl p-10 text-center"
                style={{ background: '#fff', color: '#888', fontSize: 14 }}
              >
                <span style={{ fontSize: 40, display: 'block', marginBottom: 8 }}>🍷</span>
                Ничего не найдено
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === 'wineries' && (
        <div className="px-4 pt-4 pb-4">
          <p style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>
            Найдено {filteredWineries.length} виноделен
          </p>
          <div className="flex flex-col gap-3">
            {filteredWineries.map((winery) => (
              <WineryCard key={winery.id} winery={winery} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}