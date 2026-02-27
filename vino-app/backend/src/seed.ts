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
        tastingNotes: 'Elegant and complex with notes of blackcurrant, violets, and cedar.',
        avgRating: 4.8,
        reviewCount: 1240,
        wineryId: chateau.id,
        regionId: bordeaux.id,
        imageUrl: 'https://via.placeholder.com/300x400/722F37/FFFFFF?text=Chateau+Margaux',
        foodPairings: { create: [{ food: 'Beef tenderloin' }, { food: 'Lamb chops' }, { food: 'Hard cheese' }] },
        prices: { create: [{ retailer: 'Wine.com', price: 599, currency: 'USD' }, { retailer: 'Vivino Market', price: 579, currency: 'USD' }] },
      },
    }),
    prisma.wine.create({
      data: {
        name: 'Tignanello',
        vintage: 2019,
        type: WineType.RED,
        grapeVarieties: ['Sangiovese', 'Cabernet Sauvignon', 'Cabernet Franc'],
        alcoholPct: 14.0,
        tastingNotes: 'Rich and velvety with cherry, plum, tobacco and hints of vanilla.',
        avgRating: 4.6,
        reviewCount: 856,
        wineryId: antinori.id,
        regionId: tuscany.id,
        imageUrl: 'https://via.placeholder.com/300x400/722F37/FFFFFF?text=Tignanello',
        foodPairings: { create: [{ food: 'Pasta Bolognese' }, { food: 'Grilled steak' }, { food: 'Truffle risotto' }] },
        prices: { create: [{ retailer: 'Wine.com', price: 95, currency: 'USD' }] },
      },
    }),
    prisma.wine.create({
      data: {
        name: 'Opus One',
        vintage: 2018,
        type: WineType.RED,
        grapeVarieties: ['Cabernet Sauvignon', 'Merlot', 'Cabernet Franc', 'Petit Verdot', 'Malbec'],
        alcoholPct: 14.5,
        tastingNotes: 'Full-bodied with blackberry, dark plum, mocha, and elegant tannins.',
        avgRating: 4.7,
        reviewCount: 2100,
        wineryId: opusWinery.id,
        regionId: napa.id,
        imageUrl: 'https://via.placeholder.com/300x400/722F37/FFFFFF?text=Opus+One',
        foodPairings: { create: [{ food: 'Prime rib' }, { food: 'Duck confit' }] },
        prices: { create: [{ retailer: 'Total Wine', price: 350, currency: 'USD' }, { retailer: 'Wine.com', price: 339, currency: 'USD' }] },
      },
    }),
    prisma.wine.create({
      data: {
        name: 'Dom Pérignon',
        vintage: 2012,
        type: WineType.SPARKLING,
        grapeVarieties: ['Chardonnay', 'Pinot Noir'],
        alcoholPct: 12.5,
        tastingNotes: 'Fine persistent bubbles, notes of white peach, almond, and brioche.',
        avgRating: 4.9,
        reviewCount: 3200,
        imageUrl: 'https://via.placeholder.com/300x400/F5F5DC/333333?text=Dom+Perignon',
        foodPairings: { create: [{ food: 'Oysters' }, { food: 'Caviar' }, { food: 'Lobster' }] },
        prices: { create: [{ retailer: 'Wine.com', price: 219, currency: 'USD' }] },
      },
    }),
  ]);

  console.log(`✅ Created ${wines.length} wines`);
  console.log('🍷 Seed complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
