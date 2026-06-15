import { AlertCircle } from 'lucide-react';

export const ErrorState = ({ message = 'An error occurred. Please try again.', className }) => {
  return (
    <div className={`flex flex-col items-center justify-center py-8 text-center ${className}`}>
      <AlertCircle className="h-10 w-10 text-error mb-3 opacity-80" />
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{message}</p>
    </div>
  );
};
