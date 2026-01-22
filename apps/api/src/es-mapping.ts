import type { estypes } from '@elastic/elasticsearch';

type IndicesIndexSettings = estypes.IndicesIndexSettings;
type MappingTypeMapping = estypes.MappingTypeMapping;

/*Custom settings with edge n-gram analyzer for prefix/autocomplete matching
Edge n-gram analyzer for prefix matching (autocomplete)
Search analyzer (no edge n-gram, just standard + lowercase)*/

export const indexSettings: IndicesIndexSettings = {
  number_of_shards: 1,
  number_of_replicas: 0,
  analysis: {
    analyzer: {
      edge_ngram_analyzer: {
        type: 'custom',
        tokenizer: 'standard',
        filter: ['lowercase', 'edge_ngram_filter'],
      },
      edge_ngram_search_analyzer: {
        type: 'custom',
        tokenizer: 'standard',
        filter: ['lowercase'],
      },
    },
    filter: {
      edge_ngram_filter: {
        type: 'edge_ngram',
        min_gram: 2,
        max_gram: 15,
      },
    },
  },
};

/* v2 Chunk-based index settings
Uses only built-in analyzers (no plugins like ICU)
Optimized for BM25 relevance on chunked text with highlighting */

export const chunkIndexSettings: IndicesIndexSettings = {
  number_of_shards: 1,
  number_of_replicas: 0,
  analysis: {
    analyzer: {
      slush_content_analyzer: {
        type: 'custom',
        tokenizer: 'standard',
        filter: ['lowercase', 'asciifolding'],
      },
      slush_name_analyzer: {
        type: 'custom',
        tokenizer: 'standard',
        filter: ['lowercase', 'asciifolding'],
      },
    },
  },
};

/* v2 Chunk document mapping
- entity_id: keyword for collapse/deduplication
- content: text with term_vector for fast highlighting
- name/title: text with custom analyzer for fuzzy matching
- Filter fields preserved for faceted search */

export const chunkMapping: MappingTypeMapping = {
  dynamic: 'strict',
  properties: {
    entity_id: { type: 'keyword' },
    entity_type: { type: 'keyword' },
    chunk_index: { type: 'integer' },
    is_header_chunk: { type: 'boolean' },
    name: {
      type: 'text',
      analyzer: 'slush_name_analyzer',
    },
    title: {
      type: 'text',
      analyzer: 'slush_name_analyzer',
    },
    content: {
      type: 'text',
      analyzer: 'slush_content_analyzer',
      term_vector: 'with_positions_offsets',
    },
    country: { type: 'keyword' },
    industries: { type: 'keyword' },
    topics: { type: 'keyword' },
    stage: { type: 'keyword' },
    event_type: { type: 'keyword' },
  },
};

export const entityMapping: MappingTypeMapping = {
  properties: {
    id: { type: 'keyword' },
    entity_type: { type: 'keyword' },
    name: {
      type: 'text',
      analyzer: 'standard',
      fields: {
        raw: { type: 'keyword' },
        en: { type: 'text', analyzer: 'english' },
        prefix: {
          type: 'text',
          analyzer: 'edge_ngram_analyzer',
          search_analyzer: 'edge_ngram_search_analyzer',
        },
      },
    },
    description: {
      type: 'text',
      fields: {
        en: { type: 'text', analyzer: 'english' },
        prefix: {
          type: 'text',
          analyzer: 'edge_ngram_analyzer',
          search_analyzer: 'edge_ngram_search_analyzer',
        },
      },
    },
    country: { type: 'keyword' },
    location: { type: 'keyword' },
    industries: { type: 'keyword' },
    industries_text: {
      type: 'text',
      fields: {
        en: { type: 'text', analyzer: 'english' },
        prefix: {
          type: 'text',
          analyzer: 'edge_ngram_analyzer',
          search_analyzer: 'edge_ngram_search_analyzer',
        },
      },
    },
    topics: { type: 'keyword' },
    topics_text: {
      type: 'text',
      fields: {
        en: { type: 'text', analyzer: 'english' },
        prefix: {
          type: 'text',
          analyzer: 'edge_ngram_analyzer',
          search_analyzer: 'edge_ngram_search_analyzer',
        },
      },
    },
    stage: { type: 'keyword' },
    role_title: {
      type: 'text',
      fields: {
        raw: { type: 'keyword' },
        en: { type: 'text', analyzer: 'english' },
        prefix: {
          type: 'text',
          analyzer: 'edge_ngram_analyzer',
          search_analyzer: 'edge_ngram_search_analyzer',
        },
      },
    },
    company_name: {
      type: 'text',
      fields: {
        raw: { type: 'keyword' },
        en: { type: 'text', analyzer: 'english' },
        prefix: {
          type: 'text',
          analyzer: 'edge_ngram_analyzer',
          search_analyzer: 'edge_ngram_search_analyzer',
        },
      },
    },
    event_type: { type: 'keyword' },
    speakers: { type: 'text' },
    speakers_text: {
      type: 'text',
      fields: {
        en: { type: 'text', analyzer: 'english' },
        prefix: {
          type: 'text',
          analyzer: 'edge_ngram_analyzer',
          search_analyzer: 'edge_ngram_search_analyzer',
        },
      },
    },
  },
};
