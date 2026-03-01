// Local wine bottle photos (served from /public/wines/)
const WINE_PHOTOS: Record<string, string[]> = {
  RED:       ['/wines/red-bordeaux.jpg', '/wines/red-burgundy.jpg', '/wines/red-napa.jpg', '/wines/red-italian.jpg', '/wines/red-rhone.jpg'],
  WHITE:     ['/wines/white-burgundy.jpg', '/wines/white-sauvignon.jpg', '/wines/white-riesling.jpg'],
  ROSE:      ['/wines/rose.jpg'],
  SPARKLING: ['/wines/sparkling.jpg', '/wines/champagne.jpg'],
  DESSERT:   ['/wines/dessert.jpg'],
  FORTIFIED: ['/wines/port.jpg'],
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
