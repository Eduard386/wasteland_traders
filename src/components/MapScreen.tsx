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

  const handleCitySelect = (cityId: string) => {
    setSelectedCityId(cityId);
  };

  const handleTravel = () => {
    if (selectedCityId) {
      travel(selectedCityId);
      setSelectedCityId(null);
    }
  };

  const getCityImage = (cityId: string) => {
    return `./assets/cities/${cityId}.png`;
  };

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

          {/* Текущий город */}
          <div className="current-city">
            <h3>Current City: {currentCity?.name}</h3>
            <div className="city-preview">
              <img 
                src={getCityImage(player.cityId)} 
                alt={currentCity?.name}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>

          {/* Соседние города */}
          <div className="neighbors-section">
            <h3>Neighboring Cities</h3>
            <div className="neighbors-grid">
              {neighbors.map(city => {
                const route = getRouteInfo(city.id);
                const isSelected = selectedCityId === city.id;
                
                return (
                  <div 
                    key={city.id} 
                    className={`neighbor-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleCitySelect(city.id)}
                  >
                    <div className="city-info">
                      <h4>{city.name}</h4>
                      {route && (
                        <div className="route-info">
                          <span className="route-length">Length: {route.length}</span>
                          <span className="route-risk">Risk: {Math.round(route.risk * 100)}%</span>
                        </div>
                      )}
                    </div>
                    <div className="city-preview">
                      <img 
                        src={getCityImage(city.id)} 
                        alt={city.name}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Кнопки действий */}
          <div className="action-buttons">
            <button 
              className="btn guard-btn" 
              disabled={true} // Пока неактивна
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
