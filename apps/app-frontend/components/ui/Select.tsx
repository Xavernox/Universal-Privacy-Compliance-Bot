import clsx from 'clsx';
import { forwardRef, SelectHTMLAttributes, ReactNode } from 'react';

interface SelectOption {
  value: string;
  label: ReactNode;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, placeholder, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-neutral-900 dark:text-neutral-50 mb-2">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={clsx(
            'w-full px-4 py-2 text-base rounded-lg border transition-colors duration-200',
            'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-50',
            'border-neutral-300 dark:border-neutral-600',
            'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
            'dark:focus:ring-primary-600 dark:focus:border-primary-600',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'appearance-none',
            error && 'border-error-500 focus:ring-error-500 focus:border-error-500',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-error-600 dark:text-error-400">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
