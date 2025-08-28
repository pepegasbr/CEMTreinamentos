
import React from 'react';
import Card from '../ui/Card';
import Loader from '../ui/Loader';

const SubmittingScreen: React.FC = () => {
    return (
        <Card className="text-center">
            <div className="flex flex-col items-center justify-center">
                <Loader />
                <p className="text-slate-300 font-medium mt-6 mb-2 text-lg">Enviando suas respostas...</p>
                <p className="text-sm text-slate-400">
                    Por favor, aguarde e não feche esta página.
                </p>
            </div>
        </Card>
    );
};

export default SubmittingScreen;