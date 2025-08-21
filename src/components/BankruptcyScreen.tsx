import { useGameStore } from '../state/store';
import './BankruptcyScreen.css';

const BankruptcyScreen = () => {
    const { initializeGame } = useGameStore();

    const handleNewGame = () => {
        // Очищаем localStorage (куки)
        localStorage.clear();
        // Начинаем новую игру
        initializeGame();
    };

    return (
        <div className="bankruptcy-screen">
            <div className="bankruptcy-content">
                <h1 className="bankruptcy-title">
                    You invested everything into the business and now you are bankrupt.
                </h1>
                <button className="btn new-game-btn" onClick={handleNewGame}>
                    New Game
                </button>
            </div>
        </div>
    );
};

export default BankruptcyScreen;
