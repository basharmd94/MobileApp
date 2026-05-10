import React from 'react';

export interface IconBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  icon: React.ElementType;
  variant?: 'primary' | 'secondary-blue' | 'secondary-teal' | 'success' | 'error' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function IconBox({
  icon: Icon,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}: IconBoxProps) {
  const variants = {
    'primary': 'bg-primary/10 text-primary',
    'secondary-blue': 'bg-secondary-blue/10 text-secondary-blue',
    'secondary-teal': 'bg-secondary-teal/10 text-secondary-teal',
    'success': 'bg-success/10 text-success',
    'error': 'bg-error/10 text-error',
    'warning': 'bg-warning/10 text-warning',
  };

  const sizes = {
    'sm': 'w-7 h-7 rounded-lg [&>svg]:w-3.5 [&>svg]:h-3.5',
    'md': 'w-8 h-8 rounded-[10px] [&>svg]:w-4 [&>svg]:h-4',
    'lg': 'w-10 h-10 rounded-xl [&>svg]:w-5 [&>svg]:h-5',
  };

  return (
    <div className={`flex items-center justify-center shrink-0 ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      <Icon />
    </div>
  );
}
