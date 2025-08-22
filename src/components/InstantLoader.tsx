import { useEffect } from 'react';
import { useLazyLoading } from '../hooks/useLazyLoading';

const InstantLoader = () => {
    // Мгновенно загружаем критические компоненты
    const { loadComponent: loadCityScreen } = useLazyLoading(
        'CityScreen',
        () => import('./CityScreen'),
        { preloadOnMount: true }
    );

    const { loadComponent: loadMapScreen } = useLazyLoading(
        'MapScreen',
        () => import('./MapScreen'),
        { preloadOnMount: true }
    );

    const { loadComponent: loadGuardsScreen } = useLazyLoading(
        'GuardsScreen',
        () => import('./GuardsScreen'),
        { preloadOnMount: true }
    );

    const { loadComponent: loadBarterScreen } = useLazyLoading(
        'BarterScreen',
        () => import('./BarterScreen'),
        { preloadOnMount: true }
    );

    const { loadComponent: loadBankruptcyScreen } = useLazyLoading(
        'BankruptcyScreen',
        () => import('./BankruptcyScreen'),
        { preloadOnMount: true }
    );

    // Загружаем все критические компоненты при монтировании
    useEffect(() => {
        const loadAllCritical = async () => {
            try {
                await Promise.allSettled([
                    loadCityScreen(),
                    loadMapScreen(),
                    loadGuardsScreen(),
                    loadBarterScreen(),
                    loadBankruptcyScreen()
                ]);
            } catch (error) {
                console.warn('Some components failed to preload:', error);
            }
        };

        loadAllCritical();
    }, [loadCityScreen, loadMapScreen, loadGuardsScreen, loadBarterScreen, loadBankruptcyScreen]);

    // Этот компонент не рендерит ничего видимого
    return null;
};

export default InstantLoader;
