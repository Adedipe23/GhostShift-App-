import React from 'react';
import { cn } from '../../utils/cn';

export const Card = ({ className, children, ...props }) => {
  return (
    <div 
      className={cn(
        "glass-card rounded-xl p-6 transition-all duration-300",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
