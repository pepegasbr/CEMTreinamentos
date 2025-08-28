
import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Confetti from '../Confetti';
import { User, OpenAnswer } from '../../types';

interface OpenAnswerResultsScreenProps {
    user: User;
    answers: OpenAnswer[];
    onRestart: () => void;
    quizType: string;
}

const OpenAnswerResultsScreen: React.FC<OpenAnswerResultsScreenProps> = ({ user, answers, onRestart, quizType }) => {
    return (
        <Card className="w-full max-w-2xl">
            <Confetti />
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2 text-white">Treinamento Concluído!</h2>
                <p className="text-slate-300">Ótimo trabalho, <span className="font-semibold">{user.nickname}</span>! Suas respostas foram salvas.</p>
                <p className="text-lg text-[var(--theme-blue)] mt-4">Confira o gabarito e aguarde a correção.</p>
            </div>
            <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2">
                {answers.map((ans, i) => (
                    <div key={i} className="p-4 border-l-4 border-slate-500 bg-slate-800/50 rounded-r-lg space-y-2">
                        <p className="font-semibold text-slate-200">{i + 1}. {ans.question}</p>
                        <p className="text-sm text-blue-300 whitespace-pre-wrap"><strong>Sua resposta:</strong> {ans.userAnswer}</p>
                        <p className="text-sm text-green-300 whitespace-pre-wrap"><strong>Resposta correta:</strong> {ans.correctAnswer}</p>
                    </div>
                ))}
            </div>
            <div className="text-center mt-8">
                <Button onClick={onRestart}>Voltar ao Início</Button>
            </div>
        </Card>
    );
};

export default OpenAnswerResultsScreen;
