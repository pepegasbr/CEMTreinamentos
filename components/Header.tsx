import React from 'react';
import Button from './ui/Button';
import { User, Screen } from '../types';

interface HeaderProps {
  user: User | null;
  quizType: string;
  onGoHome: () => void;
  screen: Screen;
}

const HomeIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" /><path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" /></svg>
)

const Header: React.FC<HeaderProps> = ({ user, quizType, onGoHome, screen }) => {
  if (!user || !user.nickname || !user.aplicadorName) return null;

  const isHomeScreen = screen === 'trainingSelection';

  return (
    <header className="w-full px-4 mt-4">
      <div className="max-w-4xl mx-auto">
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-3">
            <img src="https://i.imgur.com/1d0DeWS.png" alt="Logo CEM" className="w-9 h-9 rounded-full hidden sm:block" />
            <div className="text-xs sm:text-sm leading-tight">
              <div className="font-semibold text-white">{user.nickname}</div>
              <div className="text-[11px] text-slate-300">
                Aplicador: <span>{user.aplicadorName}</span>
                <span className="mx-1">•</span>
                <span>{quizType}</span>
              </div>
            </div>
          </div>
          {!isHomeScreen && (
            <Button onClick={onGoHome} variant="secondary" className="px-3 py-2 text-sm">
                <HomeIcon />
                <span className="hidden sm:inline">Início</span>
            </Button>
           )}
        </div>
      </div>
    </header>
  );
};

export default Header;