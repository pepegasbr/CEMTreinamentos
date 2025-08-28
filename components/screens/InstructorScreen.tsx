
import React, { useState, useEffect, useRef } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { LS_KEYS } from '../../constants';

interface InstructorScreenProps {
    onStart: (instructorName: string) => void;
}

const InstructorScreen: React.FC<InstructorScreenProps> = ({ onStart }) => {
    const [instructorName, setInstructorName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const savedInstructor = localStorage.getItem(LS_KEYS.INSTRUCTOR) || '';
        setInstructorName(savedInstructor);
        inputRef.current?.focus();
    }, []);

    const handleStart = () => {
        const trimmedName = instructorName.trim();
        if (trimmedName) {
            onStart(trimmedName);
        }
    };

    return (
        <Card className="text-center max-w-lg w-full">
            <h1 className="text-3xl font-bold mb-2 text-white">Instrutor</h1>
            <p className="text-slate-300 mb-6">Com quem você está tendo aula?</p>
            <form onSubmit={(e) => { e.preventDefault(); handleStart(); }} className="space-y-4 max-w-sm mx-auto">
                <Input
                    ref={inputRef}
                    icon="👨‍🏫"
                    type="text"
                    id="instructor-name"
                    placeholder="Digite o nome do instrutor"
                    value={instructorName}
                    onChange={(e) => setInstructorName(e.target.value)}
                    autoComplete="off"
                />
                <Button type="submit" className="w-full" disabled={!instructorName.trim()}>
                    Iniciar Treinamento
                </Button>
            </form>
        </Card>
    );
};

export default InstructorScreen;
