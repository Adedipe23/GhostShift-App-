import { cn } from '../../utils/cn';

export const Badge = ({ children, variant = 'primary', className }) => {
  const variants = {
    primary: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300',
    success: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent",
      variants[variant],
      className
    )}>
      {children}
    </span>
  );
};
