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
  currentScreen: 'city' | 'map' | 'guards';
  selectedCityId: string | null;

  // Экшены
  canSpendResource: () => boolean;
  spendResource: () => Partial<Record<GoodId, number>> | false;
  isBankrupt: () => boolean;
  doTick: () => boolean;
  proposeTrade: (give: Record<GoodId, number>, take: Record<GoodId, number>) => boolean;
  executeTrade: (give: Record<GoodId, number>, take: Record<GoodId, number>) => boolean;
  travel: (toCityId: string) => boolean;
  travelWithGuards: (toCityId: string, paymentItems: Partial<Record<GoodId, number>>) => boolean;
  setScreen: (screen: 'city' | 'map' | 'guards') => void;
  setSelectedCity: (cityId: string | null) => void;
  initializeGame: (seed?: number) => void;
}

// Веса режимов рынков (равные вероятности)
const MARKET_WEIGHTS: Record<MarketMode, number> = {
  ALL2: 0, // Убираем режим без изменений цен
  ONE_CHEAP: 1,
  TWO_CHEAP: 1,
  ONE_EXP: 1,
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
        case 'TWO_CHEAP': {
          const goods: GoodId[] = ['water', 'food', 'fuel', 'ammo', 'scrap', 'medicine'];
          const cheap1 = rng.choice(goods);
          const cheap2 = rng.choice(goods.filter(g => g !== cheap1));
          return { mode, cheap: [cheap1, cheap2] };
        }
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
      selectedCityId: null,

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
        const { player, world } = get();
        const inv = player.inv;

        // Проверяем, есть ли хоть что-то в инвентаре
        if (Object.keys(inv).length === 0 || Object.values(inv).every(count => count <= 0)) {
          return true;
        }

        // Получаем текущий город и его цены
        const currentCity = world.cityStates[player.cityId];
        if (!currentCity) return false;

        const prices = getAllPrices(currentCity.market);
        const waterPrice = prices['water'];
        const foodPrice = prices['food'];

        // Проверяем новые условия банкротства
        const inventoryItems = Object.entries(inv).filter(([, count]) => count > 0);

        // Если у игрока остался только 1 товар
        if (inventoryItems.length === 1) {
          const [goodId, count] = inventoryItems[0];

          // Если это не еда и не вода, и у игрока только 1 единица
          if (goodId !== 'water' && goodId !== 'food' && count === 1) {
            const itemPrice = prices[goodId as GoodId];

            // Если товар дешевый (стоимость 1) и еда/вода стоят больше 1
            if (itemPrice === 1 && waterPrice > 1 && foodPrice > 1) {
              return true; // Банкротство
            }
          }
        }

        return false;
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

        // Проверяем лимит ≤4 единиц одного товара
        for (const [, count] of Object.entries(take)) {
          if (count > 4) {
            return false;
          }
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
          if (currentBought + count > 4) return false; // Limit 4 per item
          boughtItems[goodId] = currentBought + count;
        }

        // Check and update sell limits
        for (const [good, count] of Object.entries(give)) {
          const goodId = good as GoodId;
          const currentSold = soldItems[goodId] || 0;
          if (currentSold + count > 4) return false; // Limit 4 per item
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

      // Путешествие с охраной
      travelWithGuards: (toCityId: string, paymentItems: Partial<Record<GoodId, number>>) => {
        const { world, player } = get();
        const road = world.roads.find(r =>
          (r.from === player.cityId && r.to === toCityId) ||
          (r.from === toCityId && r.to === player.cityId)
        );

        if (!road) return false;

        // Убираем товары для оплаты из инвентаря
        // eslint-disable-next-line prefer-const
        let newInv = { ...player.inv };
        for (const [goodId, count] of Object.entries(paymentItems)) {
          newInv[goodId as GoodId] = (newInv[goodId as GoodId] || 0) - count;
          if ((newInv[goodId as GoodId] || 0) <= 0) {
            delete newInv[goodId as GoodId];
          }
        }

        // Потребление ресурсов за тик (как при обычном путешествии)
        const hasWater = (newInv['water'] || 0) > 0;
        const hasFood = (newInv['food'] || 0) > 0;

        if (hasWater && hasFood) {
          // Если есть и вода и еда, случайно потребляем одну
          const rng = createRNG(world.seed, world.tick, 'resource');
          if (rng.bool(0.5)) {
            newInv['water'] = (newInv['water'] || 0) - 1;
            if ((newInv['water'] || 0) <= 0) delete newInv['water'];
          } else {
            newInv['food'] = (newInv['food'] || 0) - 1;
            if ((newInv['food'] || 0) <= 0) delete newInv['food'];
          }
        } else if (hasWater) {
          // Если есть только вода, потребляем воду
          newInv['water'] = (newInv['water'] || 0) - 1;
          if ((newInv['water'] || 0) <= 0) delete newInv['water'];
        } else if (hasFood) {
          // Если есть только еда, потребляем еду
          newInv['food'] = (newInv['food'] || 0) - 1;
          if ((newInv['food'] || 0) <= 0) delete newInv['food'];
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
      setScreen: (screen: 'city' | 'map' | 'guards') => {
        set({ currentScreen: screen });
      },

      // Установка выбранного города
      setSelectedCity: (cityId: string | null) => {
        set({ selectedCityId: cityId });
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
