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
  // Добавляем версию для принудительного обновления кэша
  const version = 'v2'; // Увеличиваем версию при обновлении изображений
  return getAssetPath(`cities/${cityId}.png?v=${version}`);
};

export const getCityIcon = (cityId: string): string => {
  // Добавляем версию для принудительного обновления кэша
  const version = 'v2';
  return getAssetPath(`city_icons/icon_${cityId}.png?v=${version}`);
};

export const getWorldMap = (): string => {
  const version = 'v2';
  return getAssetPath(`world_map.png?v=${version}`);
};

export const getBankruptImage = (): string => {
  const version = 'v2';
  return getAssetPath(`bankrupt.png?v=${version}`);
};

export const getGuardsImage = (): string => {
  const version = 'v2';
  return getAssetPath(`guards.png?v=${version}`);
};

export const getGuardsVideo = (): string => {
  const version = 'v2';
  return getAssetPath(`guards.mp4?v=${version}`);
};

export const getTravelImage = (): string => {
  const version = 'v2';
  return getAssetPath(`travel.png?v=${version}`);
};

export const getRobbedImage = (): string => {
  const version = 'v1';
  return getAssetPath(`robbed.png?v=${version}`);
};
