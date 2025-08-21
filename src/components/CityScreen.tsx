import { useState } from 'react';
import { useGameStore } from '../state/store';
import GoodItem from './GoodItem';
import type { GoodId } from '../lib/types';
import './GoodItem.css';
import './CityScreen.css';

const CityScreen = () => {
  const { world, player, doTick, setScreen, executeTrade } = useGameStore();
  const [giveItems, setGiveItems] = useState<Record<GoodId, number>>({} as Record<GoodId, number>);
  const [takeItems, setTakeItems] = useState<Record<GoodId, number>>({} as Record<GoodId, number>);

  const currentCity = world.cities.find(c => c.id === player.cityId);
  const currentCityState = world.cityStates[player.cityId];
  const prices = currentCityState ? Object.fromEntries(
    Object.entries(currentCityState.market).map(([good, price]) => [good, price])
  ) : {};

  const getCityImage = (cityId: string) => {
    return `./assets/cities/${cityId}.png`;
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

  const handleMarketItemClick = (goodId: GoodId) => {
    setTakeItems(prev => ({
      ...prev,
      [goodId]: (prev[goodId] || 0) + 1
    }));
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
      setGiveItems(prev => ({
        ...prev,
        [goodId]: (prev[goodId] || 0) + 1
      }));
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
    return goods.map(goodId => (
      <GoodItem
        key={goodId}
        goodId={goodId}
        count={0} // 0 означает "бесконечное количество"
        price={prices[goodId] || 2}
        isMarket={true}
        onClick={() => handleMarketItemClick(goodId)}
      />
    ));
  };

  const renderInventoryItems = () => {
    const available = getAvailableInventory();
    return Object.entries(available)
      .filter(([, count]) => count > 0)
      .map(([goodId, count]) => (
        <GoodItem
          key={goodId}
          goodId={goodId as GoodId}
          count={count}
          price={prices[goodId as GoodId] || 2}
          isMarket={false}
          onClick={() => handleInventoryItemClick(goodId as GoodId)}
        />
      ));
  };

  const renderTradeZone = (items: Record<GoodId, number>, title: string, onClickHandler: (goodId: GoodId) => void) => {
    const isTakeZone = title === 'Take';
    return (
      <div className="trade-zone">
        <h4 style={{
          margin: '0 0 8px 0',
          color: '#f8f9fa',
          textAlign: isTakeZone ? 'right' : 'left'
        }}>{title}</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {Object.entries(items).map(([goodId, count]) => (
            <GoodItem
              key={goodId}
              goodId={goodId as GoodId}
              count={count}
              price={prices[goodId as GoodId] || 2}
              isMarket={false}
              onClick={() => onClickHandler(goodId as GoodId)}
            />
          ))}
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
            <h1 className="city-name">{currentCity.name}</h1>
          </div>

          {/* Кнопки действий */}
          <div className="action-buttons">
            <button
              className="btn action-btn"
              onClick={() => setScreen('map')}
            >
              World Map
            </button>
          </div>

          {/* Market Items (Top Row) */}
          <div className="market-section">
            <h3>Market Items</h3>
            <div className="items-row">
              {renderMarketItems()}
            </div>
          </div>

          {/* Trade Zones */}
          <div className="trade-zones">
            {renderTradeZone(takeItems, 'Take', handleTakeItemClick)}
            {renderTradeZone(giveItems, 'Give', handleGiveItemClick)}
          </div>

          {/* Trade Summary */}
          <div className="trade-summary">
            <div className="trade-values">
              <span>Give: {giveValue}</span>
              <span>Take: {takeValue}</span>
              <span>Difference: {giveValue - takeValue}</span>
            </div>
            <button
              className="btn trade-btn"
              onClick={handleTrade}
              disabled={!isValidTrade || giveValue === 0}
            >
              Barter
            </button>
          </div>

          {/* Player Inventory (Bottom Row) */}
          <div className="inventory-section">
            <h3>Your Inventory</h3>
            <div className="items-row">
              {renderInventoryItems()}
            </div>
          </div>

          {/* HUD */}
          <div className="hud">
            <div className="hud-item">
              <button className="btn" onClick={doTick}>
                Make Market Tick (2 cities)
              </button>
              <span className="tick-info">Tick: {world.tick}</span>
            </div>
            <div className="hud-item">
              <button className="btn">
                Copy Game Link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CityScreen;
