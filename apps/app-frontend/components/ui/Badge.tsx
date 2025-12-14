import clsx from 'clsx';
import { ReactNode } from 'react';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md' | 'lg';

interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  primary: 'bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-100',
  secondary: 'bg-secondary-100 dark:bg-secondary-900 text-secondary-800 dark:text-secondary-100',
  success: 'bg-success-100 dark:bg-green-900 text-success-800 dark:text-green-100',
  warning: 'bg-warning-100 dark:bg-yellow-900 text-warning-800 dark:text-yellow-100',
  error: 'bg-error-100 dark:bg-red-900 text-error-800 dark:text-red-100',
  info: 'bg-info-100 dark:bg-blue-900 text-info-800 dark:text-blue-100',
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: 'px-2 py-1 text-xs font-medium rounded',
  md: 'px-3 py-1.5 text-sm font-medium rounded-md',
  lg: 'px-4 py-2 text-base font-medium rounded-lg',
};

export function Badge({
  children,
  variant = 'primary',
  size = 'md',
  className,
}: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-block font-medium transition-colors duration-200',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {children}
    </span>
  );
}
