export type WineType = 'RED' | 'WHITE' | 'ROSE' | 'SPARKLING' | 'DESSERT' | 'FORTIFIED';
export type CollectionStatus = 'HAVE' | 'DRANK' | 'WISHLIST';

export interface Region {
  id: string;
  name: string;
  country: string;
  subregion?: string;
}

export interface Winery {
  id: string;
  name: string;
  country: string;
  region?: string;
}

export interface FoodPairing {
  id: string;
  food: string;
}

export interface WinePrice {
  id: string;
  retailer: string;
  price: number;
  currency: string;
  url?: string;
}

export interface Wine {
  id: string;
  name: string;
  vintage?: number;
  type: WineType;
  grapeVarieties: string[];
  alcoholPct?: number;
  tastingNotes?: string;
  imageUrl?: string;
  avgRating: number;
  reviewCount: number;
  winery?: Winery;
  region?: Region;
  foodPairings?: FoodPairing[];
  prices?: WinePrice[];
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;
  _count?: { reviews: number; followers: number; following: number };
}

export interface Review {
  id: string;
  rating: number;
  text?: string;
  imageUrl?: string;
  createdAt: string;
  user: Pick<User, 'id' | 'displayName' | 'avatarUrl'>;
  wine?: Wine;
  _count?: { likes: number };
}

export interface CollectionItem {
  id: string;
  status: CollectionStatus;
  quantity: number;
  addedAt: string;
  wine: Wine;
}

export interface WineList {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  user?: Pick<User, 'id' | 'displayName' | 'avatarUrl'>;
  items?: { wine: Wine; note?: string }[];
  _count?: { items: number };
}
