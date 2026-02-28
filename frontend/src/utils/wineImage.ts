// Real Unsplash wine bottle photos (curated, no API key needed)
const WINE_PHOTOS: Record<string, string[]> = {
  RED: [
    'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=300&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=300&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=300&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1504279577054-8c03d689de84?w=300&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506377585622-bedcbb027afc?w=300&h=400&fit=crop&q=80',
  ],
  WHITE: [
    'https://images.unsplash.com/photo-1568213816046-0ee1c42bd559?w=300&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=300&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?w=300&h=400&fit=crop&q=80',
  ],
  ROSE: [
    'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1578911373434-0cb395d2cbfb?w=300&h=400&fit=crop&q=80',
  ],
  SPARKLING: [
    'https://images.unsplash.com/photo-1491933382434-500287f9b54b?w=300&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1535540878298-099e9ea57b5b?w=300&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=300&h=400&fit=crop&q=80',
  ],
  DESSERT: [
    'https://images.unsplash.com/photo-1574968492987-cb640d17e36a?w=300&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1527723945520-2e7e42e42b67?w=300&h=400&fit=crop&q=80',
  ],
  FORTIFIED: [
    'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=300&h=400&fit=crop&q=80',
    'https://images.unsplash.com/photo-1516594798947-e65505dbb29d?w=300&h=400&fit=crop&q=80',
  ],
};

const TYPE_COLORS: Record<string, { bg: string; text: string; emoji: string }> = {
  RED:       { bg: '#6B2020', text: '#F5E6E6', emoji: '🍷' },
  WHITE:     { bg: '#C8A84B', text: '#FFF8E7', emoji: '🥂' },
  ROSE:      { bg: '#D4687A', text: '#FFF0F3', emoji: '🌸' },
  SPARKLING: { bg: '#2C5F8A', text: '#E8F4FD', emoji: '🍾' },
  DESSERT:   { bg: '#8B6914', text: '#FFF8E1', emoji: '🍯' },
  FORTIFIED: { bg: '#5C3317', text: '#F5EBE0', emoji: '🥃' },
};

// Pick a photo deterministically by name so the same wine always shows the same image
function pickPhoto(type: string, name: string): string | null {
  const photos = WINE_PHOTOS[type];
  if (!photos || photos.length === 0) return null;
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return photos[hash % photos.length];
}

export function getWineImageUri(type: string, name: string, imageUrl?: string | null, size: 'card' | 'detail' = 'card'): string {
  // Use custom image if it's not a placeholder
  if (imageUrl && !imageUrl.includes('placeholder') && !imageUrl.includes('placehold')) {
    return imageUrl;
  }

  // Try real Unsplash photo
  const photo = pickPhoto(type, name);
  if (photo) return photo;

  // SVG fallback
  const colors = TYPE_COLORS[type] || TYPE_COLORS.RED;
  const w = size === 'detail' ? 150 : 300;
  const h = size === 'detail' ? 200 : 400;
  const safe = (name || '').replace(/[<>&'"]/g, '');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" fill="${colors.bg}" rx="8"/>
    <text x="${w / 2}" y="${h * 0.7}" font-size="${size === 'detail' ? 36 : 48}" text-anchor="middle" dominant-baseline="middle">${colors.emoji}</text>
    <text x="${w / 2}" y="${h * 0.88}" font-size="${size === 'detail' ? 10 : 14}" text-anchor="middle" fill="${colors.text}" font-family="sans-serif">${safe.substring(0, 20)}</text>
  </svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
