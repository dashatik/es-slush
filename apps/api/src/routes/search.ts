import { Router } from 'express';
import { search } from '../services/search.js';

const router = Router();

router.get('/search', async (req, res) => {
  try {
    const { q, type, industry, country, stage } = req.query;

    const results = await search({
      q: typeof q === 'string' ? q : undefined,
      type: typeof type === 'string' ? type : undefined,
      industry: industry as string | string[] | undefined,
      country: country as string | string[] | undefined,
      stage: stage as string | string[] | undefined,
    });

    res.json(results);
  } catch (error) {
    console.error('Search failed:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
