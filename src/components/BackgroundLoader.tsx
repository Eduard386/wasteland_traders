import { useState, useEffect } from 'react';
import { useLazyLoading } from '../hooks/useLazyLoading';
import './BackgroundLoader.css';

const BackgroundLoader = () => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');

    // Отслеживаем загрузку основных компонентов
    const { isLoading: cityLoading } = useLazyLoading(
        'CityScreen',
        () => import('./CityScreen'),
        { preloadOnMount: false }
    );

    const { isLoading: mapLoading } = useLazyLoading(
        'MapScreen',
        () => import('./MapScreen'),
        { preloadOnMount: false }
    );

    const { isLoading: guardsLoading } = useLazyLoading(
        'GuardsScreen',
        () => import('./GuardsScreen'),
        { preloadOnMount: false }
    );

    const { isLoading: barterLoading } = useLazyLoading(
        'BarterScreen',
        () => import('./BarterScreen'),
        { preloadOnMount: false }
    );

    // Обновляем состояние загрузки
    useEffect(() => {
        const loading = cityLoading || mapLoading || guardsLoading || barterLoading;
        setIsLoading(loading);

        if (loading) {
            const messages = [];
            if (cityLoading) messages.push('City');
            if (mapLoading) messages.push('Map');
            if (guardsLoading) messages.push('Guards');
            if (barterLoading) messages.push('Trade');

            setLoadingMessage(`Loading ${messages.join(', ')}...`);
        } else {
            setLoadingMessage('');
        }
    }, [cityLoading, mapLoading, guardsLoading, barterLoading]);

    if (!isLoading) return null;

    return (
        <div className="background-loader">
            <div className="loader-indicator">
                <div className="loader-spinner"></div>
                <span className="loader-text">{loadingMessage}</span>
            </div>
        </div>
    );
};

export default BackgroundLoader;
