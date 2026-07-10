import React, { useEffect, useState } from 'react';

const Confetti: React.FC = () => {
  const [pieces, setPieces] = useState<React.ReactElement[]>([]);

  useEffect(() => {
    const colors = ['#60a5fa', '#34d399', '#f472b6', '#fbbf24', '#a78bfa', '#22d3ee'];
    const newPieces = Array.from({ length: 60 }).map((_, i) => {
      const style: React.CSSProperties = {
        left: `${Math.random() * 100}vw`,
        backgroundColor: colors[Math.floor(Math.random() * colors.length)],
        animationDuration: `${2 + Math.random() * 2}s`,
        opacity: 0.8 + Math.random() * 0.2,
      };
      return <div key={i} className="confetti" style={style}></div>;
    });

    setPieces(newPieces);

    const timer = setTimeout(() => {
        setPieces([]);
    }, 4500);

    return () => clearTimeout(timer);
  }, []);

  if (pieces.length === 0) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-[2000] overflow-hidden pointer-events-none"
        aria-hidden="true"
      >
        {pieces}
      </div>
      <style>{`
        .confetti {
            position: absolute; /* Changed from fixed to be contained */
            top: -10px;
            width: 8px; height: 14px;
            opacity: .9;
            transform: rotate(15deg);
            border-radius: 2px;
            animation: fall linear forwards;
        }
        @keyframes fall {
            to { transform: translateY(110vh) rotate(360deg) }
        }
      `}</style>
    </>
  );
};

export default Confetti;
