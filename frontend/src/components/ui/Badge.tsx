import { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variantStyles = {
    default: 'bg-gray-100 text-gray-900',
    success: 'bg-gray-100 text-gray-900',
    warning: 'bg-gray-100 text-gray-900',
    danger: 'bg-gray-100 text-gray-900',
    info: 'bg-gray-100 text-gray-900',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}
