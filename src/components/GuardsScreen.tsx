import { useGameStore } from '../state/store';
import { getGuardsImage } from '../utils/assets';
import { type GoodId } from '../lib/types';
import { getAllPrices } from '../lib/values';
import GoodItem from './GoodItem';
import './GuardsScreen.css';

interface GuardsScreenProps {
    targetCityId: string;
    onDecline: () => void;
    onTurnBack: () => void;
}

const GuardsScreen = ({ targetCityId, onDecline, onTurnBack }: GuardsScreenProps) => {
    const { world, player, travelWithGuards } = useGameStore();

    const targetCity = world.cities.find(c => c.id === targetCityId);
    const currentCityState = world.cityStates[player.cityId];

    if (!targetCity || !currentCityState) {
        return <div>Loading...</div>;
    }

    // Получаем цены текущего города
    const prices = getAllPrices(currentCityState.market);

    // Рассчитываем стоимость товаров, которые охрана может взять (исключая последнюю воду/еду)
    const availableValue = Object.entries(player.inv).reduce((total, [goodId, count]) => {
        const good = goodId as GoodId;
        const price = prices[good];

        if (good === 'water') {
            // Можем взять только если больше 1
            const availableCount = Math.max(0, count - 1);
            return total + (availableCount * price);
        } else if (good === 'food') {
            // Можем взять только если больше 1
            const availableCount = Math.max(0, count - 1);
            return total + (availableCount * price);
        } else {
            // Все остальные товары можем взять полностью
            return total + (count * price);
        }
    }, 0);

    // Стоимость услуг охраны (1/4 от доступной стоимости, округленная вниз)
    const guardsCost = Math.floor(availableValue / 4);

    // Можно нанять охрану если:
    // 1. Есть доступные товары
    // 2. Стоимость услуг достаточная (минимум 1)
    const canAfford = availableValue >= 1 && guardsCost >= 1;

    // Если не хватает средств
    if (!canAfford) {
        return (
            <div
                className="guards-screen"
                style={{
                    backgroundImage: `url(${getGuardsImage()})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                <h1 className="guards-title">
                    Тебе нечем платить за наши услуги
                </h1>
                <button className="btn turn-back-btn" onClick={onTurnBack}>
                    Turn back
                </button>
            </div>
        );
    }

    // Рассчитываем товары для оплаты (попытка набрать нужную сумму)
    const calculatePaymentItems = () => {
        const paymentItems: Partial<Record<GoodId, number>> = {};
        let currentCost = 0;
        const targetCost = guardsCost;

        // Проверяем количество воды и еды
        const waterCount = player.inv['water'] || 0;
        const foodCount = player.inv['food'] || 0;

        // Охранники НИКОГДА не берут последнюю воду или еду
        const canTakeWater = waterCount > 1;
        const canTakeFood = foodCount > 1;

        // Сортируем товары по цене (от дорогих к дешевым)
        const sortedItems = Object.entries(player.inv)
            .map(([goodId, count]) => ({ goodId: goodId as GoodId, count, price: prices[goodId as GoodId] }))
            .filter(item => {
                if (item.goodId === 'water') return canTakeWater;
                if (item.goodId === 'food') return canTakeFood;
                return true; // Все остальные товары можно брать
            })
            .sort((a, b) => b.price - a.price);

        for (const item of sortedItems) {
            if (currentCost >= targetCost) break;

            const remainingCost = targetCost - currentCost;
            let maxItemsNeeded = Math.floor(remainingCost / item.price);

            // Для воды и еды - не берем больше чем count - 1 (оставляем минимум 1)
            if (item.goodId === 'water' || item.goodId === 'food') {
                maxItemsNeeded = Math.min(maxItemsNeeded, item.count - 1);
            }

            let itemsToTake = Math.min(maxItemsNeeded, item.count);

            // Если не можем набрать точную сумму, но нужно что-то взять, берем 1 единицу
            if (itemsToTake === 0 && currentCost === 0 && item.count > 0) {
                itemsToTake = 1;
            }

            if (itemsToTake > 0) {
                paymentItems[item.goodId] = itemsToTake;
                currentCost += itemsToTake * item.price;
            }
        }

        return paymentItems;
    };

    const paymentItems = calculatePaymentItems();

    return (
        <div
            className="guards-screen"
            style={{
                backgroundImage: `url(${getGuardsImage()})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat'
            }}
        >
            <h1 className="guards-title">
                This is the price for your safety
            </h1>

            <div className="guards-payment-items">
                {Object.entries(paymentItems).map(([goodId, count]) => (
                    <GoodItem
                        key={goodId}
                        goodId={goodId as GoodId}
                        count={count}
                        price={prices[goodId as GoodId]}
                        isMarket={false}
                        isCheap={false}
                        isExpensive={false}
                    />
                ))}
            </div>

            <div className="guards-buttons-row">
                <button className="btn agree-btn" onClick={() => {
                    travelWithGuards(targetCityId, paymentItems);
                }}>
                    Agree
                </button>
                <button className="btn decline-btn" onClick={onDecline}>
                    Decline
                </button>
            </div>
        </div>
    );
};

export default GuardsScreen;
