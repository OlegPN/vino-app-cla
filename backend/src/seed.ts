import { WineType } from '@prisma/client';
import { prisma } from './db';

async function main() {
  console.log('🌱 Seeding database...');

  // Clean existing data
  await prisma.winePrice.deleteMany();
  await prisma.foodPairing.deleteMany();
  await prisma.wine.deleteMany();
  await prisma.winery.deleteMany();
  await prisma.region.deleteMany();

  // ── Regions ──────────────────────────────────────────────
  const [
    bordeaux, tuscany, napa, burgundy, rioja,
    champagne, mosel, marlborough, mendoza, priorat,
    rhone, piedmont, barossa, alsace, douro,
  ] = await Promise.all([
    prisma.region.create({ data: { name: 'Bordeaux',       country: 'France',      subregion: 'Médoc' } }),
    prisma.region.create({ data: { name: 'Tuscany',        country: 'Italy',       subregion: 'Chianti Classico' } }),
    prisma.region.create({ data: { name: 'Napa Valley',    country: 'USA',         subregion: 'Oakville' } }),
    prisma.region.create({ data: { name: 'Burgundy',       country: 'France',      subregion: 'Côte de Nuits' } }),
    prisma.region.create({ data: { name: 'Rioja',          country: 'Spain',       subregion: 'Rioja Alta' } }),
    prisma.region.create({ data: { name: 'Champagne',      country: 'France',      subregion: 'Montagne de Reims' } }),
    prisma.region.create({ data: { name: 'Mosel',          country: 'Germany',     subregion: 'Bernkastel' } }),
    prisma.region.create({ data: { name: 'Marlborough',    country: 'New Zealand' } }),
    prisma.region.create({ data: { name: 'Mendoza',        country: 'Argentina',   subregion: 'Luján de Cuyo' } }),
    prisma.region.create({ data: { name: 'Priorat',        country: 'Spain',       subregion: 'Gratallops' } }),
    prisma.region.create({ data: { name: 'Rhône Valley',   country: 'France',      subregion: 'Châteauneuf-du-Pape' } }),
    prisma.region.create({ data: { name: 'Piedmont',       country: 'Italy',       subregion: 'Barolo' } }),
    prisma.region.create({ data: { name: 'Barossa Valley', country: 'Australia' } }),
    prisma.region.create({ data: { name: 'Alsace',         country: 'France' } }),
    prisma.region.create({ data: { name: 'Douro Valley',   country: 'Portugal' } }),
  ]);

  // ── Wineries ─────────────────────────────────────────────
  const [
    wChateau, wAntinori, wOpus, wDRC, wVega,
    wMoet, wEgon, wCloudy, wCatena, wAlvaro,
    wChateauneuf, wGaja, wPenfolds, wTrimbach, wTaylor,
  ] = await Promise.all([
    prisma.winery.create({ data: { name: 'Château Margaux',         country: 'France',      region: 'Bordeaux' } }),
    prisma.winery.create({ data: { name: 'Antinori',                country: 'Italy',       region: 'Tuscany' } }),
    prisma.winery.create({ data: { name: 'Opus One Winery',         country: 'USA',         region: 'Napa Valley' } }),
    prisma.winery.create({ data: { name: 'Domaine de la Romanée-Conti', country: 'France',  region: 'Burgundy' } }),
    prisma.winery.create({ data: { name: 'Vega Sicilia',            country: 'Spain',       region: 'Ribera del Duero' } }),
    prisma.winery.create({ data: { name: 'Moët & Chandon',          country: 'France',      region: 'Champagne' } }),
    prisma.winery.create({ data: { name: 'Egon Müller',             country: 'Germany',     region: 'Mosel' } }),
    prisma.winery.create({ data: { name: 'Cloudy Bay',              country: 'New Zealand', region: 'Marlborough' } }),
    prisma.winery.create({ data: { name: 'Catena Zapata',           country: 'Argentina',   region: 'Mendoza' } }),
    prisma.winery.create({ data: { name: 'Álvaro Palacios',         country: 'Spain',       region: 'Priorat' } }),
    prisma.winery.create({ data: { name: 'Château Rayas',           country: 'France',      region: 'Rhône Valley' } }),
    prisma.winery.create({ data: { name: 'Gaja',                    country: 'Italy',       region: 'Piedmont' } }),
    prisma.winery.create({ data: { name: 'Penfolds',                country: 'Australia',   region: 'Barossa Valley' } }),
    prisma.winery.create({ data: { name: 'Trimbach',                country: 'France',      region: 'Alsace' } }),
    prisma.winery.create({ data: { name: 'Taylor Fladgate',         country: 'Portugal',    region: 'Douro Valley' } }),
  ]);

  // ── Wines ────────────────────────────────────────────────
  const wines = await Promise.all([

    // ── RED ─────────────────────────────────────────────────
    prisma.wine.create({ data: {
      name: 'Château Margaux', vintage: 2018, type: WineType.RED,
      grapeVarieties: ['Cabernet Sauvignon', 'Merlot', 'Petit Verdot', 'Cabernet Franc'],
      alcoholPct: 13.5, avgRating: 4.8, reviewCount: 1240,
      tastingNotes: 'Elegantly structured with blackcurrant, violets, graphite and cedar. Long silky finish.',
      imageUrl: 'https://placehold.co/300x400/5C1A1A/FFFFFF?text=Chateau+Margaux',
      wineryId: wChateau.id, regionId: bordeaux.id,
      foodPairings: { create: [{ food: 'Beef tenderloin' }, { food: 'Lamb chops' }, { food: 'Aged Comté' }] },
      prices: { create: [{ retailer: 'Wine.com', price: 599, currency: 'USD' }, { retailer: 'Vivino Market', price: 579, currency: 'USD' }] },
    }}),

    prisma.wine.create({ data: {
      name: 'Tignanello', vintage: 2019, type: WineType.RED,
      grapeVarieties: ['Sangiovese', 'Cabernet Sauvignon', 'Cabernet Franc'],
      alcoholPct: 14.0, avgRating: 4.6, reviewCount: 856,
      tastingNotes: 'Rich and velvety with ripe cherry, dark plum, tobacco and vanilla oak.',
      imageUrl: 'https://placehold.co/300x400/6B2020/FFFFFF?text=Tignanello',
      wineryId: wAntinori.id, regionId: tuscany.id,
      foodPairings: { create: [{ food: 'Pasta Bolognese' }, { food: 'Grilled T-bone' }, { food: 'Truffle risotto' }] },
      prices: { create: [{ retailer: 'Wine.com', price: 95, currency: 'USD' }, { retailer: 'Total Wine', price: 89, currency: 'USD' }] },
    }}),

    prisma.wine.create({ data: {
      name: 'Opus One', vintage: 2018, type: WineType.RED,
      grapeVarieties: ['Cabernet Sauvignon', 'Merlot', 'Cabernet Franc', 'Petit Verdot', 'Malbec'],
      alcoholPct: 14.5, avgRating: 4.7, reviewCount: 2100,
      tastingNotes: 'Full-bodied with blackberry, dark plum, mocha, espresso and elegant tannins.',
      imageUrl: 'https://placehold.co/300x400/3D0C02/FFFFFF?text=Opus+One',
      wineryId: wOpus.id, regionId: napa.id,
      foodPairings: { create: [{ food: 'Prime rib' }, { food: 'Duck confit' }, { food: 'Brie' }] },
      prices: { create: [{ retailer: 'Total Wine', price: 350, currency: 'USD' }, { retailer: 'Wine.com', price: 339, currency: 'USD' }] },
    }}),

    prisma.wine.create({ data: {
      name: 'Romanée-Conti', vintage: 2015, type: WineType.RED,
      grapeVarieties: ['Pinot Noir'],
      alcoholPct: 13.0, avgRating: 5.0, reviewCount: 412,
      tastingNotes: 'Ethereal and transcendent. Rose petals, forest floor, spice and silk. The pinnacle of Pinot Noir.',
      imageUrl: 'https://placehold.co/300x400/8B0000/FFFFFF?text=Romanee-Conti',
      wineryId: wDRC.id, regionId: burgundy.id,
      foodPairings: { create: [{ food: 'Roasted pigeon' }, { food: 'Wild mushroom tart' }] },
      prices: { create: [{ retailer: 'Christie\'s Auction', price: 18000, currency: 'USD' }] },
    }}),

    prisma.wine.create({ data: {
      name: 'Vega Sicilia Único', vintage: 2009, type: WineType.RED,
      grapeVarieties: ['Tempranillo', 'Cabernet Sauvignon'],
      alcoholPct: 14.0, avgRating: 4.9, reviewCount: 634,
      tastingNotes: 'Monumental complexity — dried fig, leather, tobacco, cedar, violets. Aged 10 years before release.',
      imageUrl: 'https://placehold.co/300x400/4A0404/FFFFFF?text=Vega+Sicilia',
      wineryId: wVega.id, regionId: rioja.id,
      foodPairings: { create: [{ food: 'Roast suckling pig' }, { food: 'Aged Manchego' }, { food: 'Venison' }] },
      prices: { create: [{ retailer: 'Wine.com', price: 320, currency: 'USD' }] },
    }}),

    prisma.wine.create({ data: {
      name: 'L\'Ermita', vintage: 2017, type: WineType.RED,
      grapeVarieties: ['Garnacha', 'Cabernet Sauvignon'],
      alcoholPct: 15.0, avgRating: 4.8, reviewCount: 289,
      tastingNotes: 'Explosive mineral power from old Garnacha vines on slate. Black fruit, licorice, dried herbs.',
      imageUrl: 'https://placehold.co/300x400/2D0A0A/FFFFFF?text=L\'Ermita',
      wineryId: wAlvaro.id, regionId: priorat.id,
      foodPairings: { create: [{ food: 'Grilled lamb' }, { food: 'Charcuterie board' }] },
      prices: { create: [{ retailer: 'Wine-Searcher', price: 480, currency: 'USD' }] },
    }}),

    prisma.wine.create({ data: {
      name: 'Château Rayas Châteauneuf-du-Pape', vintage: 2016, type: WineType.RED,
      grapeVarieties: ['Grenache'],
      alcoholPct: 14.5, avgRating: 4.7, reviewCount: 178,
      tastingNotes: '100% Grenache at its peak. Raspberry, garrigue, orange peel, silky and weightless.',
      imageUrl: 'https://placehold.co/300x400/7B1818/FFFFFF?text=Chateau+Rayas',
      wineryId: wChateauneuf.id, regionId: rhone.id,
      foodPairings: { create: [{ food: 'Roast chicken with herbs' }, { food: 'Ratatouille' }] },
      prices: { create: [{ retailer: 'Wine.com', price: 260, currency: 'USD' }] },
    }}),

    prisma.wine.create({ data: {
      name: 'Gaja Barbaresco', vintage: 2017, type: WineType.RED,
      grapeVarieties: ['Nebbiolo'],
      alcoholPct: 14.0, avgRating: 4.7, reviewCount: 721,
      tastingNotes: 'Rose, tar, cherry and anise. Fine grippy tannins with a long mineral finish.',
      imageUrl: 'https://placehold.co/300x400/601010/FFFFFF?text=Gaja+Barbaresco',
      wineryId: wGaja.id, regionId: piedmont.id,
      foodPairings: { create: [{ food: 'Beef braised in Barolo' }, { food: 'White truffle pasta' }] },
      prices: { create: [{ retailer: 'Wine.com', price: 210, currency: 'USD' }] },
    }}),

    prisma.wine.create({ data: {
      name: 'Penfolds Grange', vintage: 2016, type: WineType.RED,
      grapeVarieties: ['Shiraz', 'Cabernet Sauvignon'],
      alcoholPct: 14.5, avgRating: 4.8, reviewCount: 1560,
      tastingNotes: 'Australia\'s icon. Dark chocolate, blackberry jam, vanilla, tobacco. Dense and age-worthy.',
      imageUrl: 'https://placehold.co/300x400/330000/FFFFFF?text=Penfolds+Grange',
      wineryId: wPenfolds.id, regionId: barossa.id,
      foodPairings: { create: [{ food: 'Slow-roasted lamb shoulder' }, { food: 'Aged cheddar' }] },
      prices: { create: [{ retailer: 'Total Wine', price: 850, currency: 'USD' }] },
    }}),

    prisma.wine.create({ data: {
      name: 'Catena Zapata Adrianna Vineyard', vintage: 2018, type: WineType.RED,
      grapeVarieties: ['Malbec'],
      alcoholPct: 14.5, avgRating: 4.6, reviewCount: 344,
      tastingNotes: 'High-altitude Malbec at 1450m. Violet, blueberry, dark chocolate, earthy depth.',
      imageUrl: 'https://placehold.co/300x400/500A14/FFFFFF?text=Catena+Adrianna',
      wineryId: wCatena.id, regionId: mendoza.id,
      foodPairings: { create: [{ food: 'Argentinian asado' }, { food: 'Chimichurri steak' }] },
      prices: { create: [{ retailer: 'Wine.com', price: 140, currency: 'USD' }] },
    }}),

    // ── WHITE ────────────────────────────────────────────────
    prisma.wine.create({ data: {
      name: 'Cloudy Bay Sauvignon Blanc', vintage: 2022, type: WineType.WHITE,
      grapeVarieties: ['Sauvignon Blanc'],
      alcoholPct: 13.0, avgRating: 4.3, reviewCount: 4120,
      tastingNotes: 'Vibrant and aromatic. Passionfruit, grapefruit zest, fresh-cut grass, crisp acidity.',
      imageUrl: 'https://placehold.co/300x400/D4E8C2/333333?text=Cloudy+Bay',
      wineryId: wCloudy.id, regionId: marlborough.id,
      foodPairings: { create: [{ food: 'Grilled fish' }, { food: 'Goat cheese salad' }, { food: 'Thai green curry' }] },
      prices: { create: [{ retailer: 'Total Wine', price: 25, currency: 'USD' }, { retailer: 'Wine.com', price: 27, currency: 'USD' }] },
    }}),

    prisma.wine.create({ data: {
      name: 'Egon Müller Scharzhofberger Riesling Spätlese', vintage: 2020, type: WineType.WHITE,
      grapeVarieties: ['Riesling'],
      alcoholPct: 8.5, avgRating: 4.8, reviewCount: 267,
      tastingNotes: 'Electrifying slate minerality, peach, lime blossom, honeyed sweetness balanced by razor acidity.',
      imageUrl: 'https://placehold.co/300x400/F0EAD6/333333?text=Egon+Muller',
      wineryId: wEgon.id, regionId: mosel.id,
      foodPairings: { create: [{ food: 'Foie gras' }, { food: 'Spicy Thai dishes' }, { food: 'Smoked salmon' }] },
      prices: { create: [{ retailer: 'Wine-Searcher', price: 180, currency: 'USD' }] },
    }}),

    prisma.wine.create({ data: {
      name: 'Trimbach Clos Sainte Hune Riesling', vintage: 2016, type: WineType.WHITE,
      grapeVarieties: ['Riesling'],
      alcoholPct: 13.0, avgRating: 4.7, reviewCount: 198,
      tastingNotes: 'Benchmark Alsatian Riesling. Petrol, white flowers, grapefruit, saline finish. Ages beautifully.',
      imageUrl: 'https://placehold.co/300x400/E8E0C8/333333?text=Trimbach+Riesling',
      wineryId: wTrimbach.id, regionId: alsace.id,
      foodPairings: { create: [{ food: 'Choucroute garnie' }, { food: 'River crayfish' }, { food: 'Munster cheese' }] },
      prices: { create: [{ retailer: 'Wine.com', price: 145, currency: 'USD' }] },
    }}),

    prisma.wine.create({ data: {
      name: 'Puligny-Montrachet Premier Cru Les Pucelles', vintage: 2019, type: WineType.WHITE,
      grapeVarieties: ['Chardonnay'],
      alcoholPct: 13.5, avgRating: 4.6, reviewCount: 312,
      tastingNotes: 'Stunning white Burgundy. Hazelnut, white peach, honeysuckle, creamy texture, long mineral finish.',
      imageUrl: 'https://placehold.co/300x400/F5ECD7/333333?text=Puligny-Montrachet',
      regionId: burgundy.id,
      foodPairings: { create: [{ food: 'Scallops' }, { food: 'Lobster bisque' }, { food: 'Veal in cream sauce' }] },
      prices: { create: [{ retailer: 'Wine.com', price: 120, currency: 'USD' }] },
    }}),

    // ── ROSÉ ─────────────────────────────────────────────────
    prisma.wine.create({ data: {
      name: 'Château d\'Esclans Whispering Angel', vintage: 2022, type: WineType.ROSE,
      grapeVarieties: ['Grenache', 'Vermentino', 'Cinsault'],
      alcoholPct: 13.0, avgRating: 4.2, reviewCount: 5600,
      tastingNotes: 'The quintessential Provence rosé. Pale salmon, strawberry, white peach, floral, dry and elegant.',
      imageUrl: 'https://placehold.co/300x400/FFB6C1/333333?text=Whispering+Angel',
      foodPairings: { create: [{ food: 'Niçoise salad' }, { food: 'Grilled sea bass' }, { food: 'Charcuterie' }] },
      prices: { create: [{ retailer: 'Total Wine', price: 22, currency: 'USD' }, { retailer: 'Wine.com', price: 24, currency: 'USD' }] },
    }}),

    prisma.wine.create({ data: {
      name: 'Domaines Ott Clos Mireille Rosé', vintage: 2021, type: WineType.ROSE,
      grapeVarieties: ['Grenache', 'Cinsault', 'Syrah'],
      alcoholPct: 13.5, avgRating: 4.4, reviewCount: 780,
      tastingNotes: 'Sophisticated Côtes de Provence rosé. Rose hip, tangerine, dried herbs, saline minerality.',
      imageUrl: 'https://placehold.co/300x400/FFC0CB/333333?text=Ott+Rose',
      foodPairings: { create: [{ food: 'Bouillabaisse' }, { food: 'Grilled langoustines' }] },
      prices: { create: [{ retailer: 'Wine-Searcher', price: 45, currency: 'USD' }] },
    }}),

    // ── SPARKLING ────────────────────────────────────────────
    prisma.wine.create({ data: {
      name: 'Dom Pérignon', vintage: 2012, type: WineType.SPARKLING,
      grapeVarieties: ['Chardonnay', 'Pinot Noir'],
      alcoholPct: 12.5, avgRating: 4.9, reviewCount: 3200,
      tastingNotes: 'Fine persistent bubbles, white peach, almond, brioche, chalk. One of the great vintages.',
      imageUrl: 'https://placehold.co/300x400/F5F5DC/333333?text=Dom+Perignon',
      wineryId: wMoet.id, regionId: champagne.id,
      foodPairings: { create: [{ food: 'Oysters' }, { food: 'Beluga caviar' }, { food: 'Lobster' }] },
      prices: { create: [{ retailer: 'Wine.com', price: 219, currency: 'USD' }] },
    }}),

    prisma.wine.create({ data: {
      name: 'Krug Grande Cuvée 170ème Édition', vintage: null, type: WineType.SPARKLING,
      grapeVarieties: ['Pinot Noir', 'Chardonnay', 'Meunier'],
      alcoholPct: 12.0, avgRating: 4.8, reviewCount: 1450,
      tastingNotes: 'Composed from 120+ wines across 10+ vintages. Toast, hazelnut, honey, apple, extraordinary depth.',
      imageUrl: 'https://placehold.co/300x400/FFFFF0/333333?text=Krug+Grande+Cuvee',
      regionId: champagne.id,
      foodPairings: { create: [{ food: 'Truffle dishes' }, { food: 'Grilled langoustines' }, { food: 'Parmesan' }] },
      prices: { create: [{ retailer: 'Total Wine', price: 210, currency: 'USD' }] },
    }}),

    prisma.wine.create({ data: {
      name: 'Ferrari Giulio Ferrari Riserva del Fondatore', vintage: 2007, type: WineType.SPARKLING,
      grapeVarieties: ['Chardonnay'],
      alcoholPct: 12.5, avgRating: 4.6, reviewCount: 310,
      tastingNotes: 'Italy\'s finest Metodo Classico. Pastry, hazelnut, candied citrus, fine mousse, great length.',
      imageUrl: 'https://placehold.co/300x400/FAFAD2/333333?text=Ferrari+Giulio',
      foodPairings: { create: [{ food: 'Risotto alla Milanese' }, { food: 'Grilled turbot' }] },
      prices: { create: [{ retailer: 'Wine-Searcher', price: 130, currency: 'USD' }] },
    }}),

    // ── DESSERT ──────────────────────────────────────────────
    prisma.wine.create({ data: {
      name: 'Château d\'Yquem', vintage: 2015, type: WineType.DESSERT,
      grapeVarieties: ['Sémillon', 'Sauvignon Blanc'],
      alcoholPct: 13.5, avgRating: 4.9, reviewCount: 890,
      tastingNotes: 'The world\'s greatest Sauternes. Apricot jam, honey, saffron, mango, crème brûlée. Immortal.',
      imageUrl: 'https://placehold.co/300x400/FFD700/333333?text=Chateau+d\'Yquem',
      regionId: bordeaux.id,
      foodPairings: { create: [{ food: 'Foie gras' }, { food: 'Roquefort' }, { food: 'Crème brûlée' }] },
      prices: { create: [{ retailer: 'Wine.com', price: 520, currency: 'USD' }] },
    }}),

    prisma.wine.create({ data: {
      name: 'Egon Müller Scharzhofberger Trockenbeerenauslese', vintage: 2003, type: WineType.DESSERT,
      grapeVarieties: ['Riesling'],
      alcoholPct: 7.0, avgRating: 5.0, reviewCount: 89,
      tastingNotes: 'Liquid gold. Concentrated honey, dried apricot, saffron, ginger. Intense acidity and sweetness in perfect balance.',
      imageUrl: 'https://placehold.co/300x400/FFA500/333333?text=TBA+Riesling',
      wineryId: wEgon.id, regionId: mosel.id,
      foodPairings: { create: [{ food: 'Blue cheese' }, { food: 'Foie gras' }] },
      prices: { create: [{ retailer: 'Christie\'s Auction', price: 12000, currency: 'USD' }] },
    }}),

    // ── FORTIFIED ────────────────────────────────────────────
    prisma.wine.create({ data: {
      name: 'Taylor Fladgate Vintage Port', vintage: 2016, type: WineType.FORTIFIED,
      grapeVarieties: ['Touriga Nacional', 'Touriga Franca', 'Tinta Roriz'],
      alcoholPct: 20.0, avgRating: 4.7, reviewCount: 523,
      tastingNotes: 'Declared vintage Port. Dark cherry, blackberry, chocolate, spice. Structured and age-worthy for decades.',
      imageUrl: 'https://placehold.co/300x400/3B0A0A/FFFFFF?text=Taylor+Fladgate',
      wineryId: wTaylor.id, regionId: douro.id,
      foodPairings: { create: [{ food: 'Stilton cheese' }, { food: 'Dark chocolate' }, { food: 'Walnuts' }] },
      prices: { create: [{ retailer: 'Wine.com', price: 65, currency: 'USD' }] },
    }}),

    prisma.wine.create({ data: {
      name: 'González Byass Apostoles Palo Cortado', vintage: null, type: WineType.FORTIFIED,
      grapeVarieties: ['Palomino', 'Pedro Ximénez'],
      alcoholPct: 20.0, avgRating: 4.5, reviewCount: 234,
      tastingNotes: 'VORS 30+ year Sherry. Walnut, dried fruit, leather, coffee, roasted almonds. Incredibly complex.',
      imageUrl: 'https://placehold.co/300x400/8B4513/FFFFFF?text=Palo+Cortado',
      foodPairings: { create: [{ food: 'Jamón ibérico' }, { food: 'Aged Manchego' }, { food: 'Hazelnuts' }] },
      prices: { create: [{ retailer: 'Wine-Searcher', price: 55, currency: 'USD' }] },
    }}),
  ]);

  console.log(`✅ Created ${wines.length} wines`);
  console.log('🍷 Seed complete!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
