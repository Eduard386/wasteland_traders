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
  currentScreen: 'city' | 'map';

  // Экшены
  canSpendResource: () => boolean;
  spendResource: () => Partial<Record<GoodId, number>> | false;
  isBankrupt: () => boolean;
  doTick: () => boolean;
  proposeTrade: (give: Record<GoodId, number>, take: Record<GoodId, number>) => boolean;
  executeTrade: (give: Record<GoodId, number>, take: Record<GoodId, number>) => boolean;
  travel: (toCityId: string) => boolean;
  setScreen: (screen: 'city' | 'map') => void;
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

        // Начальный инвентарь - 1 вода, 1 еда, и 2 случайных товара
        const initialInv: Partial<Record<GoodId, number>> = {};
        const invRng = createRNG(gameSeed, 0, 'inventory');

        // Гарантированно добавляем 1 воду и 1 еду
        initialInv['water'] = 1;
        initialInv['food'] = 1;

        // Добавляем 2 случайных товара (исключая воду и еду)
        const remainingGoods: GoodId[] = ['fuel', 'ammo', 'scrap', 'medicine'];
        for (let i = 0; i < 2; i++) {
          const good = invRng.choice(remainingGoods);
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
            inv: initialInv,
            tradeLimits: {
              boughtItems: {},
              soldItems: {},
              lastCityId: cities[0].id
            }
          },
          currentScreen: 'city'
        });

        // console.log('Game initialized with cities:', cities.map(c => ({ id: c.id, name: c.name })));
      },

      // Функция для проверки наличия ресурсов
      canSpendResource: () => {
        const { player } = get();
        const waterCount = player.inv['water'] || 0;
        const foodCount = player.inv['food'] || 0;
        return waterCount > 0 || foodCount > 0;
      },

      // Функция для проверки банкротства
      isBankrupt: () => {
        const { player } = get();
        const inv = player.inv;
        // Проверяем, есть ли хоть что-то в инвентаре
        return Object.keys(inv).length === 0 || Object.values(inv).every(count => count <= 0);
      },

      // Функция для траты ресурсов (вода или еда)
      spendResource: () => {
        const { player, world } = get();
        const newInv = { ...player.inv };
        const waterCount = newInv['water'] || 0;
        const foodCount = newInv['food'] || 0;

        if (waterCount > 0 && foodCount > 0) {
          // Если есть и вода и еда - тратим случайную
          const rng = createRNG(world.seed, world.tick, 'resource');
          if (rng.next() < 0.5) {
            newInv['water'] = waterCount - 1;
            if (newInv['water'] <= 0) delete newInv['water'];
          } else {
            newInv['food'] = foodCount - 1;
            if (newInv['food'] <= 0) delete newInv['food'];
          }
        } else if (waterCount > 0) {
          // Если есть только вода - тратим воду
          newInv['water'] = waterCount - 1;
          if (newInv['water'] <= 0) delete newInv['water'];
        } else if (foodCount > 0) {
          // Если есть только еда - тратим еду
          newInv['food'] = foodCount - 1;
          if (newInv['food'] <= 0) delete newInv['food'];
        } else {
          // Если нет ни воды ни еды - возвращаем false
          return false;
        }

        return newInv;
      },

      // Тик рынков
      doTick: () => {
        const { world, player } = get();

        // Проверяем и тратим ресурсы
        const newInv = get().spendResource();
        if (newInv === false) {
          return false; // Не можем сделать тик без ресурсов
        }

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
          },
          player: {
            ...player,
            inv: newInv,
            tradeLimits: {
              boughtItems: {},
              soldItems: {},
              lastCityId: player.cityId
            }
          }
        });

        return true;
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
        const { world, player } = get();

        if (!get().proposeTrade(give, take)) return false;

        const currentCity = world.cityStates[player.cityId];
        if (!currentCity) return false;

        // Backward compatibility for tradeLimits
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tradeLimits = (player as any).tradeLimits || { boughtItems: {}, soldItems: {}, lastCityId: player.cityId };
        const boughtItems = { ...tradeLimits.boughtItems };
        const soldItems = { ...tradeLimits.soldItems };

        // Check and update buy limits
        for (const [good, count] of Object.entries(take)) {
          const goodId = good as GoodId;
          const currentBought = boughtItems[goodId] || 0;
          if (currentBought + count > 2) return false; // Limit 2 per item
          boughtItems[goodId] = currentBought + count;
        }

        // Check and update sell limits
        for (const [good, count] of Object.entries(give)) {
          const goodId = good as GoodId;
          const currentSold = soldItems[goodId] || 0;
          if (currentSold + count > 2) return false; // Limit 2 per item
          soldItems[goodId] = currentSold + count;
        }

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
            inv: newInv,
            tradeLimits: {
              boughtItems,
              soldItems,
              lastCityId: player.cityId
            }
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

        if (!road) return false;

        // Проверяем и тратим ресурсы
        const newInv = get().spendResource();
        if (newInv === false) {
          return false; // Не можем путешествовать без ресурсов
        }

        // Automatic tick on travel
        const rng = createRNG(world.seed, world.tick + 1, 'tick');

        const cityIds = world.cities.map(c => c.id);
        const selectedCities: string[] = [];

        for (let i = 0; i < 2; i++) {
          const available = cityIds.filter(id => !selectedCities.includes(id));
          if (available.length > 0) {
            selectedCities.push(rng.choice(available));
          }
        }

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
          },
          player: {
            ...player,
            inv: newInv,
            cityId: toCityId,
            tradeLimits: {
              boughtItems: {},
              soldItems: {},
              lastCityId: toCityId
            }
          },
          currentScreen: 'city'
        });

        return true;
      },

      // Смена экрана
      setScreen: (screen: 'city' | 'map') => {
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
