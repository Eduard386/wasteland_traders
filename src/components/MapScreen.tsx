import { useGameStore } from '../state/store';

const MapScreen = () => {
  const { setScreen } = useGameStore();

  return (
    <div className="map-screen">
      <div className="card">
        <h2 className="title">World Map</h2>
        <p>World map (will be implemented later)</p>
        <button className="btn" onClick={() => setScreen('city')}>
          Return to City
        </button>
      </div>
    </div>
  );
};

export default MapScreen;
