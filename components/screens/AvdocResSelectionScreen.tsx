
import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { OpenAnswerQuestion } from '../../types';

interface AvdocResSelectionScreenProps {
    avdocResQuestions: Record<string, OpenAnswerQuestion[]>;
    onSelect: (questions: OpenAnswerQuestion[], quizType: string) => void;
}

const AvdocResSelectionScreen: React.FC<AvdocResSelectionScreenProps> = ({ avdocResQuestions, onSelect }) => {
    const sectionNames: Record<string, string> = { AVDOC: 'Avaliação Documental', RES: 'Resolução de Casos' };
    const sortedKeys = Object.keys(avdocResQuestions).sort();

    return (
        <Card className="text-center max-w-xl w-full">
            <h2 className="text-2xl font-bold mb-6 text-white">Avaliação / Resolução</h2>
            <p className="text-slate-300 mb-8">Escolha o módulo que deseja realizar:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {sortedKeys.map(sectionKey => (
                    <Button 
                        key={sectionKey}
                        variant="secondary"
                        onClick={() => onSelect(avdocResQuestions[sectionKey], sectionNames[sectionKey] || sectionKey)}
                    >
                        {sectionNames[sectionKey] || sectionKey}
                    </Button>
                ))}
            </div>
        </Card>
    );
};

export default AvdocResSelectionScreen;
