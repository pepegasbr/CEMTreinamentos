
import React from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'answer';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className = '', ...props }) => {
  const baseClasses = "inline-flex items-center justify-center gap-2 font-semibold cursor-pointer select-none border px-5 py-3 text-base rounded-xl transition-all transform disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/50 hover:scale-[1.03] active:scale-[0.98]";

  const variantClasses = {
    primary: 'text-white bg-[--theme-blue] border-[--theme-blue] hover:not(:disabled):bg-[--theme-blue-dark] hover:not(:disabled):border-[--theme-blue-dark] shadow-lg shadow-blue-500/20',
    secondary: 'text-[--text-light] bg-white/10 border-white/20 hover:not(:disabled):bg-white/20 hover:not(:disabled):border-white/30',
    ghost: 'text-[--text-light] bg-transparent border-white/20 hover:not(:disabled):bg-white/10',
    answer: '', // Custom classes passed via className prop for answer buttons
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default Button;
