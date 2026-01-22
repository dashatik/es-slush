import { esClient } from '../es.js';
import { config } from '../config.js';
import { SearchDocument, GroupedSearchResults, ChunkDocument, ChunkSearchResult, GroupedChunkResults } from '../types.js';
import type { estypes } from '@elastic/elasticsearch';

/*Search service - multi-entity discovery search with grouped results
v2: Chunk-based search with field collapsing and highlighting

Features:
- Fuzzy matching, keyword expansion (nordics/europe), stage normalization
- Results grouped by entity_type with relevance scoring within each group
- Filters use OR within same key, AND across different keys
- Field collapsing by entity_id for deduplication (one result per entity)
- Highlight snippets from content field with <mark> tags */

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

/* buildFilters - Constructs ES filter clauses from search parameters
Filter semantics:
- Multiple values within same key use OR (e.g., industry=fintech OR healthtech)
- Different keys combine with AND (e.g., industry=fintech AND country=FI)
- Returns array of bool/term queries to be used in bool.filter context */

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

/* buildQuery - Main ES query builder for discovery search (v2 chunk-based)
Query strategy:
1. Expands keywords (nordics→FI,SE,NO,DK) and normalizes stages (preseed→pre-seed)
2. Builds multi_match over chunk fields: name^5, title^3, content^1
3. Adds fuzzy matching (fuzziness: AUTO) for typo tolerance
4. Uses function_score to boost entity types matching query intent (e.g., "workshop" boosts events)
5. Optionally boosts header chunks (is_header_chunk:true) for better entity-level relevance
6. Combines with filters via bool query (must for scoring, filter for non-scoring constraints)
Returns: Complete ES query ready for esClient.search() */

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
          'name^5',
          'title^3',
          'content^1',
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
          'name^5',
          'title^3',
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

  functions.push({
    filter: { term: { is_header_chunk: true } },
    weight: 1.1,
  });

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

  return {
    function_score: {
      query: baseQuery,
      functions,
      boost_mode: 'multiply',
      score_mode: 'sum',
    },
  };
}

/* search - Entry point for discovery search across all entity types (v2 chunk-based)
Flow:
1. Validates query length (min 2 chars, else returns empty to avoid noise)
2. Builds ES query via buildQuery() with filters, boosts, and fuzzy matching
3. Executes against ES chunks alias (slush_chunks_current) with:
   - Field collapsing on entity_id (one result per entity)
   - Highlighting on content field with <mark> tags
4. Groups results by entity_type (startups, investors, people, events)
5. Returns grouped results with timing metadata and highlight snippets
Note: Returns up to 100 unique entities. Collapse ensures no duplicate entities. */

export async function search(params: SearchParams): Promise<GroupedChunkResults> {
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

  const response = await esClient.search<ChunkDocument>({
    index: config.esChunksAlias,
    query,
    size: 100,
    track_total_hits: true,
    collapse: {
      field: 'entity_id',
    },
    highlight: {
      pre_tags: ['<mark>'],
      post_tags: ['</mark>'],
      fields: {
        content: {
          fragment_size: 150,
          number_of_fragments: 1,
        },
      },
    },
  });

  const hits = response.hits.hits as SearchHit<ChunkDocument>[];

  const grouped: GroupedChunkResults = {
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

    const result: ChunkSearchResult = {
      ...doc,
      highlight: hit.highlight as { content?: string[] } | undefined,
      _score: hit._score ?? undefined,
    };

    switch (doc.entity_type) {
      case 'startup':
        grouped.startups.push(result);
        break;
      case 'investor':
        grouped.investors.push(result);
        break;
      case 'person':
        grouped.people.push(result);
        break;
      case 'event':
        grouped.events.push(result);
        break;
    }
  }

/* totalByType reflects counts of RETURNED results, not true index totals.
Why: ES collapse returns deduplicated hits but doesn't provide per-type
cardinality. track_total_hits gives total collapsed count, not breakdown.
For true totals, would need separate aggregation query (out of scope for v2).
Current behavior is correct for UI display: shows what user actually sees. */

  grouped.meta.totalByType = {
    startups: grouped.startups.length,
    investors: grouped.investors.length,
    people: grouped.people.length,
    events: grouped.events.length,
  };

  return grouped;
}
