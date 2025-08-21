import React from 'react';
import type { GoodId } from '../lib/types';
import { getGoodImage } from '../utils/assets';
import './GoodItem.css';

interface GoodItemProps {
  goodId: GoodId;
  count: number;
  price: number;
  isMarket?: boolean;
  isCheap?: boolean;
  isExpensive?: boolean;
  isLimitReached?: boolean;
  onClick?: () => void;
}

const GoodItem: React.FC<GoodItemProps> = ({
  goodId,
  count,
  price,
  isMarket = false,
  isCheap: propIsCheap,
  isExpensive: propIsExpensive,
  isLimitReached = false,
  onClick
}) => {


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

  const isCheap = propIsCheap !== undefined ? propIsCheap : price === 1;
  const isExpensive = propIsExpensive !== undefined ? propIsExpensive : price === 3;

  return (
    <div
      className={`good-item ${isCheap ? 'cheap' : ''} ${isExpensive ? 'exp' : ''} ${isMarket ? 'market' : 'inventory'} ${isLimitReached ? 'limit-reached' : ''}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <img
        src={getGoodImage(goodId)}
        alt={getGoodName(goodId)}
        className="good-image"
        onError={(e) => {
          // console.error(`Failed to load image for ${goodId}`);
          e.currentTarget.style.display = 'none';
        }}
      />
      {count > 1 && <div className="good-count">{count}</div>}
    </div>
  );
};

export default GoodItem;
