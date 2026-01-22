import { Router } from 'express';
import { config } from '../config.js';
import { reindex, ReindexAlreadyRunningError } from '../services/reindex.js';

const router = Router();

router.post('/admin/reindex', async (req, res) => {
  try {
    /* In production ADMIN_TOKEN is required */
    const isProd = config.nodeEnv === 'production';

    if (isProd) {
      const token = req.header('x-admin-token');
      if (!config.adminToken || token !== config.adminToken) {
        res.status(403).json({
          error: 'Forbidden',
          message: 'Reindex requires valid admin token in production',
        });
        return;
      }
    }

    const result = await reindex();
    res.json(result);
  } catch (error) {
    if (error instanceof ReindexAlreadyRunningError) {
      res.status(409).json({
        error: 'Conflict',
        message: error.message,
      });
      return;
    }

    console.error('Reindex failed:', error);
    res.status(500).json({
      error: 'Reindex failed',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
