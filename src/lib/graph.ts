import type { City, Road } from './types';

// Названия городов в стиле Fallout 2
export const CITY_NAMES = [
  "rust_town",
  "metal_hill",
  "dusty_oasis",
  "bottle_cap_canyon"
];

// Создание графа городов в форме квадрата 2x2
export function createWorldGraph(): { cities: City[], roads: Road[] } {
  const cities: City[] = [
    {
      id: "rust_town",
      name: "Rust Town",
      neighbors: ["metal_hill", "dusty_oasis"],
      x: 0, y: 0
    },
    {
      id: "metal_hill",
      name: "Metal Hill",
      neighbors: ["rust_town", "bottle_cap_canyon"],
      x: 1, y: 0
    },
    {
      id: "dusty_oasis",
      name: "Dusty Oasis",
      neighbors: ["rust_town", "bottle_cap_canyon"],
      x: 0, y: 1
    },
    {
      id: "bottle_cap_canyon",
      name: "Bottle Cap Canyon",
      neighbors: ["metal_hill", "dusty_oasis"],
      x: 1, y: 1
    }
  ];

  const roads: Road[] = [
    // Горизонтальные связи
    { from: "rust_town", to: "metal_hill", length: 1, risk: 0.3 },
    { from: "dusty_oasis", to: "bottle_cap_canyon", length: 1, risk: 0.4 },
    // Вертикальные связи  
    { from: "rust_town", to: "dusty_oasis", length: 1, risk: 0.3 },
    { from: "metal_hill", to: "bottle_cap_canyon", length: 1, risk: 0.3 }
  ];

  return { cities, roads };
}

// Получение соседей города
export function getNeighbors(cityId: string, cities: City[]): City[] {
  const city = cities.find(c => c.id === cityId);
  if (!city) return [];

  return cities.filter(c => city.neighbors.includes(c.id));
}

// Получение дороги между двумя городами
export function getRoad(from: string, to: string, roads: Road[]): Road | undefined {
  return roads.find(r =>
    (r.from === from && r.to === to) ||
    (r.from === to && r.to === from)
  );
}
