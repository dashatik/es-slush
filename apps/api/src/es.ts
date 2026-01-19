import { Client } from '@elastic/elasticsearch';
import { config } from './config.js';

/*ES client with retry logic for transient connection failures
maxRetries: 3 attempts before failing
requestTimeout: 10s per request
pingTimeout: 3s for health checks*/

export const esClient = new Client({
  node: config.elasticsearchUrl,
  maxRetries: 3,
  requestTimeout: 10000,
  pingTimeout: 3000,
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
