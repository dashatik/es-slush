import { useEffect, useState } from 'react';
import './SearchInput.scss';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search startups, investors, people, events...',
}: SearchInputProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => setLocalValue(value), [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localValue !== value) onChange(localValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [localValue, value, onChange]);

  const showHint = localValue.length > 0 && localValue.length < 2;

  return (
    <div className="SearchInput">
      <div className="SearchInput__shell">
        <input
          className="SearchInput__input"
          type="text"
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder={placeholder}
          aria-label="Search"
        />

        {/* optional decorative “arrow” like your example card */}
        <span className="SearchInput__cornerIcon" aria-hidden="true">
            <defs>
              <linearGradient id="paint0_linear" x1="31.125" y1="24.1861" x2="26.0265" y2="-28.0004">
                <stop stopColor="#FAFAFA" />
                <stop offset="1" stopColor="#75FE72" />
              </linearGradient>
            </defs>
        </span>
      </div>

      {showHint && <div className="SearchInput__hint">Enter at least 2 characters to search</div>}
    </div>
  );
}
