import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Input = React.forwardRef(({ className, label, error, helperText, id, type = 'text', ...props }, ref) => {
  const inputId = id || Math.random().toString(36).substring(7);
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === 'password';

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          type={isPasswordType && showPassword ? 'text' : type}
          className={cn(
            "w-full rounded-lg bg-white dark:bg-dark-surface border px-4 py-2 outline-none transition-all duration-200",
            "text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500",
            "focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500",
            error 
              ? "border-error focus:border-error focus:ring-error/20" 
              : "border-slate-300 dark:border-dark-border",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            isPasswordType && "pr-10",
            className
          )}
          {...props}
        />
        {isPasswordType && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 focus:outline-none"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-error animate-fade-in">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
