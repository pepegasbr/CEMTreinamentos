import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { VFQuestion } from '../../types';

interface VfQuizScreenProps {
    question: VFQuestion;
    current: number;
    total: number;
    onAnswer: (answer: 'Verdadeiro' | 'Falso') => void;
    onBack: () => void;
}

const VfQuizScreen: React.FC<VfQuizScreenProps> = ({ question, current, total, onAnswer, onBack }) => {
    const progress = (current / total) * 100;

    return (
        <>
            <Card className="w-full max-w-2xl">
                <div className="mb-4 flex items-center justify-end">
                    <Button variant="ghost" onClick={onBack} disabled={current === 0}>
                        ← Voltar
                    </Button>
                </div>
                <div className="mb-5">
                    <p className="text-sm text-slate-400">Pergunta {current + 1} de {total}</p>
                    <div className="w-full bg-slate-700 rounded-full h-2.5 mt-2 overflow-hidden">
                        <div className="bg-[var(--theme-blue)] h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
                <p className="text-xl font-medium mb-8 text-center min-h-[100px] text-white flex items-center justify-center animate-text-slide-in">
                    {question.question}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Button
                        variant="answer"
                        className="border-2 border-green-500 text-green-400 hover:bg-green-500 hover:text-white"
                        onClick={() => onAnswer('Verdadeiro')}
                    >
                        Verdadeiro
                    </Button>
                    <Button
                        variant="answer"
                        className="border-2 border-red-500 text-red-400 hover:bg-red-500 hover:text-white"
                        onClick={() => onAnswer('Falso')}
                    >
                        Falso
                    </Button>
                </div>
            </Card>
            <style>{`
                @keyframes text-slide-in {
                    from { opacity: 0; transform: translateX(15px); }
                    to { opacity: 1; transform: translateX(0); }
                }
                .animate-text-slide-in { 
                    animation: text-slide-in 0.35s ease-out forwards;
                }
            `}</style>
        </>
    );
};

export default VfQuizScreen;