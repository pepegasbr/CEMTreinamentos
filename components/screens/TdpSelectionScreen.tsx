
import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { OpenAnswerQuestion } from '../../types';

interface TdpSelectionScreenProps {
    tdpQuestionsByEval: Record<string, OpenAnswerQuestion[]>;
    onSelect: (questions: OpenAnswerQuestion[], quizType: string) => void;
}

const TdpSelectionScreen: React.FC<TdpSelectionScreenProps> = ({ tdpQuestionsByEval, onSelect }) => {
    const sortedKeys = Object.keys(tdpQuestionsByEval).sort();
    return (
        <Card className="text-center max-w-xl w-full">
            <h2 className="text-2xl font-bold mb-6 text-white">Treinamento Documental</h2>
            <p className="text-slate-300 mb-8">Escolha a avaliação que deseja realizar:</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {sortedKeys.map(evalName => (
                    <Button 
                        key={evalName}
                        variant="secondary"
                        onClick={() => onSelect(tdpQuestionsByEval[evalName], `TDP - ${evalName}`)}
                    >
                        {evalName.replace('AV', 'Avaliação ')}
                    </Button>
                ))}
            </div>
        </Card>
    );
};

export default TdpSelectionScreen;
