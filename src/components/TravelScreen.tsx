import { useGameStore } from '../state/store';

const TravelScreen = () => {
  const { setScreen } = useGameStore();

  return (
    <div className="travel-screen">
      <div className="card">
        <h2 className="title">Travel</h2>
        <p>Route selection (will be implemented in Stage C)</p>
        <button className="btn" onClick={() => setScreen('city')}>
          Return to City
        </button>
      </div>
    </div>
  );
};

export default TravelScreen;
