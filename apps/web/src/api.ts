import { GroupedSearchResults, FacetsResponse, SearchFilters } from './types';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export async function fetchSearch(
  query: string,
  filters: SearchFilters
): Promise<GroupedSearchResults> {
  const params = new URLSearchParams();

  if (query) {
    params.set('q', query);
  }

  if (filters.type) {
    params.set('type', filters.type);
  }

  for (const industry of filters.industries) {
    params.append('industry', industry);
  }

  for (const country of filters.countries) {
    params.append('country', country);
  }

  for (const stage of filters.stages) {
    params.append('stage', stage);
  }

  const response = await fetch(`${API_BASE}/search?${params.toString()}`);

  if (!response.ok) {
    throw new Error(`Search failed: ${response.statusText}`);
  }

  return response.json();
}

export async function fetchFacets(): Promise<FacetsResponse> {
  const response = await fetch(`${API_BASE}/facets`);

  if (!response.ok) {
    throw new Error(`Facets fetch failed: ${response.statusText}`);
  }

  return response.json();
}
