import clsx from 'clsx';
import { ReactNode } from 'react';

interface TableProps {
  children: ReactNode;
  className?: string;
}

export function Table({ children, className }: TableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-neutral-200 dark:border-neutral-800">
      <table className={clsx('w-full border-collapse', className)}>{children}</table>
    </div>
  );
}

interface TableHeadProps {
  children: ReactNode;
  className?: string;
}

export function TableHead({ children, className }: TableHeadProps) {
  return (
    <thead
      className={clsx(
        'bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700',
        className
      )}
    >
      {children}
    </thead>
  );
}

interface TableBodyProps {
  children: ReactNode;
  className?: string;
}

export function TableBody({ children, className }: TableBodyProps) {
  return <tbody className={className}>{children}</tbody>;
}

interface TableRowProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function TableRow({ children, className, hover = true }: TableRowProps) {
  return (
    <tr
      className={clsx(
        'border-b border-neutral-200 dark:border-neutral-700 transition-colors',
        hover && 'hover:bg-neutral-50 dark:hover:bg-neutral-800',
        className
      )}
    >
      {children}
    </tr>
  );
}

interface TableHeaderProps {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export function TableHeader({ children, className, align = 'left' }: TableHeaderProps) {
  return (
    <th
      className={clsx(
        'px-4 py-3 text-sm font-semibold text-neutral-900 dark:text-neutral-50',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className
      )}
    >
      {children}
    </th>
  );
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export function TableCell({ children, className, align = 'left' }: TableCellProps) {
  return (
    <td
      className={clsx(
        'px-4 py-3 text-sm text-neutral-700 dark:text-neutral-300',
        align === 'center' && 'text-center',
        align === 'right' && 'text-right',
        className
      )}
    >
      {children}
    </td>
  );
}
