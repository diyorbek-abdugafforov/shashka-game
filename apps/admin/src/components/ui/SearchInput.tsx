import React, { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  placeholder = 'Qidirish...',
  debounceMs = 300,
  className,
}) => {
  const [internalValue, setInternalValue] = useState(value);

  // Sync internal state with external value if external value changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  // Debounced effect
  useEffect(() => {
    const handler = setTimeout(() => {
      if (internalValue !== value) {
        onChange(internalValue);
      }
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [internalValue, debounceMs, onChange, value]);

  const handleClear = () => {
    setInternalValue('');
    onChange('');
  };

  return (
    <div className={cn('relative flex items-center', className)}>
      <Search className="w-4 h-4 absolute left-3 text-zinc-500 pointer-events-none" />
      <input
        type="text"
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        placeholder={placeholder}
        className="w-full h-9 pl-9 pr-8 bg-zinc-900/90 text-sm text-zinc-100 placeholder-zinc-500 border border-zinc-700/80 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/80 transition-colors"
      />
      {internalValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Tozalash"
          className="absolute right-2.5 p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};
