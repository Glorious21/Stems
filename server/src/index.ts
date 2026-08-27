import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import express from 'express';
import * as store from './db.ts';
import { HttpError } from './types.ts';
import { parseText } from './parse.ts';

const here = dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors());
app.use(express.json());

const api = express.Router();

api.get('/health', (_req, res) => {
  res.json({ ok: true });
});

api.get('/config', (_req, res) => {
  res.json(store.getConfig());
});

api.put('/config', (req, res) => {
  res.json(store.setConfig(req.body ?? {}));
});

api.post('/parse', (req, res) => {
  const cfg = store.getConfig();
  const parsed = parseText(String(req.body?.text ?? ''), {
    genres: cfg.genres_moods,
    locations: cfg.storage_locations,
  });
  res.json(parsed);
});

api.get('/stats', (_req, res) => {
  res.json(store.stats());
});

api.get('/events', (req, res) => {
  res.json(store.recentEvents(Number(req.query.limit)));
});

api.get('/tracks', (_req, res) => {
  res.json(store.allTracks());
});

api.post('/tracks', (req, res) => {
  res.json(store.logTrack(req.body ?? {}));
});

api.get('/tracks/search', (req, res) => {
  const q = String(req.query.q ?? '');
  res.json({ query: q, results: store.search(q) });
});

api.get('/tracks/:name/versions', (req, res) => {
  res.json(store.versionsOf(req.params.name));
});

api.get('/unfinished', (_req, res) => {
  res.json(store.unfinished());
});

api.get('/archivable', (_req, res) => {
  res.json(store.archivable());
});

api.get('/projects', (_req, res) => {
  res.json(store.projects());
});

api.get('/projects/:name', (req, res) => {
  res.json(store.projectDetail(req.params.name));
});

app.use('/api', api);

// Serve the built client if it exists (production / single-process mode).
const clientDist = join(here, '..', '..', 'client', 'dist');
if (existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(join(clientDist, 'index.html'));
  });
}

// Error handler — keep last.
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err instanceof HttpError ? err.status : 500;
  const message = err instanceof Error ? err.message : 'Something went wrong';
  if (status >= 500) console.error(err);
  res.status(status).json({ error: message });
});

const PORT = Number(process.env.PORT) || 3001;
app.listen(PORT, () => {
  console.log(`Stems API listening on http://localhost:${PORT}`);
});
