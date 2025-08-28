
import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Confetti from '../Confetti';
import { User, VFAnswer } from '../../types';

interface VfResultsScreenProps {
    user: User;
    answers: VFAnswer[];
    onRestart: () => void;
}

const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
);
const XIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-400 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
);

const VfResultsScreen: React.FC<VfResultsScreenProps> = ({ user, answers, onRestart }) => {
    const score = answers.filter(a => a.isCorrect).length;
    const total = answers.length;

    return (
        <Card className="w-full max-w-2xl">
            <Confetti />
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2 text-white">Resultados Finais</h2>
                <p className="text-slate-300">Parabéns, <span className="font-semibold">{user.nickname}</span>! Veja seu desempenho.</p>
                <p className="text-5xl font-bold text-[var(--theme-blue)] mt-4">{score} / {total}</p>
                <p className="text-slate-400">acertos</p>
            </div>
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                {answers.map((ans, i) => (
                    <div key={i} className={`p-4 border-l-4 ${ans.isCorrect ? 'border-green-500' : 'border-red-500'} bg-slate-800/50 rounded-r-lg`}>
                        <p className="font-semibold text-slate-200 mb-2">{i + 1}. {ans.question}</p>
                        <div className="flex items-center text-sm">
                            {ans.isCorrect ? <CheckIcon /> : <XIcon />}
                            <span>Sua resposta: <strong className={ans.isCorrect ? 'text-green-400' : 'text-red-400'}>{ans.userAnswer}</strong></span>
                        </div>
                        {!ans.isCorrect && (
                            <p className="text-sm text-slate-300 mt-1 ml-7">Resposta correta: <strong>{ans.correctAnswer}</strong></p>
                        )}
                        {ans.justification && (
                            <p className="text-sm text-slate-400 mt-2 ml-7 italic"><strong>Justificativa:</strong> {ans.justification}</p>
                        )}
                    </div>
                ))}
            </div>
            <div className="text-center mt-8">
                <Button onClick={onRestart}>Voltar ao Início</Button>
            </div>
        </Card>
    );
};

export default VfResultsScreen;
