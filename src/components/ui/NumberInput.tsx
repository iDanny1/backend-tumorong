import React from 'react';
import { cn, formatNumber, parseNumber } from '../../lib/utils';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (value: number) => void;
  className?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({ 
  value, 
  onChange, 
  className, 
  ...props 
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseNumber(rawValue);
    onChange(numericValue);
  };

  return (
    <input
      {...props}
      type="text"
      inputMode="numeric"
      className={cn(
        "w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all font-bold",
        className
      )}
      value={formatNumber(value)}
      onChange={handleChange}
    />
  );
};
