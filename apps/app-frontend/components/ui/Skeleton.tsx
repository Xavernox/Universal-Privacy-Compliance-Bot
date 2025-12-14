import clsx from 'clsx';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  width = '100%',
  height = '1rem',
}: SkeletonProps) {
  return (
    <div
      className={clsx(
        'animate-pulse bg-neutral-200 dark:bg-neutral-700 rounded',
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

interface SkeletonCircleProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 80,
};

export function SkeletonCircle({ size = 'md', className }: SkeletonCircleProps) {
  const dimension = sizeMap[size];
  return (
    <Skeleton
      className={clsx('rounded-full', className)}
      width={dimension}
      height={dimension}
    />
  );
}
