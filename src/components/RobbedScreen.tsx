import { useEffect, useState } from 'react';
import { getRobbedImage } from '../utils/assets';
import { type GoodId } from '../lib/types';
import GoodItem from './GoodItem';
import './RobbedScreen.css';

interface RobbedScreenProps {
  stolenItems: Partial<Record<GoodId, number>>;
  onComplete: () => void;
}

const RobbedScreen = ({ stolenItems, onComplete }: RobbedScreenProps) => {
  const [opacity, setOpacity] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Отладочная информация
  console.log('RobbedScreen - stolenItems:', stolenItems);
  console.log('RobbedScreen - Object.entries(stolenItems):', Object.entries(stolenItems));

  useEffect(() => {
    // Начинаем с черного экрана (opacity = 0)
    // Сразу начинаем fade in (появляется robbed.png за 1 секунду)
    const fadeInTimer = setTimeout(() => {
      setOpacity(1);
    }, 0);

    // Через 4 секунды начинаем fade out
    const fadeOutTimer = setTimeout(() => {
      setOpacity(0);
    }, 4000);

    // Через 5 секунд скрываем экран и вызываем onComplete
    const completeTimer = setTimeout(() => {
      setIsVisible(false);
      onComplete();
    }, 5000);

    return () => {
      clearTimeout(fadeInTimer);
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className="robbed-screen"
      style={{
        backgroundImage: `url(${getRobbedImage()})`,
        opacity
      }}
    >
      <div className="robbed-content-overlay">
        <h1 className="robbed-title">
          You were ambushed. You lost some of your goods.
        </h1>
        
        <div className="robbed-items">
          {Object.entries(stolenItems).map(([goodId, count]) => (
            <GoodItem
              key={goodId}
              goodId={goodId as GoodId}
              count={count}
              price={0} // Цена не важна для украденных товаров
              isMarket={false}
              isCheap={false}
              isExpensive={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default RobbedScreen;
