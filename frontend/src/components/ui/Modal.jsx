import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export const Modal = ({ isOpen, onClose, title, children, className }) => {
  const overlayRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        ref={overlayRef}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className={cn(
        "relative w-full max-w-lg rounded-2xl glass-card p-6 shadow-2xl animate-slide-up",
        className
      )}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-500 hover:bg-slate-100 dark:hover:bg-dark-surface transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div>
          {children}
        </div>
      </div>
    </div>
  );
};
