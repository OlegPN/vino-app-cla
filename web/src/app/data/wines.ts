export type WineType = 'red' | 'white' | 'rose' | 'sparkling';

export interface Wine {
  id: string;
  name: string;
  winery: string;
  year: number;
  type: WineType;
  rating: number;
  ratingsCount: number;
  price: number;
  region: string;
  country: string;
  grapes: string[];
  description: string;
  image: string;
  flavors: string[];
  alcohol: number;
  inCollection?: boolean;
  wishlist?: boolean;
}

export interface Winery {
  id: string;
  name: string;
  region: string;
  country: string;
  winesCount: number;
  rating: number;
  ratingsCount: number;
  image: string;
  logo: string;
  verified: boolean;
  flag: string;
}

export const wines: Wine[] = [
  {
    id: '1',
    name: 'Каберне Совиньон Резерв',
    winery: 'Лефкадия',
    year: 2019,
    type: 'red',
    rating: 4.6,
    ratingsCount: 3840,
    price: 1900,
    region: 'Кубань',
    country: 'Россия',
    grapes: ['Каберне Совиньон', 'Мерло'],
    description: 'Флагманское красное вино хозяйства с насыщенным вкусом тёмных ягод, кедра и специй. Длительная выдержка в дубовых бочках придаёт вину элегантность и глубину.',
    image: '/images/wine-cape-five-cab-sauv.png',
    flavors: ['Чёрная смородина', 'Слива', 'Кедр', 'Ваниль', 'Специи'],
    alcohol: 13.5,
    inCollection: false,
    wishlist: true,
  },
  {
    id: '2',
    name: 'Viognier Reserve',
    winery: 'Gaï-Kodzor',
    year: 2020,
    type: 'white',
    rating: 4.2,
    ratingsCount: 291,
    price: 1000,
    region: 'Кубань',
    country: 'Россия',
    grapes: ['Вионье'],
    description: 'Элегантное белое вино с ароматами белых цветов, персика и абрикоса. Нежная кислотность и долгое послевкусие.',
    image: '/images/wine-white-gai-nobg.png',
    flavors: ['Персик', 'Абрикос', 'Белые цветы', 'Мёд'],
    alcohol: 13.0,
    inCollection: true,
    wishlist: false,
  },
  {
    id: '3',
    name: 'Саперави',
    winery: 'Ведерниковъ',
    year: 2020,
    type: 'red',
    rating: 4.4,
    ratingsCount: 1820,
    price: 1200,
    region: 'Дон',
    country: 'Россия',
    grapes: ['Саперави'],
    description: 'Мощное красное вино из донского автохтонного сорта. Тёмный гранатовый цвет, ароматы ежевики, чернослива и пряных трав с долгим терпким послевкусием.',
    image: '/images/wine-vedernikov-saperavi-nobg.png',
    flavors: ['Ежевика', 'Чернослив', 'Пряные травы', 'Тёмный шоколад'],
    alcohol: 14.0,
    inCollection: false,
    wishlist: true,
  },
  {
    id: '4',
    name: 'Rose de Noirs Brut',
    winery: 'Fanagoria',
    year: 2022,
    type: 'sparkling',
    rating: 4.3,
    ratingsCount: 2150,
    price: 1490,
    region: 'Тамань',
    country: 'Россия',
    grapes: ['Пино Нуар'],
    description: 'Игристое розовое вино метода Шарма из сорта Пино Нуар. Деликатные пузырьки, ароматы красных ягод, свежей клубники и розовых лепестков. Брют с освежающей кислотностью.',
    image: '/images/wine-fanagoria-rose-de-noirs-nobg.png',
    flavors: ['Клубника', 'Малина', 'Розовые лепестки', 'Цитрус'],
    alcohol: 12.0,
    inCollection: false,
    wishlist: false,
  },
  {
    id: '5',
    name: 'Brut Prestige',
    winery: 'Abrau-Durso',
    year: 2021,
    type: 'sparkling',
    rating: 4.1,
    ratingsCount: 1240,
    price: 750,
    region: 'Краснодарский край',
    country: 'Россия',
    grapes: ['Пино Нуар', 'Шардоне'],
    description: 'Изысканное игристое вино классического метода с тонкими пузырьками и ароматами зелёного яблока, цитруса и тоста.',
    image: '/images/wine-abrau-brut-prestige-nobg.png',
    flavors: ['Зелёное яблоко', 'Лимон', 'Тост', 'Бриошь'],
    alcohol: 12.0,
    inCollection: true,
    wishlist: false,
  },
  {
    id: '6',
    name: 'Мерло Резерв',
    winery: 'Golubitskoe Estate',
    year: 2018,
    type: 'red',
    rating: 3.8,
    ratingsCount: 530,
    price: 880,
    region: 'Кубань',
    country: 'Россия',
    grapes: ['Мерло'],
    description: 'Насыщенное красное вино с ароматами спелой вишни, сливы и ягод. Мягкие танины и приятная кислотность делают его отличным выбором к мясным блюдам.',
    image: '/images/wine-chateau-de-talu-merlot-nobg.png',
    flavors: ['Вишня', 'Слива', 'Шоколад', 'Специи'],
    alcohol: 14.0,
    inCollection: false,
    wishlist: false,
  },
  {
    id: '7',
    name: 'Шардоне Резерв',
    winery: 'Усадьба Петровских',
    year: 2021,
    type: 'white',
    rating: 3.9,
    ratingsCount: 890,
    price: 1050,
    region: 'Крым',
    country: 'Россия',
    grapes: ['Шардоне'],
    description: 'Выдержанное белое вино с нотками ванили, масла и тропических фруктов. Кремовая текстура с долгим послевкусием.',
    image: '/images/wine-usadba-perovskih-chardonnay.png',
    flavors: ['Ананас', 'Манго', 'Ваниль', 'Масло'],
    alcohol: 13.5,
    inCollection: true,
    wishlist: false,
  },
  {
    id: '8',
    name: 'Каберне Совиньон Резерв',
    winery: 'Château de Talu',
    year: 2020,
    type: 'red',
    rating: 4.5,
    ratingsCount: 1340,
    price: 2200,
    region: 'Геленджик',
    country: 'Россия',
    grapes: ['Каберне Совиньон'],
    description: 'Резервное красное вино из Геленджика с насыщенным цветом и ароматами тёмной смородины, сливы, кедра и табака. Выдержка в дубовых бочках придаёт структуру и долгое послевкусие.',
    image: '/images/wine-chateau-de-talu-cab-sauv-nobg.png',
    flavors: ['Чёрная смородина', 'Слива', 'Кедр', 'Табак', 'Ваниль'],
    alcohol: 13.5,
    inCollection: false,
    wishlist: false,
  },
];

export const wineries: Winery[] = [
  {
    id: '1',
    name: 'Фанагория',
    region: 'Тамань',
    country: 'Россия',
    winesCount: 63,
    rating: 4.1,
    ratingsCount: 24680,
    image: '/images/winery-placeholder.svg',
    logo: 'ФН',
    verified: true,
    flag: '🇷🇺',
  },
  {
    id: '2',
    name: 'Абрау-Дюрсо',
    region: 'Краснодарский край',
    country: 'Россия',
    winesCount: 48,
    rating: 4.2,
    ratingsCount: 18740,
    image: '/images/winery-placeholder.svg',
    logo: 'АД',
    verified: true,
    flag: '🇷🇺',
  },
  {
    id: '3',
    name: 'Лефкадия',
    region: 'Кубань',
    country: 'Россия',
    winesCount: 32,
    rating: 4.5,
    ratingsCount: 9820,
    image: '/images/winery-placeholder.svg',
    logo: 'ЛФ',
    verified: true,
    flag: '🇷🇺',
  },
  {
    id: '4',
    name: 'Ведерниковъ',
    region: 'Дон',
    country: 'Россия',
    winesCount: 28,
    rating: 4.3,
    ratingsCount: 7450,
    image: '/images/winery-placeholder.svg',
    logo: 'ВД',
    verified: true,
    flag: '🇷🇺',
  },
];

export const formatPrice = (price: number) =>
  price.toLocaleString('ru-RU', { minimumFractionDigits: 2 }) + ' ₽';

export const wineTypeLabel: Record<WineType, string> = {
  red: 'Красное',
  white: 'Белое',
  rose: 'Розовое',
  sparkling: 'Игристое',
};

export const wineTypeColor: Record<WineType, string> = {
  red: '#A52842',
  white: '#C9A84C',
  rose: '#E8748A',
  sparkling: '#7B9EA6',
};