import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { User } from '../../types';

interface TrainingSelectionScreenProps {
    user: User;
    onSelect: (quizKey: 'vf' | 'tdp' | 'avdocRes' | 'pulsoFirme' | 'fardas') => void;
}

const trainingOptions = [
    { key: 'vf', label: '✅ Verdadeiro ou Falso' },
    { key: 'tdp', label: '📄 Treinamento Documental Preparatório' },
    { key: 'avdocRes', label: '🧩 Avaliação Documental / Resolução de Casos' },
    { key: 'pulsoFirme', label: '💪 Treino de Pulso Firme & Rigidez' },
    { key: 'fardas', label: '🎖️ Treinamento de Fardas' },
] as const;


const TrainingSelectionScreen: React.FC<TrainingSelectionScreenProps> = ({ user, onSelect }) => {
    return (
        <Card className="text-center max-w-3xl w-full">
            <h2 className="text-2xl font-bold mb-4 text-white">
                Olá, <span className="text-[var(--theme-blue)]">{user.nickname}</span>!
            </h2>
            <p className="text-slate-300 mb-8">Qual treinamento você gostaria de fazer hoje?</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {trainingOptions.map((option, index) => {
                    const isLastItem = index === trainingOptions.length - 1;
                    const isOddCount = trainingOptions.length % 2 !== 0;

                    if (isLastItem && isOddCount) {
                        return (
                            <div key={option.key} className="sm:col-span-2 flex justify-center">
                                <Button 
                                    onClick={() => onSelect(option.key)} 
                                    variant="secondary" 
                                    className="w-full sm:w-auto sm:min-w-[250px]"
                                >
                                    {option.label}
                                </Button>
                            </div>
                        )
                    }
                    return (
                        <Button key={option.key} onClick={() => onSelect(option.key)} variant="secondary" className="h-full">
                            {option.label}
                        </Button>
                    )
                })}
            </div>
        </Card>
    );
};

export default TrainingSelectionScreen;
