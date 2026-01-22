export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || 'postgres://slush:slush@localhost:5432/slush',
  elasticsearchUrl: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',

  esAlias: process.env.ES_ALIAS || 'slush_entities_current',
  esIndex2026: process.env.ES_INDEX_2026 || 'slush_entities_2026_v1'
  ,
  esChunksAlias: process.env.ES_CHUNKS_ALIAS || 'slush_chunks_current',
  esChunksIndex: process.env.ES_CHUNKS_INDEX || 'slush_chunks_v2',
  adminToken: process.env.ADMIN_TOKEN,
};
