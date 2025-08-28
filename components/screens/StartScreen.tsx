
import React, { useState, useEffect, useRef } from 'react';
import Card from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { LS_KEYS } from '../../constants';

interface StartScreenProps {
    onNext: (nickname: string) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onNext }) => {
    const [nickname, setNickname] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const savedNick = localStorage.getItem(LS_KEYS.NICK) || '';
        setNickname(savedNick);
        inputRef.current?.focus();
    }, []);

    const handleNext = () => {
        const trimmedNick = nickname.trim();
        if (trimmedNick) {
            onNext(trimmedNick);
        }
    };
    
    return (
        <Card className="text-center max-w-lg w-full">
            <img src="https://i.imgur.com/1d0DeWS.png" alt="Logo CEM" className="w-20 h-20 mx-auto mb-5 rounded-full shadow-md" />
            <h1 className="text-3xl font-bold mb-2 text-white">Bem-vindo(a) ao Treinamento!</h1>
            <p className="text-slate-300 mb-6">Para começar, por favor, insira seu nome ou apelido.</p>
            <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-4 max-w-sm mx-auto">
                <Input 
                    ref={inputRef}
                    icon="🏷️"
                    type="text" 
                    id="nickname" 
                    placeholder="Digite seu nick aqui" 
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    autoComplete="name"
                />
                <Button type="submit" className="w-full" disabled={!nickname.trim()}>
                    Continuar
                </Button>
            </form>
        </Card>
    );
};

export default StartScreen;
