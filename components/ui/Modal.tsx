
import React, { useEffect } from 'react';
import Button from './Button';

interface ModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ isOpen, title, message, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) {
        return null;
    }

    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[1000] transition-opacity duration-300 animate-fade-in"
            onClick={onClose}
            aria-modal="true"
            role="dialog"
        >
            <div 
                className="bg-slate-800 p-7 rounded-2xl border border-[--card-border] shadow-2xl w-full max-w-md m-4 text-left animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-300 mb-6 whitespace-pre-wrap">{message}</p>
                <div className="flex justify-end">
                    <Button onClick={onClose}>OK</Button>
                </div>
            </div>
            <style>{`
                @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
                .animate-fade-in { animation: fade-in 0.25s ease forwards; }
                @keyframes slide-up { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
                .animate-slide-up { animation: slide-up 0.3s ease-out forwards; }
            `}</style>
        </div>
    );
};

export default Modal;
