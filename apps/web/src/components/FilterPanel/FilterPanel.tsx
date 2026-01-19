import { useState } from 'react';
import { FacetsResponse, SearchFilters } from '../../types';
import './FilterPanel.scss';

function capitalize(str: string): string {
  const formatted = str.replace(/_/g, ' ');
  return formatted.charAt(0).toUpperCase() + formatted.slice(1).toLowerCase();
}

interface FilterPanelProps {
  facets: FacetsResponse | null;
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
}

export function FilterPanel({ facets, filters, onFiltersChange }: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!facets) {
    return <div className="filterPanel__loading">Loading filters...</div>;
  }

  const handleTypeChange = (type: string) => {
    onFiltersChange({
      ...filters,
      type: filters.type === type ? undefined : type,
    });
  };

  const handleMultiSelect = (key: 'industries' | 'countries' | 'stages', value: string) => {
    const current = filters[key];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [key]: updated });
  };

  const entityTypes = ['startup', 'investor', 'person', 'event'];

  const activeFilterCount =
    (filters.type ? 1 : 0) +
    filters.industries.length +
    filters.countries.length +
    filters.stages.length;

  return (
    <div className={`filterPanel ${isExpanded ? 'filterPanel--expanded' : ''}`}>
      <button
        type="button"
        className="filterPanel__toggle"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="filter-content"
      >
        <span className="filterPanel__toggleText">
          Filters
          {activeFilterCount > 0 && (
            <span className="filterPanel__badge">{activeFilterCount}</span>
          )}
        </span>
        <svg
          className="filterPanel__toggleIcon"
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div className="filterPanel__content" id="filter-content">
        <div className="filterPanel__section">
          <div className="filterPanel__label">Type</div>
          <div className="filterPanel__chips">
            {entityTypes.map((type) => {
              const active = filters.type === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => handleTypeChange(type)}
                  className={`filterPanel__chip ${active ? 'filterPanel__chip--active' : ''}`}
                >
                  {capitalize(type)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="filterPanel__section">
          <div className="filterPanel__label">Industry</div>
          <div className="filterPanel__chips">
            {facets.industries.map((ind) => {
              const active = filters.industries.includes(ind);
              return (
                <button
                  key={ind}
                  type="button"
                  onClick={() => handleMultiSelect('industries', ind)}
                  className={`filterPanel__chip ${active ? 'filterPanel__chip--active' : ''}`}
                >
                  {capitalize(ind)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="filterPanel__section">
          <div className="filterPanel__label">Country</div>
          <div className="filterPanel__chips">
            {facets.countries.map((country) => {
              const active = filters.countries.includes(country);
              return (
                <button
                  key={country}
                  type="button"
                  onClick={() => handleMultiSelect('countries', country)}
                  className={`filterPanel__chip ${active ? 'filterPanel__chip--active' : ''}`}
                >
                  {country.toLowerCase()}
                </button>
              );
            })}
          </div>
        </div>

        <div className="filterPanel__section">
          <div className="filterPanel__label">Stage</div>
          <div className="filterPanel__chips">
            {facets.stages.map((stage) => {
              const active = filters.stages.includes(stage);
              return (
                <button
                  key={stage}
                  type="button"
                  onClick={() => handleMultiSelect('stages', stage)}
                  className={`filterPanel__chip ${active ? 'filterPanel__chip--active' : ''}`}
                >
                  {capitalize(stage)}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
