
import React from 'react';
import Card from '../ui/Card';
import Loader from '../ui/Loader';

interface LoadingScreenProps {
    status: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ status }) => {
    return (
        <Card className="text-center">
            <div className="flex flex-col items-center justify-center">
                <Loader />
                <p className="text-slate-300 font-medium mt-6 mb-2 text-lg">Preparando o ambiente...</p>
                <p className="text-sm text-slate-400 h-5" aria-live="polite">
                    {status}
                </p>
            </div>
        </Card>
    );
};

export default LoadingScreen;
