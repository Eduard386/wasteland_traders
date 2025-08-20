import { useGameStore } from '../state/store';

const BarterScreen = () => {
  const { setScreen } = useGameStore();

  return (
    <div className="barter-screen">
      <div className="card">
        <h2 className="title">Barter</h2>
        <p>Trading screen (will be implemented in Stage B)</p>
        <button className="btn" onClick={() => setScreen('city')}>
          Return to City
        </button>
      </div>
    </div>
  );
};

export default BarterScreen;
