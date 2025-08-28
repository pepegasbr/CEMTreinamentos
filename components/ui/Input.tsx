
import React, { forwardRef } from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ icon, className, ...props }, ref) => {
  const hasIcon = !!icon;
  return (
    <div className="relative w-full">
      {hasIcon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl pointer-events-none">
          {icon}
        </span>
      )}
      <input
        ref={ref}
        className={`w-full bg-[--input-bg] border border-[--card-border] text-[--text-light] rounded-xl px-4 py-3 transition-all duration-200 placeholder:text-slate-500 focus:outline-none focus:border-[--theme-blue] focus:ring-4 focus:ring-blue-500/40 ${hasIcon ? 'pl-11' : ''} ${className}`}
        {...props}
      />
    </div>
  );
});

Input.displayName = 'Input';
export default Input;
