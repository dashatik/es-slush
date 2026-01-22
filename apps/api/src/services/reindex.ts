import { pool } from '../db.js';
import { esClient } from '../es.js';
import { config } from '../config.js';
import { entityMapping, indexSettings, chunkMapping, chunkIndexSettings } from '../es-mapping.js';
import { Entity, SearchDocument, ChunkDocument } from '../types.js';
import { splitToChunks, buildTitle } from './chunking.js';

/*Reindex service - rebuilds ES projection from Postgres with zero-downtime
Uses Postgres advisory lock to prevent concurrent runs
Atomic alias swap ensures search never sees partial data
Old indices are cleaned up after successful swap

v2: Chunk-based indexing for better BM25 relevance and highlighting
- Each entity is split into multiple chunk documents
- Deterministic IDs: ${entity_id}_${chunk_index} for idempotent reindex
- Field collapsing at query time deduplicates results */

const REINDEX_LOCK_ID = 42;
const BULK_BATCH_SIZE = 500;

/* entityToSearchDocument - Transforms Postgres entity to ES document (v1 format)
Derives searchable text fields from arrays:
- industries_text: "fintech healthtech" (underscores replaced with spaces)
- topics_text: "machine learning climate" (for full-text search)
- speakers_text: "John Doe Jane Smith" (for event speaker search)
This denormalization enables multi-field search without runtime joins. */

function entityToSearchDocument(entity: Entity): SearchDocument {
  return {
    id: entity.id,
    entity_type: entity.entity_type,
    name: entity.name,
    description: entity.description,
    country: entity.country,
    location: entity.location,
    industries: entity.industries,
    industries_text: entity.industries.join(' ').replace(/_/g, ' '),
    topics: entity.topics,
    topics_text: entity.topics.join(' ').replace(/_/g, ' '),
    stage: entity.stage,
    role_title: entity.role_title,
    company_name: entity.company_name,
    event_type: entity.event_type,
    speakers: entity.speakers,
    speakers_text: entity.speakers.join(' '),
  };
}

/* entityToChunkDocuments - Transforms entity to chunk documents (v2 format)
Splits description into overlapping chunks for BM25 optimization.
Each chunk contains:
- Duplicated fields: entity_id, entity_type, name, title (for collapse/display)
- Unique fields: chunk_index, is_header_chunk, content
- Filter fields: country, industries, topics, stage, event_type (for faceted search) */

function entityToChunkDocuments(entity: Entity): ChunkDocument[] {
  const title = buildTitle(entity);
  const textToChunk = entity.description || '';

  const textChunks = splitToChunks(textToChunk);

/* Header-only entities (no description):
- Still participate in search via a single header chunk
- content = title ensures name/title matching works
- is_header_chunk: true receives mild boost from function_score
- Guarantees every entity has at least one searchable document */

  if (textChunks.length === 0) {
    return [{
      entity_id: entity.id,
      entity_type: entity.entity_type,
      chunk_index: 0,
      is_header_chunk: true,
      name: entity.name,
      title: title,
      content: title,
      country: entity.country,
      industries: entity.industries,
      topics: entity.topics,
      stage: entity.stage,
      event_type: entity.event_type,
    }];
  }

  return textChunks.map((chunk) => ({
    entity_id: entity.id,
    entity_type: entity.entity_type,
    chunk_index: chunk.index,
    is_header_chunk: chunk.isHeader,
    name: entity.name,
    title: title,
    content: chunk.content,
    country: entity.country,
    industries: entity.industries,
    topics: entity.topics,
    stage: entity.stage,
    event_type: entity.event_type,
  }));
}

export class ReindexAlreadyRunningError extends Error {
  constructor() {
    super('Reindex is already in progress');
    this.name = 'ReindexAlreadyRunningError';
  }
}

/* reindex - Rebuilds ES search index from Postgres with zero-downtime (v2 chunk-based)
Execution flow:
1. Acquire Postgres advisory lock (prevents concurrent runs, returns 409 if locked)
2. Fetch all active_2026=true entities from Postgres (source of truth)
3. Create new timestamped index (e.g., slush_chunks_v2_1234567890)
4. Transform entities to chunk documents (deterministic IDs: entity_id_chunk_index)
5. Bulk index in batches (rolls back on failure: deletes new index, throws error)
6. Atomic alias swap: remove old index from alias, add new index (search uninterrupted)
7. Cleanup old indices (best-effort, warns on failure)
8. Release lock in finally block (always runs, even on error)
Failure guarantees:
- Search alias only updates after successful bulk indexing
- Partial failures never corrupt live search
- Lock always released via finally block
- Deterministic IDs ensure idempotent reindex (no duplicates on retry) */

export async function reindex(): Promise<{
  indexedCount: number;
  chunkCount: number;
  indexName: string;
  alias: string;
  deletedIndices: string[];
}> {
  const lockResult = await pool.query<{ pg_try_advisory_lock: boolean }>(
    'SELECT pg_try_advisory_lock($1)',
    [REINDEX_LOCK_ID]
  );

  const lockAcquired = lockResult.rows[0]?.pg_try_advisory_lock;
  if (!lockAcquired) {
    throw new ReindexAlreadyRunningError();
  }

  try {
    const alias = config.esChunksAlias;
    const newIndexName = `${config.esChunksIndex}_${Date.now()}`;

    const result = await pool.query<Entity>(
      'SELECT * FROM entities WHERE active_2026 = true'
    );
    const entities = result.rows;

    console.log(`Reindex started: ${entities.length} entities to process`);

    await esClient.indices.create({
      index: newIndexName,
      mappings: chunkMapping,
      settings: chunkIndexSettings,
    });

    let totalChunks = 0;

    if (entities.length > 0) {
      const allChunkDocs: Array<{ id: string; doc: ChunkDocument }> = [];

      for (const entity of entities) {
        const chunks = entityToChunkDocuments(entity);
        for (const chunk of chunks) {
          // Deterministic ID: idempotent reindex
          const docId = `${chunk.entity_id}_${chunk.chunk_index}`;
          allChunkDocs.push({ id: docId, doc: chunk });
        }
      }

      totalChunks = allChunkDocs.length;
      console.log(`Generated ${totalChunks} chunks from ${entities.length} entities`);
      // !Bulk index in batches to avoid memory pressure!
      for (let i = 0; i < allChunkDocs.length; i += BULK_BATCH_SIZE) {
        const batch = allChunkDocs.slice(i, i + BULK_BATCH_SIZE);
        const operations = batch.flatMap(({ id, doc }) => [
          { index: { _index: newIndexName, _id: id } },
          doc,
        ]);

        const bulkResponse = await esClient.bulk({ operations, refresh: false });

        if (bulkResponse.errors) {
          const failedItems = bulkResponse.items
            .filter((item) => item.index?.error)
            .slice(0, 5)
            .map((item) => ({
              id: item.index?._id,
              error: item.index?.error?.reason,
            }));

          console.error('Bulk indexing failures (first 5):', JSON.stringify(failedItems, null, 2));

          await esClient.indices.delete({ index: newIndexName });
          throw new Error(`Bulk indexing failed: ${failedItems.length > 0 ? failedItems[0].error : 'unknown error'}`);
        }

        console.log(`Indexed batch ${Math.floor(i / BULK_BATCH_SIZE) + 1}/${Math.ceil(allChunkDocs.length / BULK_BATCH_SIZE)} 
        (${Math.min(i + BULK_BATCH_SIZE, allChunkDocs.length)}/${allChunkDocs.length} chunks)`);
      }

      await esClient.indices.refresh({ index: newIndexName });
    }

    // Atomic alias swap
    const oldIndices: string[] = [];
    const aliasActions: Array<{ remove?: { index: string; alias: string }; add?: { index: string; alias: string } }> = [];

    try {
      const aliasExists = await esClient.indices.existsAlias({ name: alias });
      if (aliasExists) {
        const currentAliases = await esClient.indices.getAlias({ name: alias });
        oldIndices.push(...Object.keys(currentAliases));

        for (const oldIndex of oldIndices) {
          aliasActions.push({ remove: { index: oldIndex, alias } });
        }
      }
    } catch {
      // Alias doesn't exist yet
    }

    aliasActions.push({ add: { index: newIndexName, alias } });
    await esClient.indices.updateAliases({ actions: aliasActions });

    console.log(`Alias ${alias} now points to ${newIndexName}`);

    for (const oldIndex of oldIndices) {
      if (oldIndex !== newIndexName) {
        try {
          await esClient.indices.delete({ index: oldIndex });
          console.log(`Deleted old index: ${oldIndex}`);
        } catch {
          console.warn(`Failed to delete old index ${oldIndex}, manual cleanup may be needed`);
        }
      }
    }

    return {
      indexedCount: entities.length,
      chunkCount: totalChunks,
      indexName: newIndexName,
      alias,
      deletedIndices: oldIndices.filter((i) => i !== newIndexName),
    };
  } finally {
    await pool.query('SELECT pg_advisory_unlock($1)', [REINDEX_LOCK_ID]);
  }
}
