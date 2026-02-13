import { ChangeEvent } from 'react';

type Props = {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  placeholder?: string;
};

export function CurrencyInput({ value, onChange, className = '', placeholder }: Props) {
  const displayValue = value > 0 ? value.toLocaleString('en-US') : '';

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9]/g, '');
    onChange(raw ? parseInt(raw, 10) : 0);
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium select-none">$</span>
      <input
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        className={`pl-7 ${className}`}
        placeholder={placeholder || '0'}
      />
    </div>
  );
}
