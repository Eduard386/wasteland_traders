// 6 товаров
export type GoodId = "water" | "food" | "fuel" | "ammo" | "scrap" | "medicine";

export const GOODS: Record<GoodId, string> = {
  water: "Water",
  food: "Food",
  fuel: "Fuel",
  ammo: "Ammo",
  scrap: "Scrap",
  medicine: "Medicine",
};

// Рынки (режимы города)
export type MarketMode = "ALL2" | "ONE_CHEAP" | "ONE_EXP" | "CHEAP_EXP";

export interface CityMarket {
  mode: MarketMode;
  cheap?: GoodId[]; // значения 1
  exp?: GoodId[];   // значения 3
}

// Город и дорога
export interface City {
  id: string;
  name: string;
  neighbors: string[]; // id соседей (2–3)
  x: number; y: number; // для мини-карты
}

export interface Road {
  from: string; to: string;
  length: 1 | 2 | 3 | 4 | 5;
  risk: number; // 0.2..0.7
}

// Состояние города (рынок)
export interface CityState {
  cityId: string;
  market: CityMarket;
  updatedAtTick: number;
}

// Инвентарь (локальный, без сервера)
export type Inventory = Partial<Record<GoodId, number>>;

// Игрок
export interface Player {
  cityId: string;
  inv: Inventory;
  tradeLimits?: {
    boughtItems: Partial<Record<GoodId, number>>;  // how many of each item bought in current city
    soldItems: Partial<Record<GoodId, number>>;    // how many of each item sold in current city
    lastCityId: string;                             // last city where trade occurred
  };
}

// Мир демо
export interface World {
  seed: number;
  tick: number;           // номер тика рынков
  cities: City[];
  roads: Road[];          // не обязателен для MVP логики, но нужен для UI
  cityStates: Record<string, CityState>;
}
