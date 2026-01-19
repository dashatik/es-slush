import { pool } from '../db.js';
import { esClient } from '../es.js';
import { config } from '../config.js';
import { entityMapping, indexSettings } from '../es-mapping.js';
import { Entity, SearchDocument } from '../types.js';

// Unique lock ID for reindex operation (arbitrary but consistent)
const REINDEX_LOCK_ID = 42;

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

export class ReindexAlreadyRunningError extends Error {
  constructor() {
    super('Reindex is already in progress');
    this.name = 'ReindexAlreadyRunningError';
  }
}

export async function reindex(): Promise<{
  indexedCount: number;
  indexName: string;
  alias: string;
  previousIndex: string | null;
}> {
  // Try to acquire advisory lock (non-blocking)
  const lockResult = await pool.query<{ pg_try_advisory_lock: boolean }>(
    'SELECT pg_try_advisory_lock($1)',
    [REINDEX_LOCK_ID]
  );

  const lockAcquired = lockResult.rows[0]?.pg_try_advisory_lock;
  if (!lockAcquired) {
    throw new ReindexAlreadyRunningError();
  }

  try {
    const alias = config.esAlias;
    // Create a unique versioned index name using timestamp
    const newIndexName = `${config.esIndex2026}_${Date.now()}`;

    // 1. Fetch all active entities from Postgres (source of truth)
    const result = await pool.query<Entity>(
      'SELECT * FROM entities WHERE active_2026 = true'
    );
    const entities = result.rows;

    // 2. Create fresh index with mapping and settings (new physical index)
    await esClient.indices.create({
      index: newIndexName,
      mappings: entityMapping,
      settings: indexSettings,
    });

    // 3. Bulk index all documents to the NEW index
    if (entities.length > 0) {
      const operations = entities.flatMap((entity) => {
        const doc = entityToSearchDocument(entity);
        return [
          { index: { _index: newIndexName, _id: entity.id } },
          doc,
        ];
      });

      const bulkResponse = await esClient.bulk({ operations, refresh: true });

      // Check for bulk indexing errors
      if (bulkResponse.errors) {
        // Delete the incomplete index
        await esClient.indices.delete({ index: newIndexName });
        throw new Error('Bulk indexing failed - incomplete index deleted');
      }
    }

    // 4. Atomically swap alias: remove from old index(es), add to new index
    // This ensures search NEVER sees a half-built projection
    let previousIndex: string | null = null;
    const aliasActions: Array<{ remove?: { index: string; alias: string }; add?: { index: string; alias: string } }> = [];

    try {
      const aliasExists = await esClient.indices.existsAlias({ name: alias });
      if (aliasExists) {
        const currentAliases = await esClient.indices.getAlias({ name: alias });
        const oldIndices = Object.keys(currentAliases);

        // Queue removal of alias from all old indices
        for (const oldIndex of oldIndices) {
          aliasActions.push({ remove: { index: oldIndex, alias } });
          previousIndex = oldIndex; // Track for cleanup
        }
      }
    } catch {
      // Alias doesn't exist yet - that's fine
    }

    // Add alias to new index
    aliasActions.push({ add: { index: newIndexName, alias } });

    // Execute atomic alias swap (single API call = atomic)
    await esClient.indices.updateAliases({ actions: aliasActions });

    // 5. Delete old index(es) AFTER successful alias swap
    // At this point, search is already pointing to the new index
    if (previousIndex && previousIndex !== newIndexName) {
      try {
        await esClient.indices.delete({ index: previousIndex });
      } catch {
        // Non-critical: old index cleanup failed, but search is working
        console.warn(`Failed to delete old index ${previousIndex}, manual cleanup may be needed`);
      }
    }

    return {
      indexedCount: entities.length,
      indexName: newIndexName,
      alias,
      previousIndex,
    };
  } finally {
    // Always release the lock
    await pool.query('SELECT pg_advisory_unlock($1)', [REINDEX_LOCK_ID]);
  }
}
