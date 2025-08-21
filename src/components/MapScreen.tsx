import { useState } from 'react';
import { useGameStore } from '../state/store';
import { GOODS, type Road, type GoodId } from '../lib/types';
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

  // Получение информации о товарах города
  const getCityGoods = (cityId: string) => {
    const cityState = world.cityStates[cityId];
    if (!cityState) return { cheap: [], exp: [] };

    return {
      cheap: cityState.market.cheap || [],
      exp: cityState.market.exp || []
    };
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

  const getGoodIcon = (goodId: GoodId) => {
    return `./assets/goods/${goodId}.png`;
  };

  const getCityPosition = (cityId: string) => {
    const positions: Record<string, { top: string; left: string }> = {
      'rust_town': { top: '25%', left: '25%' },
      'metal_hill': { top: '25%', left: '75%' },
      'dusty_oasis': { top: '75%', left: '25%' },
      'bottle_cap_canyon': { top: '75%', left: '75%' }
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


          {/* Карта мира */}
          <div className="world-map">

            {/* Города */}
            {world.cities.map(city => {
              const position = getCityPosition(city.id);
              const route = getRouteInfo(city.id);
              const cityGoods = getCityGoods(city.id);
              const cityClass = `city-icon ${isCurrentCity(city.id) ? 'current' : ''} ${isNeighbor(city.id) ? 'neighbor' : ''} ${isSelected(city.id) ? 'selected' : ''}`;

              return (
                <div
                  key={city.id}
                  className={cityClass}
                  style={position}
                  onClick={() => handleCityClick(city.id)}
                >
                  {/* Товары над городом */}
                  <div className="city-goods">
                    {/* Дешевые товары (красные) */}
                    {cityGoods.cheap.map((goodId: GoodId) => (
                      <div key={`cheap-${goodId}`} className="good-indicator cheap">
                        <img
                          src={getGoodIcon(goodId)}
                          alt={GOODS[goodId]}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <span className="good-name">{GOODS[goodId]}</span>
                      </div>
                    ))}
                    {/* Дорогие товары (зеленые) */}
                    {cityGoods.exp.map((goodId: GoodId) => (
                      <div key={`exp-${goodId}`} className="good-indicator expensive">
                        <img
                          src={getGoodIcon(goodId)}
                          alt={GOODS[goodId]}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                        <span className="good-name">{GOODS[goodId]}</span>
                      </div>
                    ))}
                  </div>

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
            <button className="btn" onClick={() => setScreen('city')}>
              Return to City
            </button>
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
