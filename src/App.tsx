import { useEffect } from 'react';
import { useGameStore } from './state/store';
import CityScreen from './components/CityScreen';
import BarterScreen from './components/BarterScreen';

import MapScreen from './components/MapScreen';
import './App.css';

function App() {
  const { world, initializeGame, currentScreen } = useGameStore();

  // Инициализация игры при первом запуске
  useEffect(() => {
    if (world.cities.length === 0) {
      initializeGame();
    }
  }, [world.cities.length, initializeGame]);

  // Рендер соответствующего экрана
  const renderScreen = () => {
    switch (currentScreen) {
      case 'city':
        return <CityScreen />;
      case 'barter':
        return <BarterScreen />;
      
      case 'map':
        return <MapScreen />;
      default:
        return <CityScreen />;
    }
  };

  return (
    <div className="app">
      {renderScreen()}
    </div>
  );
}

export default App;
