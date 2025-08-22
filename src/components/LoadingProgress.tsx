import { useState, useEffect } from 'react';
import './LoadingProgress.css';

interface LoadingProgressProps {
    total: number;
    current: number;
    message?: string;
    onComplete?: () => void;
}

const LoadingProgress = ({
    total,
    current,
    message = "Loading...",
    onComplete
}: LoadingProgressProps) => {
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
        setProgress(percentage);

        if (percentage === 100 && onComplete) {
            setTimeout(onComplete, 500); // Небольшая задержка для плавности
        }
    }, [current, total, onComplete]);

    return (
        <div className="loading-progress">
            <div className="progress-container">
                <div className="progress-bar">
                    <div
                        className="progress-fill"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <div className="progress-text">
                    <span className="progress-percentage">{progress}%</span>
                    <span className="progress-message">{message}</span>
                </div>
            </div>
        </div>
    );
};

export default LoadingProgress;
