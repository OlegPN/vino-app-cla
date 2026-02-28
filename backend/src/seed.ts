import { WineType } from '@prisma/client';
import { prisma } from './db';

async function main() {
  console.log('🌱 Seeding database...');

  const bordeaux = await prisma.region.create({
    data: { name: 'Bordeaux', country: 'France', subregion: 'Médoc' },
  });
  const tuscany = await prisma.region.create({
    data: { name: 'Tuscany', country: 'Italy', subregion: 'Chianti' },
  });
  const napa = await prisma.region.create({
    data: { name: 'Napa Valley', country: 'USA' },
  });

  const chateau = await prisma.winery.create({
    data: { name: 'Château Margaux', country: 'France', region: 'Bordeaux' },
  });
  const antinori = await prisma.winery.create({
    data: { name: 'Antinori', country: 'Italy', region: 'Tuscany' },
  });
  const opusWinery = await prisma.winery.create({
    data: { name: 'Opus One Winery', country: 'USA', region: 'Napa Valley' },
  });

  const wines = await Promise.all([
    prisma.wine.create({
      data: {
        name: 'Château Margaux',
        vintage: 2018,
        type: WineType.RED,
        grapeVarieties: ['Cabernet Sauvignon', 'Merlot', 'Petit Verdot'],
        alcoholPct: 13.5,
        tastingNotes: 'Элегантное и сложное вино с нотами чёрной смородины, фиалки и кедра.',
        avgRating: 4.8,
        reviewCount: 1240,
        wineryId: chateau.id,
        regionId: bordeaux.id,
        imageUrl: 'https://via.placeholder.com/300x400/722F37/FFFFFF?text=Chateau+Margaux',
        foodPairings: { create: [{ food: 'Говяжья вырезка' }, { food: 'Бараньи котлеты' }, { food: 'Твёрдый сыр' }] },
        prices: { create: [{ retailer: 'Wine.com', price: 54000, currency: 'RUB' }, { retailer: 'Vivino Market', price: 52000, currency: 'RUB' }] },
      },
    }),
    prisma.wine.create({
      data: {
        name: 'Tignanello',
        vintage: 2019,
        type: WineType.RED,
        grapeVarieties: ['Sangiovese', 'Cabernet Sauvignon', 'Cabernet Franc'],
        alcoholPct: 14.0,
        tastingNotes: 'Богатое и бархатистое, с ароматами вишни, сливы, табака и нотками ванили.',
        avgRating: 4.6,
        reviewCount: 856,
        wineryId: antinori.id,
        regionId: tuscany.id,
        imageUrl: 'https://via.placeholder.com/300x400/722F37/FFFFFF?text=Tignanello',
        foodPairings: { create: [{ food: 'Паста болоньезе' }, { food: 'Стейк на гриле' }, { food: 'Ризотто с трюфелем' }] },
        prices: { create: [{ retailer: 'Wine.com', price: 8500, currency: 'RUB' }] },
      },
    }),
    prisma.wine.create({
      data: {
        name: 'Opus One',
        vintage: 2018,
        type: WineType.RED,
        grapeVarieties: ['Cabernet Sauvignon', 'Merlot', 'Cabernet Franc', 'Petit Verdot', 'Malbec'],
        alcoholPct: 14.5,
        tastingNotes: 'Полнотелое вино с ежевикой, тёмной сливой, мокко и элегантными танинами.',
        avgRating: 4.7,
        reviewCount: 2100,
        wineryId: opusWinery.id,
        regionId: napa.id,
        imageUrl: 'https://via.placeholder.com/300x400/722F37/FFFFFF?text=Opus+One',
        foodPairings: { create: [{ food: 'Рёбрышки прайм-риб' }, { food: 'Утиное конфи' }] },
        prices: { create: [{ retailer: 'Total Wine', price: 31500, currency: 'RUB' }, { retailer: 'Wine.com', price: 30500, currency: 'RUB' }] },
      },
    }),
    prisma.wine.create({
      data: {
        name: 'Dom Pérignon',
        vintage: 2012,
        type: WineType.SPARKLING,
        grapeVarieties: ['Chardonnay', 'Pinot Noir'],
        alcoholPct: 12.5,
        tastingNotes: 'Тонкие стойкие пузырьки, ноты белого персика, миндаля и бриоши.',
        avgRating: 4.9,
        reviewCount: 3200,
        imageUrl: 'https://via.placeholder.com/300x400/F5F5DC/333333?text=Dom+Perignon',
        foodPairings: { create: [{ food: 'Устрицы' }, { food: 'Икра' }, { food: 'Омар' }] },
        prices: { create: [{ retailer: 'Wine.com', price: 19700, currency: 'RUB' }] },
      },
    }),
  ]);

  console.log(`✅ Created ${wines.length} wines`);
  console.log('🍷 Seed complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
