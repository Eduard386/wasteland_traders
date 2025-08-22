import { useState, useEffect } from 'react';
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
  const [opacity, setOpacity] = useState(0);

  useEffect(() => {
    // Fade in за 1 секунду
    const fadeInTimer = setTimeout(() => {
      setOpacity(1);
    }, 0);

    return () => {
      clearTimeout(fadeInTimer);
    };
  }, []);

  const currentCity = world.cities.find(c => c.id === player.cityId);
  const currentCityState = world.cityStates[player.cityId];
  const prices: Record<GoodId, 1 | 2 | 4> = currentCityState ? getAllPrices(currentCityState.market) : {
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
    return currentBought + inTakeItems + count <= 4;
  };

  const canSellItem = (goodId: GoodId, count: number) => {
    const currentSold = tradeLimits.soldItems?.[goodId] || 0;
    const inGiveItems = giveItems[goodId] || 0;
    return currentSold + inGiveItems + count <= 4;
  };

  const isItemBoughtLimitReached = (goodId: GoodId) => {
    const currentBought = tradeLimits.boughtItems?.[goodId] || 0;
    const inTakeItems = takeItems[goodId] || 0;
    return currentBought + inTakeItems >= 4;
  };

  const isItemSoldLimitReached = (goodId: GoodId) => {
    const currentSold = tradeLimits.soldItems?.[goodId] || 0;
    const inGiveItems = giveItems[goodId] || 0;
    return currentSold + inGiveItems >= 4;
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
      const isExpensive = price === 4;
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
        const price = prices[goodIdTyped] || 2;
        const isCheap = price === 1;
        const isExpensive = price === 4;
        const isLimitReached = isItemSoldLimitReached(goodIdTyped);

        return (
          <GoodItem
            key={goodId}
            goodId={goodIdTyped}
            count={count}
            price={price}
            isMarket={false}
            isCheap={isCheap}
            isExpensive={isExpensive}
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
            const isExpensive = price === 4;

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

  // Проверяем лимиты торговли
  const canExecuteTrade = () => {
    // Проверяем лимиты покупки - только для товаров в takeItems
    for (const [goodId, count] of Object.entries(takeItems)) {
      const currentBought = tradeLimits.boughtItems?.[goodId as GoodId] || 0;
      if (currentBought + count > 4) {
        return false;
      }
    }

    // Проверяем лимиты продажи - только для товаров в giveItems
    for (const [goodId, count] of Object.entries(giveItems)) {
      const currentSold = tradeLimits.soldItems?.[goodId as GoodId] || 0;
      if (currentSold + count > 4) {
        return false;
      }
    }

    return true;
  };

  const handleTrade = () => {
    if (canExecuteTrade() && executeTrade(giveItems, takeItems)) {
      setGiveItems({} as Record<GoodId, number>);
      setTakeItems({} as Record<GoodId, number>);
    }
  };

  const tradeLimitsOk = canExecuteTrade();
  const isValidTrade = giveValue >= takeValue && Object.keys(giveItems).length > 0 && tradeLimitsOk;

  return (
    <div 
      className="city-screen"
      style={{ opacity }}
    >
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
                onClick={() => {
                  setOpacity(0);
                  setTimeout(() => {
                    setScreen('map');
                  }, 1000);
                }}
              >
                Map
              </button>
              <button 
                className="btn action-btn" 
                onClick={() => {
                  setOpacity(0);
                  setTimeout(() => {
                    doTick();
                    setOpacity(1);
                  }, 1000);
                }}
              >
                Wait (1 water or 1 food)
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
              disabled={!isValidTrade}
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
