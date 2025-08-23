'use client';

import { useState } from 'react';

interface NumericInputProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  label: string;
  suffix?: string;
  className?: string;
}

export default function NumericInput({
  value,
  onChange,
  min,
  max,
  label,
  suffix = '',
  className = ''
}: NumericInputProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());

  const handleClick = () => {
    setIsEditing(true);
    setInputValue(value.toString());
  };

  const handleBlur = () => {
    setIsEditing(false);
    const numValue = parseInt(inputValue);
    if (!isNaN(numValue)) {
      const clampedValue = Math.max(min, Math.min(max, numValue));
      onChange(clampedValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue(value.toString());
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {label}
        </label>
        {isEditing ? (
          <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-12 px-1 py-0.5 text-xs text-center rounded border flex-shrink-0"
            style={{
              backgroundColor: 'var(--surface-light)',
              borderColor: 'var(--border)',
              color: 'var(--text-primary)'
            }}
          />
        ) : (
          <button
            onClick={handleClick}
            className="w-12 px-1 py-0.5 text-xs text-center rounded hover:shadow-sm transition-colors flex-shrink-0"
            style={{
              backgroundColor: 'var(--surface-light)',
              color: 'var(--text-secondary)',
              border: `1px solid var(--border)`
            }}
            title="Click to edit"
          >
            {value}{suffix}
          </button>
        )}
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-lg appearance-none"
        style={{
          backgroundColor: 'var(--surface-dark)',
          accentColor: 'var(--surface-lighter)',
        }}
      />
    </div>
  );
}