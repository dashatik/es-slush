import { useState, useEffect, useCallback } from 'react';
import { SearchInput } from './components/SearchInput/SearchInput';
import { FilterPanel } from './components/FilterPanel/FilterPanel';
import { ResultsGroup } from './components/ResultsGroup/ResultsGroup';
import { EntityDetail } from './components/EntityDetail/EntityDetail';
import { fetchSearch, fetchFacets } from './api';
import { GroupedChunkResults, FacetsResponse, SearchFilters } from './types';
import './App.scss';

const initialFilters: SearchFilters = {
  type: undefined,
  industries: [],
  countries: [],
  stages: [],
};

function App() {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [results, setResults] = useState<GroupedChunkResults | null>(null);
  const [facets, setFacets] = useState<FacetsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);

  useEffect(() => {
    fetchFacets()
      .then(setFacets)
      .catch((err) => console.error('Failed to load facets:', err));
  }, []);

  const performSearch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchSearch(query, filters);
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, [query, filters]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const totalResults = results
    ? results.meta.totalByType.startups +
      results.meta.totalByType.investors +
      results.meta.totalByType.people +
      results.meta.totalByType.events
    : 0;

  const hasActiveFilters =
    filters.type ||
    filters.industries.length > 0 ||
    filters.countries.length > 0 ||
    filters.stages.length > 0;

  const handleEntityClick = (entityId: string) => {
    setSelectedEntityId(entityId);
  };

  const handleBackToSearch = () => {
    setSelectedEntityId(null);
  };

  if (selectedEntityId) {
    return (
      <div className="app">
        <header className="appHeader">
          <h1 className="appTitle">Slush Discovery Search</h1>
          <p className="appSubtitle">Find startups, investors, people, and events</p>
        </header>

        <main className="appMain appMain--detail">
          <EntityDetail
            entityId={selectedEntityId}
            onBack={handleBackToSearch}
            onEntityClick={handleEntityClick}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="appHeader">
        <h1 className="appTitle">Slush Discovery Search</h1>
        <p className="appSubtitle">Find startups, investors, people, and events</p>
      </header>

      <main className="appMain">
        <aside className="sidebar">
          <FilterPanel facets={facets} filters={filters} onFiltersChange={setFilters} />
        </aside>

        <section className="content">
          <SearchInput value={query} onChange={setQuery} />

          {loading && <div className="status">Searching...</div>}

          {error && <div className="error">{error}</div>}

          {!loading && !error && results && (
            <>
              <div className="resultsMeta">
                {totalResults} result{totalResults !== 1 ? 's' : ''}
                {results.meta.tookMs ? ` in ${results.meta.tookMs}ms` : ''}
                {hasActiveFilters ? ' (filtered)' : ''}
              </div>

              {totalResults === 0 ? (
                <div className="emptyState">
                  No results found.{' '}
                  {query.length > 0 && query.length < 2
                    ? 'Enter at least 2 characters to search.'
                    : 'Try adjusting your search or filters.'}
                </div>
              ) : (
                <div className="results">
                  <ResultsGroup
                    title="Startups"
                    entities={results.startups}
                    count={results.meta.totalByType.startups}
                    onEntityClick={handleEntityClick}
                  />
                  <ResultsGroup
                    title="Investors"
                    entities={results.investors}
                    count={results.meta.totalByType.investors}
                    onEntityClick={handleEntityClick}
                  />
                  <ResultsGroup
                    title="People"
                    entities={results.people}
                    count={results.meta.totalByType.people}
                    onEntityClick={handleEntityClick}
                  />
                  <ResultsGroup
                    title="Events"
                    entities={results.events}
                    count={results.meta.totalByType.events}
                    onEntityClick={handleEntityClick}
                  />
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}


export default App;
