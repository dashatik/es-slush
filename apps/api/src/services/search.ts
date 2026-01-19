import { esClient } from '../es.js';
import { config } from '../config.js';
import { SearchDocument, GroupedSearchResults } from '../types.js';
import type { estypes } from '@elastic/elasticsearch';

/*Search service - multi-entity discovery search with grouped results
Supports fuzzy matching, keyword expansion (nordics/europe), stage normalization
Results grouped by entity_type with relevance scoring within each group
Filters use OR within same key, AND across different keys*/

type QueryDslQueryContainer = estypes.QueryDslQueryContainer;
type QueryDslFunctionScoreContainer = estypes.QueryDslFunctionScoreContainer;
type SearchHit<T> = estypes.SearchHit<T>;

interface SearchParams {
  q?: string;
  type?: string;
  industry?: string | string[];
  country?: string | string[];
  stage?: string | string[];
}

function toArray(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

const NORDICS_COUNTRIES = ['FI', 'SE', 'NO', 'DK'];
const KNOWN_STAGES = ['pre-seed', 'preseed', 'seed', 'series-a', 'series-b', 'series-c'];

function normalizeStage(term: string): string | null {
  const lower = term.toLowerCase();
  if (lower === 'preseed') return 'pre-seed';
  if (KNOWN_STAGES.includes(lower)) return lower;
  return null;
}

function expandQuery(q: string): { query: string; expandedCountries: string[] } {
  const lower = q.toLowerCase();
  const expandedCountries: string[] = [];

  if (lower.includes('nordic') || lower.includes('nordics')) {
    expandedCountries.push(...NORDICS_COUNTRIES);
  }

  if (lower.includes('europe') || lower.includes('european')) {
    expandedCountries.push('FI', 'SE', 'NO', 'DE');
  }

  return { query: q, expandedCountries };
}

function buildFilters(params: SearchParams): QueryDslQueryContainer[] {
  const filters: QueryDslQueryContainer[] = [];

  if (params.type) {
    filters.push({ term: { entity_type: params.type } });
  }

  const industries = toArray(params.industry);
  if (industries.length > 0) {
    filters.push({
      bool: {
        should: industries.map((ind) => ({ term: { industries: ind } })),
        minimum_should_match: 1,
      },
    });
  }

  const countries = toArray(params.country);
  if (countries.length > 0) {
    filters.push({
      bool: {
        should: countries.map((c) => ({ term: { country: c } })),
        minimum_should_match: 1,
      },
    });
  }

  const stages = toArray(params.stage);
  if (stages.length > 0) {
    filters.push({
      bool: {
        should: stages.map((s) => ({ term: { stage: s } })),
        minimum_should_match: 1,
      },
    });
  }

  return filters;
}

function buildQuery(params: SearchParams): QueryDslQueryContainer {
  const filters = buildFilters(params);
  const q = params.q?.trim();

  if (!q) {
    if (filters.length === 0) {
      return { match_all: {} };
    }
    return {
      bool: {
        filter: filters,
      },
    };
  }

  if (q.length < 2) {
    return {
      bool: {
        must: [{ match_none: {} }],
      },
    };
  }

  const { expandedCountries } = expandQuery(q);
  const queryTerms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const normalizedTerms = queryTerms.map((t) => t.replace(/-/g, '_'));

  const should: QueryDslQueryContainer[] = [
    {
      multi_match: {
        query: q,
        fields: [
          'name^4',
          'name.en^3',
          'name.prefix^2',
          'industries_text^3',
          'industries_text.en^2',
          'industries_text.prefix^1.5',
          'topics_text^3',
          'topics_text.en^2',
          'topics_text.prefix^1.5',
          'role_title^2',
          'role_title.en^1.5',
          'role_title.prefix^1',
          'company_name^2',
          'company_name.en^1.5',
          'company_name.prefix^1',
          'speakers_text^2',
          'speakers_text.en^1.5',
          'speakers_text.prefix^1',
          'description^1',
          'description.en^0.8',
          'description.prefix^0.5',
        ],
        type: 'best_fields',
        operator: 'or',
      },
    },
    {
      match_phrase: {
        name: {
          query: q,
          boost: 6,
        },
      },
    },
    {
      multi_match: {
        query: q,
        fields: [
          'name^4',
          'name.en^3',
          'role_title^2',
          'role_title.en^1.5',
          'company_name^2',
          'company_name.en^1.5',
          'speakers_text^2',
          'speakers_text.en^1.5',
        ],
        type: 'best_fields',
        fuzziness: 'AUTO:4,6',
      },
    },
    ...normalizedTerms.map((term) => ({
      term: {
        industries: {
          value: term,
          boost: 3,
        },
      },
    })),
    ...normalizedTerms.map((term) => ({
      term: {
        topics: {
          value: term,
          boost: 3,
        },
      },
    })),
    ...queryTerms
      .map((term) => normalizeStage(term))
      .filter((stage): stage is string => stage !== null)
      .map((stage) => ({
        term: {
          stage: {
            value: stage,
            boost: 10,
          },
        },
      })),
    ...queryTerms.map((term) => ({
      term: {
        country: {
          value: term.toUpperCase(),
          boost: 2,
        },
      },
    })),
    ...queryTerms.map((term) => ({
      term: {
        event_type: {
          value: term,
          boost: 2,
        },
      },
    })),
  ];

  if (expandedCountries.length > 0) {
    should.push({
      terms: {
        country: expandedCountries,
        boost: 2,
      },
    });
  }

  const baseQuery: QueryDslQueryContainer = {
    bool: {
      should,
      minimum_should_match: 1,
      ...(filters.length > 0 ? { filter: filters } : {}),
    },
  };

  const functions: QueryDslFunctionScoreContainer[] = [];

  if (queryTerms.some((t) => ['founder', 'ceo', 'partner', 'engineer', 'investor'].includes(t))) {
    functions.push({
      filter: { term: { entity_type: 'person' } },
      weight: 2,
    });
  }

  if (queryTerms.some((t) => t.includes('investor'))) {
    functions.push({
      filter: { term: { entity_type: 'investor' } },
      weight: 2,
    });
  }

  if (queryTerms.some((t) => t.includes('startup'))) {
    functions.push({
      filter: { term: { entity_type: 'startup' } },
      weight: 2,
    });
  }

  if (queryTerms.some((t) => ['workshop', 'talk', 'event'].includes(t))) {
    functions.push({
      filter: { term: { entity_type: 'event' } },
      weight: 2,
    });
  }

  if (functions.length === 0) {
    return baseQuery;
  }

  return {
    function_score: {
      query: baseQuery,
      functions,
      boost_mode: 'multiply',
      score_mode: 'sum',
    },
  };
}

export async function search(params: SearchParams): Promise<GroupedSearchResults> {
  const startTime = Date.now();
  const q = params.q?.trim();

  if (q && q.length < 2) {
    return {
      startups: [],
      investors: [],
      people: [],
      events: [],
      meta: {
        tookMs: Date.now() - startTime,
        totalByType: { startups: 0, investors: 0, people: 0, events: 0 },
      },
    };
  }

  const query = buildQuery(params);

  const response = await esClient.search<SearchDocument>({
    index: config.esAlias,
    query,
    size: 100,
    track_total_hits: true,
  });

  const hits = response.hits.hits as SearchHit<SearchDocument>[];

  const grouped: GroupedSearchResults = {
    startups: [],
    investors: [],
    people: [],
    events: [],
    meta: {
      tookMs: Date.now() - startTime,
      totalByType: { startups: 0, investors: 0, people: 0, events: 0 },
    },
  };

  for (const hit of hits) {
    if (!hit._source) continue;
    const doc = hit._source;

    switch (doc.entity_type) {
      case 'startup':
        grouped.startups.push(doc);
        break;
      case 'investor':
        grouped.investors.push(doc);
        break;
      case 'person':
        grouped.people.push(doc);
        break;
      case 'event':
        grouped.events.push(doc);
        break;
    }
  }

  grouped.meta.totalByType = {
    startups: grouped.startups.length,
    investors: grouped.investors.length,
    people: grouped.people.length,
    events: grouped.events.length,
  };

  return grouped;
}
