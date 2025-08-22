import { useEffect } from 'react';
import { useGameStore } from './state/store';
import CityScreen from './components/CityScreen';
import MapScreen from './components/MapScreen';
import BankruptcyScreen from './components/BankruptcyScreen';
import GuardsScreen from './components/GuardsScreen';
import TravelScreen from './components/TravelScreen';
import './App.css';

function App() {
  const { world, initializeGame, currentScreen, isBankrupt, selectedCityId } = useGameStore();

  // Инициализация игры при первом запуске
  useEffect(() => {
    if (world.cities.length === 0) {
      initializeGame();
    }
  }, [world.cities.length, initializeGame]);

  // Проверяем банкротство
  if (isBankrupt()) {
    return <BankruptcyScreen />;
  }

  // Рендер соответствующего экрана
  const renderScreen = () => {
    switch (currentScreen) {
      case 'city':
        return <CityScreen />;
      case 'map':
        return <MapScreen />;
      case 'guards':
        return selectedCityId ? (
          <GuardsScreen
            targetCityId={selectedCityId}
            onDecline={() => {
              const { setScreen } = useGameStore.getState();
              setScreen('map');
            }}
            onTurnBack={() => {
              const { setScreen } = useGameStore.getState();
              setScreen('map');
            }}
          />
        ) : (
          <MapScreen />
        );
      case 'travel':
        return (
          <TravelScreen
            onComplete={() => {
              const { completeTravel } = useGameStore.getState();
              completeTravel();
            }}
          />
        );
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
