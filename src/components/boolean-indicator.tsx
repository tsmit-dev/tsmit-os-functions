import React from 'react';
import { cn } from '@/lib/utils';

interface BooleanIndicatorProps {
  value: boolean;
  className?: string;
}

export const BooleanIndicator: React.FC<BooleanIndicatorProps> = ({ value, className }) => {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div
        className={cn('h-3 w-3 rounded-full', {
          'bg-green-500': value,
          'bg-red-500': !value,
        })}
      />
    </div>
  );
};
