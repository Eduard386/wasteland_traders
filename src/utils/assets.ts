// Утилита для правильных путей к ресурсам
// В разработке использует относительные пути, в продакшене - абсолютные

export const getAssetPath = (path: string): string => {
  // В продакшене (GitHub Pages) используем пути с именем репозитория
  if (import.meta.env.PROD) {
    return `/wasteland_traders/assets/${path}`;
  }
  // В разработке используем относительные пути
  return `./assets/${path}`;
};

export const getGoodImage = (goodId: string): string => {
  return getAssetPath(`goods/${goodId}.png`);
};

export const getCityImage = (cityId: string): string => {
  return getAssetPath(`cities/${cityId}.png`);
};

export const getCityIcon = (cityId: string): string => {
  return getAssetPath(`city_icons/icon_${cityId}.png`);
};

export const getWorldMap = (): string => {
  return getAssetPath('world_map.png');
};

export const getBankruptImage = (): string => {
  return getAssetPath('bankrupt.png');
};

export const getGuardsImage = (): string => {
  return getAssetPath('guards.png');
};

export const getGuardsVideo = (): string => {
  return getAssetPath('guards.mp4');
};
