import { useState } from 'react';
import { useGameStore } from '../state/store';
import type { Road } from '../lib/types';
import './MapScreen.css';

const MapScreen = () => {
  const { world, player, setScreen, travel } = useGameStore();
  const [selectedCityId, setSelectedCityId] = useState<string | null>(null);

  const currentCity = world.cities.find(c => c.id === player.cityId);
  const neighbors = currentCity
    ? world.cities.filter(c => currentCity.neighbors.includes(c.id))
    : [];

  const getRouteInfo = (toCityId: string): Road | null => {
    return world.roads.find(r =>
      (r.from === player.cityId && r.to === toCityId) ||
      (r.from === toCityId && r.to === player.cityId)
    ) || null;
  };

  const handleCityClick = (cityId: string) => {
    // Проверяем, является ли город соседним
    const isNeighbor = neighbors.some(c => c.id === cityId);
    if (isNeighbor) {
      setSelectedCityId(cityId);
    }
    // Если не соседний - пока ничего не делаем
  };

  const handleTravel = () => {
    if (selectedCityId) {
      travel(selectedCityId);
      setSelectedCityId(null);
    }
  };

  const getCityIcon = (cityId: string) => {
    return `./assets/city_icons/icon_${cityId}.png`;
  };

  const getCityPosition = (cityId: string) => {
    const positions: Record<string, { top: string; left: string }> = {
      'rust_town': { top: '20%', left: '20%' },
      'metal_hill': { top: '20%', left: '70%' },
      'dusty_oasis': { top: '70%', left: '20%' },
      'bottle_cap_canyon': { top: '70%', left: '70%' }
    };
    return positions[cityId] || { top: '50%', left: '50%' };
  };

  const isCurrentCity = (cityId: string) => cityId === player.cityId;
  const isNeighbor = (cityId: string) => neighbors.some(c => c.id === cityId);
  const isSelected = (cityId: string) => cityId === selectedCityId;

  return (
    <div className="map-screen">
      <div className="map-background">
        <div className="map-content">
          {/* Заголовок */}
          <div className="map-header">
            <h2 className="title">World Map</h2>
            <button className="btn" onClick={() => setScreen('city')}>
              Return to City
            </button>
          </div>

          {/* Карта мира */}
          <div className="world-map">
            {/* Дороги между городами */}
            <svg className="roads-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Дороги в форме квадрата */}
              <line x1="20" y1="20" x2="70" y2="20" className="road" />
              <line x1="20" y1="20" x2="20" y2="70" className="road" />
              <line x1="70" y1="20" x2="70" y2="70" className="road" />
              <line x1="20" y1="70" x2="70" y2="70" className="road" />
            </svg>

            {/* Города */}
            {world.cities.map(city => {
              const position = getCityPosition(city.id);
              const route = getRouteInfo(city.id);
              const cityClass = `city-icon ${isCurrentCity(city.id) ? 'current' : ''} ${isNeighbor(city.id) ? 'neighbor' : ''} ${isSelected(city.id) ? 'selected' : ''}`;

              return (
                <div
                  key={city.id}
                  className={cityClass}
                  style={position}
                  onClick={() => handleCityClick(city.id)}
                >
                  <img
                    src={getCityIcon(city.id)}
                    alt={city.name}
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                  <div className="city-name">{city.name}</div>

                  {/* Информация о маршруте для выбранного соседнего города */}
                  {isSelected(city.id) && route && (
                    <div className="route-info-popup">
                      <div className="route-length">Length: {route.length}</div>
                      <div className="route-risk">Risk: {Math.round(route.risk * 100)}%</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Кнопки действий */}
          <div className="action-buttons">
            <button
              className="btn guard-btn"
              disabled={true}
            >
              Hire Guard (Coming Soon)
            </button>
            <button
              className="btn travel-btn"
              disabled={!selectedCityId}
              onClick={handleTravel}
            >
              Travel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapScreen;
