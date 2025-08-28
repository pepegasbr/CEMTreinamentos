import React, { useState, useEffect, useRef } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { OpenAnswerQuestion } from '../../types';
import { MAX_OA_CHARS } from '../../constants';

interface OpenAnswerQuizScreenProps {
    question: OpenAnswerQuestion;
    current: number;
    total: number;
    showQuestionNumber: boolean;
    quizType: string;
    onSubmit: (answer: string) => void;
}

const OpenAnswerQuizScreen: React.FC<OpenAnswerQuizScreenProps> = ({ question, current, total, showQuestionNumber, quizType, onSubmit }) => {
    const [answer, setAnswer] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const progress = ((current + 1) / total) * 100;

    const autoResizeTextarea = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };
    
    useEffect(() => {
        // Reset answer when question changes
        setAnswer(''); 
    }, [question]);

    useEffect(() => {
        autoResizeTextarea();
    }, [answer]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedAnswer = answer.trim();
        if (trimmedAnswer) {
            onSubmit(trimmedAnswer);
        }
    };
    
    const charCount = answer.length;
    const isOverLimit = charCount > MAX_OA_CHARS;

    return (
        <>
            <Card className="w-full max-w-2xl">
                {showQuestionNumber && (
                    <div className="mb-6 text-center">
                        <p className="text-sm text-slate-400">Pergunta {current + 1} de {total}</p>
                        <div className="w-full bg-slate-700 rounded-full h-2.5 mt-2 overflow-hidden">
                            <div className="bg-[var(--theme-blue)] h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                        </div>
                    </div>
                )}
                <p className="text-xl font-medium mb-4 text-white animate-text-slide-in">{question.question}</p>
                <form onSubmit={handleSubmit}>
                    <div className="relative">
                        <textarea 
                            ref={textareaRef}
                            rows={6} 
                            className="w-full bg-[--input-bg] border border-[--card-border] text-[--text-light] rounded-xl p-4 transition-all duration-200 resize-none focus:outline-none focus:border-[--theme-blue] focus:ring-4 focus:ring-blue-500/40"
                            placeholder="Digite sua resposta aqui..."
                            value={answer}
                            onChange={(e) => setAnswer(e.target.value)}
                        ></textarea>
                        <div className="flex items-center justify-end mt-2 text-xs text-slate-400 min-h-[1rem]">
                            <span className={isOverLimit ? 'text-red-400' : ''}>
                                {charCount}/{MAX_OA_CHARS}
                            </span>
                        </div>
                    </div>
                    <Button type="submit" className="w-full mt-6" disabled={!answer.trim()}>
                        Próxima Pergunta
                    </Button>
                </form>
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

export default OpenAnswerQuizScreen;