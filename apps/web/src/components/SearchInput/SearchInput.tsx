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
      </div>

      {showHint && <div className="SearchInput__hint">Enter at least 2 characters to search</div>}
    </div>
  );
}
