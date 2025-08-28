
import React from 'react';

const Loader: React.FC = () => {
  return (
    <>
      <div className="border-4 border-white/20 border-t-[--theme-blue] rounded-full w-14 h-14 animate-spin"></div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg) }
        }
      `}</style>
    </>
  );
};

export default Loader;
