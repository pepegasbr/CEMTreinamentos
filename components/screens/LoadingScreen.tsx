import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Loader from '../ui/Loader';

interface LoadingScreenProps {
    status: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ status }) => {
    const [showLongLoadMessage, setShowLongLoadMessage] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowLongLoadMessage(true);
        }, 10000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <Card className="text-center">
            <div className="flex flex-col items-center justify-center">
                <Loader />
                <p className="text-slate-300 font-medium mt-6 mb-2 text-lg">Preparando o ambiente...</p>
                <p className="text-sm text-slate-400 min-h-[1.25rem]" aria-live="polite">
                    {status}
                </p>
                {showLongLoadMessage && (
                    <p className="text-xs text-slate-500 max-w-xs mx-auto mt-4 animate-fade-in">
                        Se a rede estiver instavel, o sistema tenta rotas alternativas e usa a ultima copia salva neste dispositivo quando houver cache.
                    </p>
                )}
            </div>
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.5s ease forwards; }
            `}</style>
        </Card>
    );
};

export default LoadingScreen;
