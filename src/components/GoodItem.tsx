import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { GoodId } from '../lib/types';

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
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `${goodId}-${count}`,
    data: {
      goodId,
      count,
      price,
      isMarket
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const getPriceClass = () => {
    if (price === 1) return 'cheap';
    if (price === 3) return 'exp';
    return '';
  };

  const getPriceArrow = () => {
    if (price === 1) return '⬇️';
    if (price === 3) return '⬆️';
    return '';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`good-item ${getPriceClass()} ${isMarket ? 'market' : 'inventory'}`}
      onClick={onClick}
    >
      <div className="good-image">
        <img 
          src={`./assets/goods/${goodId}.png`} 
          alt={goodId}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      </div>
      <div className="good-info">
        <div className="good-name">{goodId}</div>
        <div className="good-count">{count}</div>
        {isMarket && (
          <div className="price-indicator">
            <span className="price-arrow">{getPriceArrow()}</span>
            <span className="price-value">{price}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GoodItem;
