import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  className = '',
  variant = 'primary',
  size = 'md',
  isLoading,
  children,
  disabled,
  ...props
}, ref) => {
  const baseStyles = "group relative inline-flex justify-center items-center overflow-hidden font-bold transition-all duration-300 focus:outline-none active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "text-white bg-gradient-to-r from-primary to-primary-hover hover:to-primary-dark shadow-md shadow-primary/30",
    secondary: "text-white bg-secondary-blue hover:bg-blue-700 shadow-md shadow-secondary-blue/20",
    outline: "border-2 border-ui-border text-text-main hover:bg-bg-base focus:ring-2 focus:ring-primary/20",
    ghost: "text-text-main hover:bg-bg-base/80 focus:ring-2 focus:ring-primary/20",
    danger: "text-error bg-error/10 hover:bg-error/20"
  };

  const sizes = {
    sm: "py-1.5 px-3 text-[11px] rounded-lg gap-1.5",
    md: "py-2.5 px-4 text-[13px] rounded-xl gap-2",
    lg: "py-3 px-5 text-sm rounded-xl gap-2",
    icon: "p-2 rounded-full justify-center w-8 h-8"
  };

  return (
    <button
      ref={ref}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin w-5 h-5 absolute" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      <span className={`inline-flex items-center gap-2 ${isLoading ? 'opacity-0' : 'opacity-100'}`}>
        {children}
      </span>
    </button>
  );
});

Button.displayName = 'Button';
