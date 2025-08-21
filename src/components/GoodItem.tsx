import React from 'react';
import type { GoodId } from '../lib/types';
import './GoodItem.css';

interface GoodItemProps {
  goodId: GoodId;
  count: number;
  price: number;
  isMarket?: boolean;
  onClick?: () => void;
}

const GoodItem: React.FC<GoodItemProps> = ({
  goodId,
  count,
  price,
  isMarket = false,
  onClick
}) => {
  const getGoodImage = (goodId: GoodId) => {
    return `./assets/goods/${goodId}.png`;
  };

  const getGoodName = (goodId: GoodId) => {
    const names: Record<GoodId, string> = {
      water: 'Water',
      food: 'Food',
      fuel: 'Fuel',
      ammo: 'Ammo',
      scrap: 'Scrap',
      medicine: 'Medicine'
    };
    return names[goodId];
  };

  const isCheap = price === 1;
  const isExpensive = price === 3;
  const priceArrow = isCheap ? '⬇️' : isExpensive ? '⬆️' : '';

  return (
    <div 
      className={`good-item ${isCheap ? 'cheap' : ''} ${isExpensive ? 'exp' : ''} ${isMarket ? 'market' : 'inventory'}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <img 
        src={getGoodImage(goodId)} 
        alt={getGoodName(goodId)}
        className="good-image"
        onError={(e) => {
          console.error(`Failed to load image for ${goodId}`);
          e.currentTarget.style.display = 'none';
        }}
      />
      <div className="good-info">
        <div className="good-name">{getGoodName(goodId)}</div>
        {count > 0 && <div className="good-count">{count}</div>}
        {priceArrow && (
          <div className="price-indicator">
            <span className="price-arrow">{priceArrow}</span>
            <span className="price-value">{price}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoodItem;
