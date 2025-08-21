import { useState } from 'react';
import { useGameStore } from '../state/store';
import GoodItem from './GoodItem';
import type { GoodId } from '../lib/types';
import { getAllPrices } from '../lib/values';
import { getCityImage } from '../utils/assets';
import './GoodItem.css';
import './CityScreen.css';

const CityScreen = () => {
  const { world, player, doTick, setScreen, executeTrade } = useGameStore();
  const [giveItems, setGiveItems] = useState<Record<GoodId, number>>({} as Record<GoodId, number>);
  const [takeItems, setTakeItems] = useState<Record<GoodId, number>>({} as Record<GoodId, number>);

  const currentCity = world.cities.find(c => c.id === player.cityId);
  const currentCityState = world.cityStates[player.cityId];
  const prices: Record<GoodId, 1 | 2 | 3> = currentCityState ? getAllPrices(currentCityState.market) : {
    water: 2,
    food: 2,
    fuel: 2,
    ammo: 2,
    scrap: 2,
    medicine: 2
  };



  // Вычисляем доступный инвентарь (исключая товары в Give Items)
  const getAvailableInventory = () => {
    const available: Partial<Record<GoodId, number>> = { ...player.inv };

    // Вычитаем товары, которые уже в Give Items
    Object.entries(giveItems).forEach(([goodId, count]) => {
      const good = goodId as GoodId;
      if (available[good]) {
        available[good] = (available[good] || 0) - count;
        if ((available[good] || 0) <= 0) {
          delete available[good];
        }
      }
    });

    return available;
  };

  const handleTrade = () => {
    if (executeTrade(giveItems, takeItems)) {
      setGiveItems({} as Record<GoodId, number>);
      setTakeItems({} as Record<GoodId, number>);
    }
  };

  const calculateValue = (items: Record<GoodId, number>) => {
    return Object.entries(items).reduce((total, [good, count]) => {
      return total + (count * (prices[good as GoodId] || 2));
    }, 0);
  };

  // Проверка лимитов торговли
  const tradeLimits = player.tradeLimits || { boughtItems: {}, soldItems: {}, lastCityId: player.cityId };

  const canBuyItem = (goodId: GoodId, count: number) => {
    const currentBought = tradeLimits.boughtItems?.[goodId] || 0;
    const inTakeItems = takeItems[goodId] || 0;
    return currentBought + inTakeItems + count <= 2;
  };

  const canSellItem = (goodId: GoodId, count: number) => {
    const currentSold = tradeLimits.soldItems?.[goodId] || 0;
    const inGiveItems = giveItems[goodId] || 0;
    return currentSold + inGiveItems + count <= 2;
  };

  const isItemBoughtLimitReached = (goodId: GoodId) => {
    const currentBought = tradeLimits.boughtItems?.[goodId] || 0;
    const inTakeItems = takeItems[goodId] || 0;
    return currentBought + inTakeItems >= 2;
  };

  const isItemSoldLimitReached = (goodId: GoodId) => {
    const currentSold = tradeLimits.soldItems?.[goodId] || 0;
    const inGiveItems = giveItems[goodId] || 0;
    return currentSold + inGiveItems >= 2;
  };

  const handleMarketItemClick = (goodId: GoodId) => {
    if (canBuyItem(goodId, 1)) {
      setTakeItems(prev => ({
        ...prev,
        [goodId]: (prev[goodId] || 0) + 1
      }));
    }
  };

  const handleTakeItemClick = (goodId: GoodId) => {
    setTakeItems(prev => {
      const newItems = { ...prev };
      if (newItems[goodId] === 1) {
        delete newItems[goodId];
      } else {
        newItems[goodId]--;
      }
      return newItems;
    });
  };

  const handleInventoryItemClick = (goodId: GoodId) => {
    const available = getAvailableInventory();
    if (available[goodId] && available[goodId] > 0) {
      if (canSellItem(goodId, 1)) {
        setGiveItems(prev => ({
          ...prev,
          [goodId]: (prev[goodId] || 0) + 1
        }));
      }
    }
  };

  const handleGiveItemClick = (goodId: GoodId) => {
    setGiveItems(prev => {
      const newItems = { ...prev };
      if (newItems[goodId] === 1) {
        delete newItems[goodId];
      } else {
        newItems[goodId]--;
      }
      return newItems;
    });
  };

  const renderMarketItems = () => {
    const goods: GoodId[] = ['water', 'food', 'fuel', 'ammo', 'scrap', 'medicine'];
    return goods.map(goodId => {
      const price = prices[goodId] || 2;
      const isCheap = price === 1;
      const isExpensive = price === 3;
      const isLimitReached = isItemBoughtLimitReached(goodId);

      return (
        <GoodItem
          key={goodId}
          goodId={goodId}
          count={0} // 0 означает "бесконечное количество"
          price={price}
          isMarket={true}
          isCheap={isCheap}
          isExpensive={isExpensive}
          isLimitReached={isLimitReached}
          onClick={isLimitReached ? undefined : () => handleMarketItemClick(goodId)}
        />
      );
    });
  };

  const renderInventoryItems = () => {
    const available = getAvailableInventory();
    return Object.entries(available)
      .filter(([, count]) => count > 0)
      .map(([goodId, count]) => {
        const goodIdTyped = goodId as GoodId;
        const isLimitReached = isItemSoldLimitReached(goodIdTyped);

        return (
          <GoodItem
            key={goodId}
            goodId={goodIdTyped}
            count={count}
            price={prices[goodIdTyped] || 2}
            isMarket={false}
            isCheap={false}
            isExpensive={false}
            isLimitReached={isLimitReached}
            onClick={isLimitReached ? undefined : () => handleInventoryItemClick(goodIdTyped)}
          />
        );
      });
  };

  const renderTradeZone = (items: Record<GoodId, number>, onClickHandler: (goodId: GoodId) => void) => {
    return (
      <div className="trade-zone">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {Object.entries(items).map(([goodId, count]) => {
            const price = prices[goodId as GoodId] || 2;
            const isCheap = price === 1;
            const isExpensive = price === 3;

            return (
              <GoodItem
                key={goodId}
                goodId={goodId as GoodId}
                count={count}
                price={price}
                isMarket={false}
                isCheap={isCheap}
                isExpensive={isExpensive}
                onClick={() => onClickHandler(goodId as GoodId)}
              />
            );
          })}
        </div>
      </div>
    );
  };

  if (!currentCity || !currentCityState) {
    return <div>Loading...</div>;
  }

  const giveValue = calculateValue(giveItems);
  const takeValue = calculateValue(takeItems);
  const isValidTrade = giveValue >= takeValue && Object.keys(giveItems).length > 0;

  // Проверяем наличие ресурсов для действий
  const hasWater = (player.inv['water'] || 0) > 0;
  const hasFood = (player.inv['food'] || 0) > 0;
  const hasResources = hasWater || hasFood;

  return (
    <div className="city-screen">
      {/* Фон города */}
      <div
        className="city-background"
        style={{
          backgroundImage: `url(${getCityImage(currentCity.id)})`
        }}
      >
        <div className="city-overlay">
          {/* Заголовок города */}
          <div className="city-header">
            <h1 className="city-name">{currentCity.name} (Day: {world.tick})</h1>
            <div className="header-buttons">
              <button
                className="btn action-btn"
                onClick={() => setScreen('map')}
              >
                Map
              </button>
              <button
                className={`btn action-btn ${!hasResources ? 'disabled' : ''}`}
                onClick={doTick}
                disabled={!hasResources}
              >
                Next Day (1 water or 1 food)
              </button>
              <button className="btn action-btn">
                Copy Game Link
              </button>
            </div>
          </div>

          {/* Market Goods (Top Row) */}
          <div className="market-section">
            <h3>Market Goods</h3>
            <div className="items-row">
              {renderMarketItems()}
            </div>
          </div>

          {/* Trade Zones */}
          <div className="trade-zones">
            <div className="trade-zone-container">
              <h3 className="trade-zone-title">Take: {calculateValue(takeItems)}</h3>
              {renderTradeZone(takeItems, handleTakeItemClick)}
            </div>
            <div className="trade-zone-container">
              <h3 className="trade-zone-title">Give: {calculateValue(giveItems)}</h3>
              {renderTradeZone(giveItems, handleGiveItemClick)}
            </div>
          </div>

          {/* Trade Summary */}
          <div className="trade-summary">
            <button
              className="btn trade-btn"
              onClick={handleTrade}
              disabled={!isValidTrade || giveValue === 0}
            >
              Barter
            </button>
          </div>

          {/* Player Goods (Bottom Row) */}
          <div className="inventory-section">
            <h3>Your Goods</h3>
            <div className="items-row">
              {renderInventoryItems()}
            </div>
          </div>


        </div>
      </div>
    </div>
  );
};

export default CityScreen;
