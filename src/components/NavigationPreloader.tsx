import { useEffect } from 'react';
import { useGameStore } from '../state/store';
import { useLazyLoading } from '../hooks/useLazyLoading';

const NavigationPreloader = () => {
    const { currentScreen } = useGameStore();

    // Предзагрузка компонентов на основе текущего экрана
    const { loadComponent: loadCityScreen } = useLazyLoading(
        'CityScreen',
        () => import('./CityScreen'),
        { preloadOnMount: false }
    );

    const { loadComponent: loadMapScreen } = useLazyLoading(
        'MapScreen',
        () => import('./MapScreen'),
        { preloadOnMount: false }
    );

    const { loadComponent: loadGuardsScreen } = useLazyLoading(
        'GuardsScreen',
        () => import('./GuardsScreen'),
        { preloadOnMount: false }
    );

    const { loadComponent: loadBarterScreen } = useLazyLoading(
        'BarterScreen',
        () => import('./BarterScreen'),
        { preloadOnMount: false }
    );

    // Предзагружаем соседние экраны для быстрой навигации
    useEffect(() => {
        // Всегда предзагружаем все основные экраны для мгновенной навигации
        loadCityScreen();
        loadMapScreen();
        loadGuardsScreen();
        loadBarterScreen();
    }, [currentScreen, loadCityScreen, loadMapScreen, loadGuardsScreen, loadBarterScreen]);

    // Этот компонент не рендерит ничего видимого
    return null;
};

export default NavigationPreloader;
