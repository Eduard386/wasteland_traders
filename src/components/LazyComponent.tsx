import React, { Suspense, lazy, ComponentType } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LazyComponentProps {
    component: () => Promise<{ default: ComponentType<any> }>;
    fallback?: React.ReactNode;
    errorFallback?: React.ReactNode;
    [key: string]: any;
}

const LazyComponent = ({
    component,
    fallback = <LoadingSpinner />,
    errorFallback = <div>Error loading component</div>,
    ...props
}: LazyComponentProps) => {
    const LazyLoadedComponent = lazy(component);

    return (
        <Suspense fallback={fallback}>
            <ErrorBoundary fallback={errorFallback}>
                <LazyLoadedComponent {...props} />
            </ErrorBoundary>
        </Suspense>
    );
};

// Компонент для обработки ошибок
class ErrorBoundary extends React.Component<
    { children: React.ReactNode; fallback: React.ReactNode },
    { hasError: boolean }
> {
    constructor(props: { children: React.ReactNode; fallback: React.ReactNode }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('Lazy component error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return this.props.fallback;
        }

        return this.props.children;
    }
}

export default LazyComponent;
