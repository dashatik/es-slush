/* v1 SearchDocument - kept for backwards compatibility */
export interface SearchDocument {
  id: string;
  entity_type: 'startup' | 'investor' | 'person' | 'event';
  name: string;
  description: string | null;
  country: string | null;
  location: string | null;
  industries: string[];
  industries_text: string;
  topics: string[];
  topics_text: string;
  stage: string | null;
  role_title: string | null;
  company_name: string | null;
  event_type: string | null;
  speakers: string[];
  speakers_text: string;
}

/* v2 ChunkSearchResult - chunk-based document with highlight support */
export interface ChunkSearchResult {
  entity_id: string;
  entity_type: 'startup' | 'investor' | 'person' | 'event';
  chunk_index: number;
  is_header_chunk: boolean;
  name: string;
  title: string;
  content: string;
  country: string | null;
  industries: string[];
  topics: string[];
  stage: string | null;
  event_type: string | null;
  highlight?: {
    content?: string[];
  };
  _score?: number;
}

/* v2 GroupedChunkResults - grouped results with highlights */
export interface GroupedChunkResults {
  startups: ChunkSearchResult[];
  investors: ChunkSearchResult[];
  people: ChunkSearchResult[];
  events: ChunkSearchResult[];
  meta: {
    tookMs: number;
    totalByType: {
      startups: number;
      investors: number;
      people: number;
      events: number;
    };
  };
}

export interface GroupedSearchResults {
  startups: SearchDocument[];
  investors: SearchDocument[];
  people: SearchDocument[];
  events: SearchDocument[];
  meta: {
    tookMs: number;
    totalByType: {
      startups: number;
      investors: number;
      people: number;
      events: number;
    };
  };
}

export interface FacetsResponse {
  industries: string[];
  countries: string[];
  stages: string[];
}

export interface SearchFilters {
  type?: string;
  industries: string[];
  countries: string[];
  stages: string[];
}
