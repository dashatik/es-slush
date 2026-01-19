import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import healthRouter from './routes/health.js';
import adminRouter from './routes/admin.js';
import searchRouter from './routes/search.js';
import facetsRouter from './routes/facets.js';

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use(healthRouter);
app.use(adminRouter);
app.use(searchRouter);
app.use(facetsRouter);

app.listen(config.port, () => {
  console.log(`API server running on port ${config.port}`);
});
