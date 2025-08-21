import type { GoodId, CityMarket, Inventory } from './types';

// Расчет цены товара в городе
export function priceOf(g: GoodId, market: CityMarket): 1 | 2 | 3 {
  if (market.cheap?.includes(g)) return 1;
  if (market.exp?.includes(g)) return 3;
  return 2;
}

// Расчет ценности инвентаря по ценам города
export function inventoryValue(inv: Inventory, market: CityMarket): number {
  let v = 0;
  for (const [k, n] of Object.entries(inv) as [GoodId, number][]) {
    v += (n ?? 0) * priceOf(k, market);
  }
  return v;
}

// Расчет стоимости охраны
export function guardCost(routeValue: number, length: number, risk: number, k = 0.9): number {
  return Math.ceil(routeValue * risk * (0.25 + 0.15 * length) * k);
}

// Получение всех цен товаров в городе
export function getAllPrices(market: CityMarket): Record<GoodId, 1 | 2 | 3> {
  const prices: Record<GoodId, 1 | 2 | 3> = {
    water: 2,
    food: 2,
    fuel: 2,
    ammo: 2,
    scrap: 2,
    medicine: 2
  };

  // Применяем дешевые товары
  if (market.cheap) {
    for (const good of market.cheap) {
      prices[good] = 1;
    }
  }

  // Применяем дорогие товары
  if (market.exp) {
    for (const good of market.exp) {
      prices[good] = 3;
    }
  }

  return prices;
}
