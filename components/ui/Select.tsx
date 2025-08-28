
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    children: React.ReactNode;
}

const Select: React.FC<SelectProps> = ({ children, className = '', ...props }) => {
    return (
        <select
            className={`w-full bg-[--input-bg] border border-[--card-border] text-[--text-light] rounded-xl px-4 py-3 transition-all duration-200 custom-select focus:outline-none focus:border-[--theme-blue] focus:ring-4 focus:ring-blue-500/40 ${className}`}
            {...props}
        >
            {children}
        </select>
    );
};

export default Select;
