import { useGameStore } from '../state/store';
import { getAllPrices } from '../lib/values';
import { getNeighbors } from '../lib/graph';
import './CityScreen.css';

const CityScreen = () => {
  const { world, player, doTick, setScreen } = useGameStore();
  
  const currentCity = world.cities.find(c => c.id === player.cityId);
  const currentCityState = world.cityStates[player.cityId];
  const neighbors = getNeighbors(player.cityId, world.cities);
  const prices = currentCityState ? getAllPrices(currentCityState.market) : null;

  const getCityImage = (cityId: string) => {
    return `/assets/cities/${cityId}.png`;
  };

  // const getGoodImage = (goodId: string) => {
  //   return `/assets/goods/${goodId}.png`;
  // };

  if (!currentCity || !currentCityState || !prices) {
    return <div>Loading...</div>;
  }

  console.log('Current city:', currentCity.id, 'Image path:', getCityImage(currentCity.id));
  
  // Проверяем загрузку изображения
  const img = new Image();
  img.onload = () => console.log('Image loaded successfully:', getCityImage(currentCity.id));
  img.onerror = () => console.log('Image failed to load:', getCityImage(currentCity.id));
  img.src = getCityImage(currentCity.id);

  const handleImageError = (e: React.SyntheticEvent<HTMLDivElement, Event>) => {
    console.log('Image failed to load:', e);
  };



  return (
    <div className="city-screen">
      {/* Фон города */}
      <div 
        className="city-background"
        style={{ 
          backgroundImage: `url(${getCityImage(currentCity.id)})`
        }}
        onError={handleImageError}
      >
        <div className="city-overlay">
          {/* Заголовок города */}
          <div className="city-header">
            <h1 className="city-name">{currentCity.name}</h1>
          </div>

          {/* Кнопки действий */}
          <div className="action-buttons">
            <button 
              className="btn action-btn"
              onClick={() => setScreen('barter')}
            >
              Barter
            </button>
            <button 
              className="btn action-btn"
              onClick={() => setScreen('travel')}
            >
              Travel
            </button>
            <button 
              className="btn action-btn"
              onClick={() => setScreen('map')}
            >
              World Map
            </button>
          </div>

          {/* Соседи */}
          <div className="neighbors">
            <h3>Neighboring Cities:</h3>
            <div className="neighbors-grid">
              {neighbors.map(neighbor => (
                <div key={neighbor.id} className="neighbor-card">
                  <h4>{neighbor.name}</h4>
                  <div className="neighbor-preview">
                    {/* Превью цен соседнего города */}
                    <div className="price-preview">
                      {Object.entries(prices).slice(0, 3).map(([good, price]) => (
                        <span 
                          key={good} 
                          className={`price-badge ${price === 1 ? 'cheap' : price === 3 ? 'exp' : ''}`}
                        >
                          {price}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* HUD */}
          <div className="hud">
            <div className="hud-item">
              <button className="btn" onClick={doTick}>
                Make Market Tick (2 cities)
              </button>
              <span className="tick-info">Tick: {world.tick}</span>
            </div>
            <div className="hud-item">
              <button className="btn">
                Copy Game Link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CityScreen;
