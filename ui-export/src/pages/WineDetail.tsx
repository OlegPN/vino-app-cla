import { useState } from 'react';
import { ArrowLeft, Heart, Share2, BookmarkPlus, ShoppingCart, BadgeCheck } from 'lucide-react';
import { useParams, useNavigate } from 'react-router';
import { wines, formatPrice, wineTypeLabel, wineTypeColor } from '../data/wines';
import { StarRating } from '../components/StarRating';

export default function WineDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const wine = wines.find((w) => w.id === id);
  const [wished, setWished] = useState(wine?.wishlist ?? false);
  const [inCollection, setInCollection] = useState(wine?.inCollection ?? false);
  const [activeTab, setActiveTab] = useState<'info' | 'reviews'>('info');

  if (!wine) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen" style={{ maxWidth: 480, margin: '0 auto' }}>
        <span style={{ fontSize: 48, marginBottom: 16 }}>🍷</span>
        <p style={{ color: '#888' }}>Вино не найдено</p>
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

  const typeColor = wineTypeColor[wine.type];

  const reviews = [
    { id: 'r1', user: 'Алексей К.', avatar: 'АК', rating: 4.5, comment: 'Отличное вино! Прекрасный баланс фруктов и танинов. Буду брать снова.', date: '15 фев 2024' },
    { id: 'r2', user: 'Мария В.', avatar: 'МВ', rating: 4.0, comment: 'Хорошее вино за свои деньги, пьётся легко, приятный аромат.', date: '3 янв 2024' },
    { id: 'r3', user: 'Дмитрий С.', avatar: 'ДС', rating: 5.0, comment: 'Шедевр! Долгое послевкусие, сложный букет. Рекомендую всем ценителям.', date: '28 дек 2023' },
  ];

  return (
    <div
      className="min-h-screen pb-20"
      style={{ background: '#f8f4f2', maxWidth: 480, margin: '0 auto' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ background: '#fff' }}
      >
        <button
          className="p-2 -ml-2 rounded-full"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={22} color="#333" />
        </button>
        <div className="flex gap-2">
          <button
            className="p-2 rounded-full"
            style={{ background: wished ? '#fff0f3' : '#f5f0ee' }}
            onClick={() => setWished(!wished)}
          >
            <Heart size={20} color={wished ? '#E8A838' : '#666'} fill={wished ? '#E8A838' : 'none'} />
          </button>
          <button
            className="p-2 rounded-full"
            style={{ background: '#f5f0ee' }}
          >
            <Share2 size={20} color="#666" />
          </button>
        </div>
      </div>

      {/* Wine Image & Name */}
      <div
        className="px-4 pb-6 pt-4"
        style={{ background: '#fff' }}
      >
        <div className="flex gap-4">
          <div
            className="rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ width: 120, height: 200, background: '#f5f0ee' }}
          >
            <img
              src={wine.image}
              alt={wine.name}
              style={{ height: '90%', width: 'auto', objectFit: 'contain' }}
            />
          </div>
          <div className="flex-1 flex flex-col justify-center gap-2">
            <span
              className="inline-block rounded-full px-3 py-1 self-start"
              style={{ background: typeColor + '22', color: typeColor, fontSize: 12, fontWeight: 700 }}
            >
              {wineTypeLabel[wine.type]}
            </span>
            <div>
              <p style={{ fontSize: 13, color: typeColor, fontWeight: 600 }}>{wine.winery}</p>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', lineHeight: 1.3 }}>
                {wine.name}
              </h1>
              <p style={{ fontSize: 13, color: '#888' }}>{wine.year} · {wine.region}, {wine.country}</p>
            </div>
            <StarRating rating={wine.rating} count={wine.ratingsCount} size={15} />
            <p style={{ fontSize: 22, fontWeight: 800, color: '#1a1a1a' }}>
              {formatPrice(wine.price)}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 mt-4">
          <button
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-opacity hover:opacity-90"
            style={{ background: '#722F37', color: '#fff', fontSize: 14, fontWeight: 700 }}
          >
            <ShoppingCart size={18} />
            Купить
          </button>
          <button
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl"
            style={{
              background: inCollection ? '#722F37' + '22' : '#f5f0ee',
              color: inCollection ? '#722F37' : '#555',
              fontSize: 14,
              fontWeight: 700,
              border: `1.5px solid ${inCollection ? '#722F37' : 'transparent'}`,
            }}
            onClick={() => setInCollection(!inCollection)}
          >
            <BookmarkPlus size={18} />
            {inCollection ? 'В коллекции' : 'Добавить'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex border-b"
        style={{ background: '#fff', borderColor: '#f0ebe8', marginTop: 8 }}
      >
        {(['info', 'reviews'] as const).map((tab) => (
          <button
            key={tab}
            className="flex-1 py-3"
            style={{
              borderBottom: `2.5px solid ${activeTab === tab ? '#722F37' : 'transparent'}`,
              color: activeTab === tab ? '#722F37' : '#888',
              fontSize: 15,
              fontWeight: activeTab === tab ? 700 : 500,
            }}
            onClick={() => setActiveTab(tab)}
          >
            {tab === 'info' ? 'О вине' : 'Отзывы'}
          </button>
        ))}
      </div>

      {activeTab === 'info' && (
        <div className="px-4 pt-4 flex flex-col gap-4">
          {/* Description */}
          <div className="rounded-xl p-4" style={{ background: '#fff' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, color: '#1a1a1a' }}>Описание</h3>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>{wine.description}</p>
          </div>

          {/* Details */}
          <div className="rounded-xl p-4" style={{ background: '#fff' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#1a1a1a' }}>Характеристики</h3>
            <div className="flex flex-col gap-3">
              {[
                { label: 'Виноград', value: wine.grapes.join(', ') },
                { label: 'Регион', value: `${wine.region}, ${wine.country}` },
                { label: 'Год', value: wine.year.toString() },
                { label: 'Алкоголь', value: `${wine.alcohol}%` },
                { label: 'Тип', value: wineTypeLabel[wine.type] },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center">
                  <span style={{ fontSize: 14, color: '#888' }}>{item.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Flavors */}
          <div className="rounded-xl p-4" style={{ background: '#fff' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#1a1a1a' }}>Вкусы и ароматы</h3>
            <div className="flex flex-wrap gap-2">
              {wine.flavors.map((flavor) => (
                <span
                  key={flavor}
                  className="rounded-full px-3 py-1.5"
                  style={{ background: '#f5f0ee', color: '#555', fontSize: 13, fontWeight: 500 }}
                >
                  {flavor}
                </span>
              ))}
            </div>
          </div>

          {/* Rating breakdown */}
          <div className="rounded-xl p-4" style={{ background: '#fff' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#1a1a1a' }}>Рейтинг</h3>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center">
                <span style={{ fontSize: 48, fontWeight: 800, color: '#1a1a1a', lineHeight: 1 }}>
                  {wine.rating.toFixed(1)}
                </span>
                <StarRating rating={wine.rating} showCount={false} size={16} />
                <span style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                  {wine.ratingsCount.toLocaleString('ru-RU')} оценок
                </span>
              </div>
              <div className="flex-1 flex flex-col gap-1.5">
                {[5, 4, 3, 2, 1].map((star) => {
                  const pct = star === 5 ? 45 : star === 4 ? 30 : star === 3 ? 15 : star === 2 ? 7 : 3;
                  return (
                    <div key={star} className="flex items-center gap-2">
                      <span style={{ fontSize: 12, color: '#888', width: 8 }}>{star}</span>
                      <div className="flex-1 rounded-full overflow-hidden" style={{ height: 6, background: '#f0ebe8' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: '#E8A838' }}
                        />
                      </div>
                      <span style={{ fontSize: 12, color: '#888', width: 24 }}>{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="px-4 pt-4 flex flex-col gap-3">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-xl p-4" style={{ background: '#fff' }}>
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="rounded-full flex items-center justify-center text-white"
                  style={{
                    width: 40,
                    height: 40,
                    background: '#722F37',
                    fontSize: 13,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {review.avatar}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{review.user}</span>
                    <span style={{ fontSize: 12, color: '#aaa' }}>{review.date}</span>
                  </div>
                  <StarRating rating={review.rating} showCount={false} size={13} />
                </div>
              </div>
              <p style={{ fontSize: 14, color: '#555', lineHeight: 1.6 }}>{review.comment}</p>
            </div>
          ))}

          <button
            className="w-full py-3 rounded-xl mt-1"
            style={{ background: '#722F37', color: '#fff', fontSize: 15, fontWeight: 700 }}
          >
            Написать отзыв
          </button>
        </div>
      )}
    </div>
  );
}
