import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { World, Player, CityState, CityMarket, MarketMode, GoodId } from '../lib/types';
import { createWorldGraph } from '../lib/graph';
import { createRNG, type SeededRNG } from '../lib/random';
import { getAllPrices } from '../lib/values';

interface GameState {
  // Состояние
  world: World;
  player: Player;
  currentScreen: 'city' | 'barter' | 'travel' | 'map';
  
  // Экшены
  doTick: () => void;
  proposeTrade: (give: Record<GoodId, number>, take: Record<GoodId, number>) => boolean;
  executeTrade: (give: Record<GoodId, number>, take: Record<GoodId, number>) => boolean;
  travel: (toCityId: string, useGuard: boolean) => void;
  setScreen: (screen: 'city' | 'barter' | 'travel' | 'map') => void;
  initializeGame: (seed?: number) => void;
}

// Веса режимов рынков
const MARKET_WEIGHTS: Record<MarketMode, number> = {
  ALL2: 3,
  ONE_CHEAP: 2,
  ONE_EXP: 2,
  CHEAP_EXP: 1
};

// Генерация случайного режима рынка
function generateMarketMode(rng: SeededRNG): CityMarket {
  const modes: MarketMode[] = Object.keys(MARKET_WEIGHTS) as MarketMode[];
  const weights = modes.map(mode => MARKET_WEIGHTS[mode]);
  
  // Простой весовой выбор
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  let random = rng.next() * totalWeight;
  
  for (let i = 0; i < modes.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      const mode = modes[i];
      
      switch (mode) {
        case 'ALL2':
          return { mode };
        case 'ONE_CHEAP':
          return { 
            mode, 
            cheap: [rng.choice(['water', 'food', 'fuel', 'ammo', 'scrap', 'medicine'] as GoodId[])]
          };
        case 'ONE_EXP':
          return { 
            mode, 
            exp: [rng.choice(['water', 'food', 'fuel', 'ammo', 'scrap', 'medicine'] as GoodId[])]
          };
        case 'CHEAP_EXP': {
          const goods: GoodId[] = ['water', 'food', 'fuel', 'ammo', 'scrap', 'medicine'];
          const cheap = rng.choice(goods);
          const exp = rng.choice(goods.filter(g => g !== cheap));
          return { mode, cheap: [cheap], exp: [exp] };
        }
      }
    }
  }
  
  return { mode: 'ALL2' };
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      // Начальное состояние
      world: {
        seed: 0,
        tick: 0,
        cities: [],
        roads: [],
        cityStates: {}
      },
      player: {
        cityId: '',
        inv: {}
      },
      currentScreen: 'city',

      // Инициализация игры
      initializeGame: (seed?: number) => {
        const gameSeed = seed ?? Math.floor(Math.random() * 1000000);
        const { cities, roads } = createWorldGraph();
        
        // Создаем начальные рынки для всех городов
        const cityStates: Record<string, CityState> = {};
        const rng = createRNG(gameSeed, 0, 'init');
        
        cities.forEach(city => {
          cityStates[city.id] = {
            cityId: city.id,
            market: generateMarketMode(rng),
            updatedAtTick: 0
          };
        });

        // Начальный инвентарь - 2 случайных товара
        const goods: GoodId[] = ['water', 'food', 'fuel', 'ammo', 'scrap', 'medicine'];
        const initialInv: Partial<Record<GoodId, number>> = {};
        const invRng = createRNG(gameSeed, 0, 'inventory');
        
        for (let i = 0; i < 2; i++) {
          const good = invRng.choice(goods);
          initialInv[good] = (initialInv[good] || 0) + invRng.int(1, 4);
        }

        set({
          world: {
            seed: gameSeed,
            tick: 0,
            cities,
            roads,
            cityStates
          },
          player: {
            cityId: cities[0].id, // Начинаем с первого города
            inv: initialInv
          },
          currentScreen: 'city'
        });
        
        // console.log('Game initialized with cities:', cities.map(c => ({ id: c.id, name: c.name })));
      },

      // Тик рынков
      doTick: () => {
        const { world } = get();
        const rng = createRNG(world.seed, world.tick + 1, 'tick');
        
        // Выбираем 2 случайных города для обновления
        const cityIds = world.cities.map(c => c.id);
        const selectedCities: string[] = [];
        
        for (let i = 0; i < 2; i++) {
          const available = cityIds.filter(id => !selectedCities.includes(id));
          if (available.length > 0) {
            selectedCities.push(rng.choice(available));
          }
        }

        // Обновляем рынки выбранных городов
        const newCityStates = { ...world.cityStates };
        selectedCities.forEach(cityId => {
          newCityStates[cityId] = {
            cityId,
            market: generateMarketMode(rng),
            updatedAtTick: world.tick + 1
          };
        });

        set({
          world: {
            ...world,
            tick: world.tick + 1,
            cityStates: newCityStates
          }
        });
      },

      // Предложение сделки
      proposeTrade: (give: Record<GoodId, number>, take: Record<GoodId, number>) => {
        const { world, player } = get();
        const currentCity = world.cityStates[player.cityId];
        if (!currentCity) return false;

        const prices = getAllPrices(currentCity.market);
        
        // Проверяем лимит ≤3 единиц одного товара
        for (const [, count] of Object.entries(take)) {
          if (count > 3) return false;
        }

        // Считаем ценности
        let giveValue = 0;
        let takeValue = 0;

        for (const [good, count] of Object.entries(give)) {
          giveValue += count * prices[good as GoodId];
        }

        for (const [good, count] of Object.entries(take)) {
          takeValue += count * prices[good as GoodId];
        }

        // Проверяем, что отдаем достаточно
        if (takeValue > giveValue) return false;

        // Проверяем, что у нас есть товары для отдачи
        for (const [good, count] of Object.entries(give)) {
          if ((player.inv[good as GoodId] || 0) < count) return false;
        }

        return true;
      },

      // Выполнение сделки
      executeTrade: (give: Record<GoodId, number>, take: Record<GoodId, number>) => {
        const { player } = get();
        
        if (!get().proposeTrade(give, take)) return false;

        // Обновляем инвентарь игрока
        const newInv = { ...player.inv };
        
        // Убираем отданные товары
        for (const [good, count] of Object.entries(give)) {
          newInv[good as GoodId] = (newInv[good as GoodId] || 0) - count;
          if ((newInv[good as GoodId] || 0) <= 0) {
            delete newInv[good as GoodId];
          }
        }
        
        // Добавляем полученные товары
        for (const [good, count] of Object.entries(take)) {
          newInv[good as GoodId] = (newInv[good as GoodId] || 0) + count;
        }

        set({
          player: {
            ...player,
            inv: newInv
          }
        });

        return true;
      },

      // Путешествие
      travel: (toCityId: string) => {
        const { world, player } = get();
        const road = world.roads.find(r => 
          (r.from === player.cityId && r.to === toCityId) ||
          (r.from === toCityId && r.to === player.cityId)
        );

        if (!road) return;

        // TODO: Реализовать логику засады и охраны
        // Пока просто перемещаемся
        set({
          player: {
            ...player,
            cityId: toCityId
          },
          currentScreen: 'city'
        });
      },

      // Смена экрана
      setScreen: (screen: 'city' | 'barter' | 'travel' | 'map') => {
        set({ currentScreen: screen });
      }
    }),
    {
      name: 'wasteland-traders-save',
      partialize: (state) => ({
        world: state.world,
        player: state.player
      })
    }
  )
);
