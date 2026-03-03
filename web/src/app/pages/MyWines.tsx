import { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { useNavigate } from 'react-router';
import { wines, formatPrice } from '../data/wines';
import { StarRating } from '../components/StarRating';

const tabs = [
  { key: 'collection', label: 'Коллекция' },
  { key: 'wishlist', label: 'Желаемое' },
  { key: 'history', label: 'История' },
];

export default function MyWines() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('collection');

  const collection = wines.filter((w) => w.inCollection);
  const wishlist = wines.filter((w) => w.wishlist);
  const history = wines;

  const currentList =
    activeTab === 'collection' ? collection :
    activeTab === 'wishlist' ? wishlist :
    history;

  return (
    <div
      className="min-h-screen pb-32"
      style={{ background: '#f8f4f2', maxWidth: 480, margin: '0 auto' }}
    >
      {/* Header */}
      <div className="px-4 pt-6 pb-4" style={{ background: '#fff' }}>
        <div className="flex items-center justify-between mb-4">
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>Мои вина</h1>
          <button
            className="flex items-center gap-1.5 px-3 py-2 rounded-full"
            style={{ background: '#722F37' }}
            onClick={() => navigate('/explore')}
          >
            <PlusCircle size={16} color="#fff" />
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Добавить</span>
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'В коллекции', value: collection.length },
            { label: 'Желаемые', value: wishlist.length },
            { label: 'Попробовано', value: wines.length },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl p-3 text-center"
              style={{ background: '#f5f0ee' }}
            >
              <div style={{ fontSize: 22, fontWeight: 800, color: '#722F37' }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              className="flex-1 py-2 text-center"
              style={{
                borderBottom: `2.5px solid ${activeTab === tab.key ? '#722F37' : 'transparent'}`,
                color: activeTab === tab.key ? '#722F37' : '#888',
                fontSize: 14,
                fontWeight: activeTab === tab.key ? 700 : 500,
              }}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 flex flex-col gap-3">
        {currentList.length === 0 ? (
          <div
            className="rounded-xl p-10 text-center mt-4"
            style={{ background: '#fff' }}
          >
            <span style={{ fontSize: 48, display: 'block', marginBottom: 12 }}>🍷</span>
            <p style={{ color: '#888', fontSize: 14 }}>
              {activeTab === 'collection'
                ? 'Ваша коллекция пуста. Добавьте вина!'
                : 'Список желаемого пуст.'}
            </p>
            <button
              className="mt-4 px-6 py-2 rounded-full"
              style={{ background: '#722F37', color: '#fff', fontSize: 14, fontWeight: 600 }}
              onClick={() => navigate('/explore')}
            >
              Исследовать вина
            </button>
          </div>
        ) : (
          currentList.map((wine) => (
            <div
              key={wine.id}
              className="rounded-xl overflow-hidden flex cursor-pointer"
              style={{ background: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
              onClick={() => navigate(`/wine/${wine.id}`)}
            >
              <div
                className="flex items-center justify-center flex-shrink-0"
                style={{ width: 90, background: '#f5f0ee' }}
              >
                <img
                  src={wine.image}
                  alt={wine.name}
                  style={{ height: 90, width: 'auto', objectFit: 'contain', padding: 8 }}
                />
              </div>
              <div className="p-3 flex-1 flex flex-col justify-center gap-1">
                <p style={{ fontSize: 12, color: '#722F37', fontWeight: 600 }}>{wine.winery}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>
                  {wine.name} {wine.year}
                </p>
                <p style={{ fontSize: 12, color: '#888' }}>{wine.region}, {wine.country}</p>
                <div className="flex items-center justify-between mt-1">
                  <StarRating rating={wine.rating} count={wine.ratingsCount} size={13} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>
                    {formatPrice(wine.price)}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}