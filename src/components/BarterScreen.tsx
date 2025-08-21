import { useState } from 'react';
import { DndContext, DragOverlay, useDroppable } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useGameStore } from '../state/store';
import GoodItem from './GoodItem';
import type { GoodId } from '../lib/types';
import './GoodItem.css';
import './BarterScreen.css';

const BarterScreen = () => {
  const { 
    world, 
    player, 
    setScreen, 
    executeTrade 
  } = useGameStore();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [giveItems, setGiveItems] = useState<Record<GoodId, number>>({} as Record<GoodId, number>);
  const [takeItems, setTakeItems] = useState<Record<GoodId, number>>({} as Record<GoodId, number>);

  const currentCity = world.cityStates[player.cityId];
  const prices = currentCity ? Object.fromEntries(
    Object.entries(currentCity.market).map(([good, price]) => [good, price])
  ) : {};

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.data.current) {
      const { goodId, isMarket } = active.data.current;
      const targetId = over.id as string;
      
      // Проверяем логику: только инвентарь в give-zone, только рынок в take-zone
      if (targetId === 'give-zone' && !isMarket) {
        // Добавляем в отдаваемые товары (только из инвентаря)
        setGiveItems(prev => ({
          ...prev,
          [goodId]: (prev[goodId as GoodId] || 0) + 1
        }));
      } else if (targetId === 'take-zone' && isMarket) {
        // Добавляем в получаемые товары (только с рынка)
        setTakeItems(prev => ({
          ...prev,
          [goodId]: (prev[goodId as GoodId] || 0) + 1
        }));
      }
      // Игнорируем все остальные комбинации
    }
    
    setActiveId(null);
  };

  const handleTrade = () => {
    if (executeTrade(giveItems, takeItems)) {
      console.log('Trade successful!', { giveItems, takeItems });
      setGiveItems({} as Record<GoodId, number>);
      setTakeItems({} as Record<GoodId, number>);
    } else {
      alert('Invalid trade! Check the rules.');
    }
  };

  const calculateValue = (items: Record<GoodId, number>) => {
    return Object.entries(items).reduce((total, [good, count]) => {
      return total + (count * (prices[good as GoodId] || 2));
    }, 0);
  };

  const giveValue = calculateValue(giveItems);
  const takeValue = calculateValue(takeItems);
  const isValidTrade = giveValue >= takeValue && Object.values(takeItems).every(count => count <= 3);

  const renderMarketItems = () => {
    const goods: GoodId[] = ['water', 'food', 'fuel', 'ammo', 'scrap', 'medicine'];
    return goods.map(goodId => (
      <GoodItem
        key={goodId}
        goodId={goodId}
        count={1}
        price={prices[goodId] || 2}
        isMarket={true}
      />
    ));
  };

  const renderInventoryItems = () => {
    return Object.entries(player.inv)
      .filter(([, count]) => count > 0)
      .map(([goodId, count]) => (
        <GoodItem
          key={goodId}
          goodId={goodId as GoodId}
          count={count}
          price={prices[goodId as GoodId] || 2}
          isMarket={false}
        />
      ));
  };

  const TradeZone = ({ zoneId, items, title }: { zoneId: string, items: Record<GoodId, number>, title: string }) => {
    const { setNodeRef, isOver } = useDroppable({
      id: zoneId,
    });

    return (
      <div
        ref={setNodeRef}
        className="trade-zone"
        style={{
          minHeight: '120px',
          border: '2px dashed #868e96',
          borderRadius: '8px',
          padding: '8px',
          margin: '8px',
          background: isOver ? 'rgba(255, 212, 59, 0.2)' : 'rgba(255, 255, 255, 0.05)',
          borderColor: isOver ? '#ffd43b' : '#868e96'
        }}
      >
        <h4 style={{ margin: '0 0 8px 0', color: '#f8f9fa' }}>{title}</h4>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {Object.entries(items).map(([goodId, count]) => (
            <div key={goodId} className="trade-item">
              <span>{goodId}: {count}</span>
              <button
                onClick={() => {
                  if (zoneId === 'give-zone') {
                    setGiveItems(prev => {
                      const newItems = { ...prev };
                      if (newItems[goodId as GoodId] === 1) {
                        delete newItems[goodId as GoodId];
                      } else {
                        newItems[goodId as GoodId]--;
                      }
                      return newItems;
                    });
                  } else {
                    setTakeItems(prev => {
                      const newItems = { ...prev };
                      if (newItems[goodId as GoodId] === 1) {
                        delete newItems[goodId as GoodId];
                      } else {
                        newItems[goodId as GoodId]--;
                      }
                      return newItems;
                    });
                  }
                }}
                style={{ marginLeft: '4px', fontSize: '10px' }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="barter-screen">
        <div 
          className="barter-background"
          style={{
            backgroundImage: 'url(./assets/barter/barter.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            minHeight: '100vh',
            width: '100%',
            padding: '20px',
            boxSizing: 'border-box'
          }}
        >
          <div className="barter-content">
            <div className="barter-header">
              <h2 className="title">Barter</h2>
              <button className="btn" onClick={() => setScreen('city')}>
                Return to City
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
              <TradeZone zoneId="give-zone" items={giveItems} title="Give Items" />
              <TradeZone zoneId="take-zone" items={takeItems} title="Take Items" />
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
                Trade
              </button>
            </div>

            {/* Player Inventory (Bottom Row) */}
            <div className="inventory-section">
              <h3>Your Inventory</h3>
              <div className="items-row">
                {renderInventoryItems()}
              </div>
            </div>
          </div>
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="drag-overlay">
              <span>Dragging...</span>
            </div>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  );
};

export default BarterScreen;
