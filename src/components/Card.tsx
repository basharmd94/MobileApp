import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  activeScale?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(({
  className = '',
  children,
  activeScale = false,
  ...props
}, ref) => {
  const activeStyles = activeScale ? "active:scale-[0.98] transition-all cursor-pointer" : "transition-shadow";
  
  return (
    <div
      ref={ref}
      className={`bg-white rounded-xl p-3 shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-ui-border/50 ${activeStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';
