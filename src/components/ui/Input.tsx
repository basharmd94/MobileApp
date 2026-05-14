import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, helperText, rightElement, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <div className="flex items-center justify-between mb-1.5 ml-1 mr-1">
            <label className="block text-xs font-semibold text-text-main">{label}</label>
            {rightElement}
          </div>
        )}
        <input
          ref={ref}
          className={`appearance-none block w-full px-3 py-2.5 border rounded-xl text-text-main placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-300 bg-white shadow-sm text-sm ${
            error 
              ? 'border-error focus:border-error focus:ring-error/20' 
              : 'border-ui-border focus:border-primary'
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1.5 text-xs font-medium text-error ml-1">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-xs text-text-muted ml-1">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
