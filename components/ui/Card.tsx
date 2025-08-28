
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div 
      className={`bg-[--card-bg] backdrop-blur-lg border border-[--card-border] rounded-3xl p-8 shadow-2xl shadow-black/20 transition-all duration-200 hover:shadow-black/30 hover:-translate-y-0.5 animate-pop ${className}`}
    >
      {children}
    </div>
  );
};

// Add keyframes for animation in a style tag for simplicity, as per project constraints
const AnimationStyles: React.FC = () => (
  <style>{`
    @keyframes pop {
      from { opacity: 0; transform: translateY(8px) scale(.98); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .animate-pop { animation: pop .22s ease-out both; }
  `}</style>
);

const CardWithAnimation: React.FC<CardProps> = (props) => (
  <>
    <AnimationStyles />
    <Card {...props} />
  </>
);


export default CardWithAnimation;
