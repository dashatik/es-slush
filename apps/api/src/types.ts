export interface Entity {
  id: string;
  entity_type: 'startup' | 'investor' | 'person' | 'event';
  name: string;
  description: string | null;
  country: string | null;
  location: string | null;
  industries: string[];
  topics: string[];
  stage: string | null;
  role_title: string | null;
  company_name: string | null;
  event_type: string | null;
  speakers: string[];
  active_2026: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface SearchDocument {
  id: string;
  entity_type: string;
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

/* ChunkDocument - v2 chunk-based ES document model
Each entity is split into multiple chunks for better BM25 relevance on long text.
Chunks are collapsed by entity_id at query time to deduplicate results.
Fields duplicated across chunks: entity_id, entity_type, name, title
Fields unique per chunk: chunk_index, is_header_chunk, content */

export interface ChunkDocument {
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
}

/* ChunkSearchResult - Search result with highlight support
Extends ChunkDocument with optional highlight from ES */

export interface ChunkSearchResult extends ChunkDocument {
  highlight?: {
    content?: string[];
  };
  _score?: number;
}

/* GroupedChunkResults - grouped search response with highlights */

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
