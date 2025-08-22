import { useState, useEffect, useCallback } from 'react';
import preloader from '../utils/preloader';

interface UseLazyLoadingOptions {
    preloadOnMount?: boolean;
    preloadOnHover?: boolean;
    preloadOnFocus?: boolean;
    timeout?: number;
}

export const useLazyLoading = (
    componentName: string,
    componentLoader: () => Promise<any>,
    options: UseLazyLoadingOptions = {}
) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const {
        preloadOnMount = false,
        preloadOnHover = false,
        preloadOnFocus = false,
        timeout = 5000
    } = options;

    const loadComponent = useCallback(async () => {
        if (isLoaded || isLoading || preloader.isComponentPreloaded(componentName)) {
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            await preloader.preloadComponent(componentName, componentLoader, { timeout });
            setIsLoaded(true);
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to load component'));
        } finally {
            setIsLoading(false);
        }
    }, [componentName, componentLoader, isLoaded, isLoading, timeout]);

    // Предзагрузка при монтировании
    useEffect(() => {
        if (preloadOnMount) {
            loadComponent();
        }
    }, [preloadOnMount, loadComponent]);

    // Предзагрузка при наведении
    const handleMouseEnter = useCallback(() => {
        if (preloadOnHover && !isLoaded && !isLoading) {
            loadComponent();
        }
    }, [preloadOnHover, isLoaded, isLoading, loadComponent]);

    // Предзагрузка при фокусе
    const handleFocus = useCallback(() => {
        if (preloadOnFocus && !isLoaded && !isLoading) {
            loadComponent();
        }
    }, [preloadOnFocus, isLoaded, isLoading, loadComponent]);

    return {
        isLoading,
        isLoaded,
        error,
        loadComponent,
        handleMouseEnter,
        handleFocus
    };
};

// Хук для предзагрузки ресурсов
export const useAssetPreloading = (assets: string[]) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadedAssets, setLoadedAssets] = useState<Set<string>>(new Set());
    const [error, setError] = useState<Error | null>(null);

    const preloadAssets = useCallback(async () => {
        if (isLoading) return;

        setIsLoading(true);
        setError(null);

        try {
            await preloader.preloadAssets(assets);
            setLoadedAssets(new Set(assets));
        } catch (err) {
            setError(err instanceof Error ? err : new Error('Failed to preload assets'));
        } finally {
            setIsLoading(false);
        }
    }, [assets, isLoading]);

    const isAssetLoaded = useCallback((asset: string) => {
        return loadedAssets.has(asset) || preloader.isAssetPreloaded(asset);
    }, [loadedAssets]);

    return {
        isLoading,
        loadedAssets,
        error,
        preloadAssets,
        isAssetLoaded
    };
};
