
import React, { useState, useEffect, useRef } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { OpenAnswerQuestion } from '../../types';
import { MAX_OA_CHARS, LS_KEYS } from '../../constants';

interface OpenAnswerQuizScreenProps {
    question: OpenAnswerQuestion;
    current: number;
    total: number;
    showQuestionNumber: boolean;
    quizType: string;
    onSubmit: (answer: string) => void;
    addToast: (message: string, type: 'info' | 'success') => void;
}

const OpenAnswerQuizScreen: React.FC<OpenAnswerQuizScreenProps> = ({ question, current, total, showQuestionNumber, quizType, onSubmit, addToast }) => {
    const [answer, setAnswer] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const progress = (current / total) * 100;
    const draftKey = `${quizType}|${current}`;

    const autoResizeTextarea = () => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    };
    
    useEffect(() => {
        // Reset and try to load draft when question changes
        setAnswer(''); 
        try {
            const draftData = localStorage.getItem(LS_KEYS.DRAFT);
            if (draftData) {
                const draft = JSON.parse(draftData);
                if (draft.key === draftKey && draft.answer) {
                    setAnswer(draft.answer);
                    addToast('Rascunho restaurado.', 'info');
                }
            }
        } catch (error) {
            console.error("Failed to parse draft:", error);
        }
    }, [question, current, quizType, draftKey, addToast]);

    useEffect(() => {
        autoResizeTextarea();
    }, [answer]);

    const saveDraft = () => {
        try {
            localStorage.setItem(LS_KEYS.DRAFT, JSON.stringify({ key: draftKey, answer, time: Date.now() }));
            addToast('Rascunho salvo.', 'success');
        } catch (error) {
            console.error("Failed to save draft:", error);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedAnswer = answer.trim();
        if (trimmedAnswer) {
            onSubmit(trimmedAnswer);
            localStorage.removeItem(LS_KEYS.DRAFT);
        }
    };
    
    const charCount = answer.length;
    const isOverLimit = charCount > MAX_OA_CHARS;

    return (
        <Card className="w-full max-w-2xl">
            {showQuestionNumber && (
                <div className="mb-6 text-center">
                    <p className="text-sm text-slate-400">Pergunta {current + 1} de {total}</p>
                    <div className="w-full bg-slate-700 rounded-full h-2.5 mt-2 overflow-hidden">
                        <div className="bg-[var(--theme-blue)] h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            )}
            <p className="text-xl font-medium mb-4 text-white">{question.question}</p>
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
                    <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                        <button type="button" onClick={saveDraft} className="text-slate-300 hover:text-white underline underline-offset-2">
                            Salvar rascunho
                        </button>
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
    );
};

export default OpenAnswerQuizScreen;
