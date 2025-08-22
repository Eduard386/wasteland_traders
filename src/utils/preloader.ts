// Утилита для предзагрузки компонентов и ресурсов

interface PreloadOptions {
    priority?: 'high' | 'low';
    timeout?: number;
}

class Preloader {
    private preloadedComponents = new Set<string>();
    private preloadedAssets = new Set<string>();

    // Предзагрузка компонента
    async preloadComponent(
        componentName: string,
        componentLoader: () => Promise<any>,
        options: PreloadOptions = {}
    ): Promise<void> {
        if (this.preloadedComponents.has(componentName)) {
            return;
        }

        try {
            const timeout = options.timeout || 5000;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeout);

            await componentLoader();
            clearTimeout(timeoutId);

            this.preloadedComponents.add(componentName);
            console.log(`Component ${componentName} preloaded successfully`);
        } catch (error) {
            console.warn(`Failed to preload component ${componentName}:`, error);
        }
    }

    // Предзагрузка изображения
    preloadImage(src: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.preloadedAssets.has(src)) {
                resolve();
                return;
            }

            const img = new Image();
            img.onload = () => {
                this.preloadedAssets.add(src);
                resolve();
            };
            img.onerror = reject;
            img.src = src;
        });
    }

    // Предзагрузка видео
    preloadVideo(src: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.preloadedAssets.has(src)) {
                resolve();
                return;
            }

            const video = document.createElement('video');
            video.preload = 'metadata';
            video.onloadedmetadata = () => {
                this.preloadedAssets.add(src);
                resolve();
            };
            video.onerror = reject;
            video.src = src;
        });
    }

    // Массовая предзагрузка ресурсов
    async preloadAssets(assets: string[]): Promise<void> {
        const promises = assets.map(asset => {
            if (asset.match(/\.(mp4|webm|ogg)$/i)) {
                return this.preloadVideo(asset);
            } else if (asset.match(/\.(png|jpg|jpeg|gif|webp)$/i)) {
                return this.preloadImage(asset);
            }
            return Promise.resolve();
        });

        await Promise.allSettled(promises);
    }

    // Проверка, загружен ли компонент
    isComponentPreloaded(componentName: string): boolean {
        return this.preloadedComponents.has(componentName);
    }

    // Проверка, загружен ли ресурс
    isAssetPreloaded(src: string): boolean {
        return this.preloadedAssets.has(src);
    }

    // Очистка кэша
    clearCache(): void {
        this.preloadedComponents.clear();
        this.preloadedAssets.clear();
    }
}

export const preloader = new Preloader();
export default preloader;
