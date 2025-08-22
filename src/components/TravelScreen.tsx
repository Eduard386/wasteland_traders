import { useEffect, useState } from 'react';
import { getTravelImage } from '../utils/assets';
import './TravelScreen.css';

interface TravelScreenProps {
    onComplete: () => void;
}

const TravelScreen = ({ onComplete }: TravelScreenProps) => {
    const [opacity, setOpacity] = useState(0);
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // Начинаем с черного экрана (opacity = 0)
        // Сразу начинаем fade in (появляется travel.png за 1 секунду)
        const fadeInTimer = setTimeout(() => {
            setOpacity(1);
        }, 0);

        // Через 2 секунды начинаем fade out
        const fadeOutTimer = setTimeout(() => {
            setOpacity(0);
        }, 2000);

        // Через 3 секунды скрываем экран и вызываем onComplete
        const completeTimer = setTimeout(() => {
            setIsVisible(false);
            onComplete();
        }, 3000);

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
            className="travel-screen"
            style={{
                backgroundImage: `url(${getTravelImage()})`,
                opacity
            }}
        />
    );
};

export default TravelScreen;
