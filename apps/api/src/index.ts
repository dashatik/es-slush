import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import healthRouter from './routes/health.js';
import adminRouter from './routes/admin.js';
import searchRouter from './routes/search.js';
import facetsRouter from './routes/facets.js';
import entityRouter from './routes/entity.js';

/* Slush Discovery Search API
Routes: health, admin (reindex), search, facets, entity */

const app = express();

app.use(cors());
app.use(express.json());

app.use(healthRouter);
app.use(adminRouter);
app.use(searchRouter);
app.use(facetsRouter);
app.use(entityRouter);

app.listen(config.port, () => {
  console.log(`API server running on port ${config.port}`);
});
