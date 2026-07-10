
import React, { useState, useEffect, useRef } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { LS_KEYS } from '../../constants';
import { getStoredValue } from '../../services/storageService';

interface AplicadorScreenProps {
    onStart: (aplicadorName: string) => void;
}

const AplicadorScreen: React.FC<AplicadorScreenProps> = ({ onStart }) => {
    const [aplicadorName, setAplicadorName] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const savedAplicador = getStoredValue(LS_KEYS.APLICADOR);
        setAplicadorName(savedAplicador);
        inputRef.current?.focus();
    }, []);

    const handleStart = () => {
        const trimmedName = aplicadorName.trim();
        if (trimmedName) {
            onStart(trimmedName);
        }
    };

    return (
        <Card className="text-center max-w-lg w-full">
            <h1 className="text-3xl font-bold mb-2 text-white">Aplicador</h1>
            <p className="text-slate-300 mb-6">Quem é o aplicador do treinamento?</p>
            <form onSubmit={(e) => { e.preventDefault(); handleStart(); }} className="space-y-4 max-w-sm mx-auto">
                <Input
                    ref={inputRef}
                    icon="👨‍🏫"
                    type="text"
                    id="aplicador-name"
                    placeholder="Digite o nome do aplicador"
                    value={aplicadorName}
                    onChange={(e) => setAplicadorName(e.target.value)}
                    autoComplete="off"
                />
                <Button type="submit" className="w-full" disabled={!aplicadorName.trim()}>
                    Iniciar Treinamento
                </Button>
            </form>
        </Card>
    );
};

export default AplicadorScreen;
