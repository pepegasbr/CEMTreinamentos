
import React, { useEffect } from 'react';
import { Toast as ToastType } from '../../types';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: number) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(toast.id);
    }, 2500);

    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  const baseClasses = "pointer-events-auto bg-slate-900/80 backdrop-blur-md border p-3 pl-4 rounded-xl shadow-lg w-full max-w-sm animate-toast-in";
  
  const typeClasses = {
    info: 'border-slate-500 text-slate-200',
    success: 'border-green-500 text-green-300',
    error: 'border-red-500 text-red-300',
    warn: 'border-yellow-500 text-yellow-300',
  };

  return (
    <div className={`${baseClasses} ${typeClasses[toast.type]}`}>
      {toast.message}
    </div>
  );
};

interface ToastContainerProps {
  toasts: ToastType[];
  onDismiss: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  return (
    <>
      <div className="fixed bottom-4 right-4 z-[1100] space-y-2">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
        ))}
      </div>
       <style>{`
        @keyframes toast-in {
            from { transform: translateY(8px) scale(0.98); opacity: 0; }
            to { transform: translateY(0); scale(1); opacity: 1; }
        }
        .animate-toast-in { animation: toast-in .25s ease-out forwards; }
      `}</style>
    </>
  );
};
