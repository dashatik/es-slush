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
