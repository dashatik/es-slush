import { Client } from '@elastic/elasticsearch';
import { config } from './config.js';

export const esClient = new Client({
  node: config.elasticsearchUrl,
});

export async function checkElasticsearchHealth(): Promise<boolean> {
  try {
    const result = await esClient.ping();
    return result === true;
  } catch (error) {
    console.error('Elasticsearch health check failed:', error);
    return false;
  }
}
