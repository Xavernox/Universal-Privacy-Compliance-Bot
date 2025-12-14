import clsx from 'clsx';

type SpinnerSize = 'sm' | 'md' | 'lg' | 'xl';

interface LoadingSpinnerProps {
  size?: SpinnerSize;
  className?: string;
  variant?: 'primary' | 'secondary' | 'white';
}

const sizeMap: Record<SpinnerSize, { outer: string; inner: string }> = {
  sm: { outer: 'w-4 h-4', inner: 'border-2' },
  md: { outer: 'w-6 h-6', inner: 'border-2' },
  lg: { outer: 'w-8 h-8', inner: 'border-4' },
  xl: { outer: 'w-12 h-12', inner: 'border-4' },
};

const variantMap: Record<string, string> = {
  primary: 'border-primary-300 dark:border-primary-700 border-t-primary-600 dark:border-t-primary-400',
  secondary: 'border-secondary-300 dark:border-secondary-700 border-t-secondary-600 dark:border-t-secondary-400',
  white: 'border-white/30 border-t-white',
};

export function LoadingSpinner({
  size = 'md',
  variant = 'primary',
  className,
}: LoadingSpinnerProps) {
  const { outer, inner } = sizeMap[size];

  return (
    <div className={clsx('flex items-center justify-center', className)}>
      <div
        className={clsx(
          outer,
          inner,
          'rounded-full animate-spin',
          variantMap[variant]
        )}
      />
    </div>
  );
}
