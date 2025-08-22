import './LoadingSpinner.css';

interface LoadingSpinnerProps {
    message?: string;
}

const LoadingSpinner = ({ message = "Loading..." }: LoadingSpinnerProps) => {
    return (
        <div className="loading-spinner">
            <div className="spinner"></div>
            <p className="loading-message">{message}</p>
        </div>
    );
};

export default LoadingSpinner;
