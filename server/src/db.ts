// Silence the "SQLite is an experimental feature" notice before node:sqlite loads.
const _emitWarning = process.emitWarning.bind(process);
process.emitWarning = ((warning: unknown, ...rest: unknown[]) => {
  const type =
    typeof rest[0] === 'string'
      ? rest[0]
      : rest[0] && typeof rest[0] === 'object'
        ? (rest[0] as { type?: string }).type
        : (warning as { name?: string })?.name;
  if (type === 'ExperimentalWarning' && String(warning).includes('SQLite')) return;
  return (_emitWarning as (...a: unknown[]) => void)(warning, ...rest);
}) as typeof process.emitWarning;

import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  HttpError,
  STATUSES,
  type AppEvent,
  type Config,
  type LogInput,
  type LogResult,
  type Status,
  type TrackVersion,
} from './types.ts';

export { HttpError };

// Loaded dynamically so the warning hook above is in place first.
const { DatabaseSync } = await import('node:sqlite');

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = join(here, '..', 'data');
mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(join(dataDir, 'stems.db'));

db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS track_versions (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    track_name          TEXT    NOT NULL,
    date                TEXT,
    genre_mood          TEXT,
    bpm                 TEXT,
    song_key            TEXT,
    instruments_samples TEXT,
    status              TEXT    NOT NULL DEFAULT 'idea',
    location            TEXT,
    canonical           INTEGER NOT NULL DEFAULT 1,
    project             TEXT,
    version_of          TEXT,
    version_number      INTEGER NOT NULL DEFAULT 1,
    notes               TEXT,
    created_at          TEXT    NOT NULL,
    superseded_at       TEXT
  );

  CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    ts          TEXT NOT NULL,
    type        TEXT NOT NULL,
    description TEXT NOT NULL,
    version_id  INTEGER
  );

  CREATE TABLE IF NOT EXISTS config (
    id                INTEGER PRIMARY KEY CHECK (id = 1),
    producer_name     TEXT,
    storage_locations TEXT,
    genres_moods      TEXT,
    daw               TEXT
  );

  INSERT OR IGNORE INTO config (id, producer_name, storage_locations, genres_moods, daw)
  VALUES (1, '', '[]', '[]', '');
`);

// ---------- typed query wrappers ----------
// node:sqlite returns loose Record shapes; our schema is fixed, so we assert.

function queryAll<T>(sql: string, ...params: unknown[]): T[] {
  return db.prepare(sql).all(...(params as never[])) as unknown as T[];
}
function queryOne<T>(sql: string, ...params: unknown[]): T | undefined {
  return db.prepare(sql).get(...(params as never[])) as unknown as T | undefined;
}
function run(sql: string, ...params: unknown[]) {
  return db.prepare(sql).run(...(params as never[]));
}

// ---------- helpers ----------

function nn(v: unknown): string | null {
  const s = (v ?? '').toString().trim();
  return s ? s : null;
}

function jsonArray(raw: unknown): string[] {
  try {
    const v = JSON.parse(String(raw ?? '[]'));
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim()) : [];
  } catch {
    return [];
  }
}

function countByStatus(rows: TrackVersion[]): Record<Status, number> {
  const out: Record<Status, number> = { idea: 0, demo: 0, mixed: 0, mastered: 0, shelved: 0 };
  for (const r of rows) out[r.status] = (out[r.status] ?? 0) + 1;
  return out;
}

export function logEvent(type: string, description: string, versionId: number | null = null): void {
  run(
    'INSERT INTO events (ts, type, description, version_id) VALUES (?, ?, ?, ?)',
    new Date().toISOString(),
    type,
    description,
    versionId,
  );
}

// ---------- config ----------

export function getConfig(): Config {
  const r = queryOne<Record<string, unknown>>('SELECT * FROM config WHERE id = 1') ?? {};
  return {
    producer_name: String(r.producer_name ?? ''),
    storage_locations: jsonArray(r.storage_locations),
    genres_moods: jsonArray(r.genres_moods),
    daw: String(r.daw ?? ''),
  };
}

export function setConfig(input: Partial<Config>): Config {
  const current = getConfig();
  const next: Config = {
    producer_name: (input.producer_name ?? current.producer_name).toString().trim(),
    storage_locations: Array.isArray(input.storage_locations)
      ? input.storage_locations.map((s) => String(s).trim()).filter(Boolean)
      : current.storage_locations,
    genres_moods: Array.isArray(input.genres_moods)
      ? input.genres_moods.map((s) => String(s).trim()).filter(Boolean)
      : current.genres_moods,
    daw: (input.daw ?? current.daw).toString().trim(),
  };
  run(
    'UPDATE config SET producer_name = ?, storage_locations = ?, genres_moods = ?, daw = ? WHERE id = 1',
    next.producer_name,
    JSON.stringify(next.storage_locations),
    JSON.stringify(next.genres_moods),
    next.daw,
  );
  return next;
}

// ---------- write ----------

export function logTrack(input: LogInput): LogResult {
  const now = new Date().toISOString();
  const name = (input.track_name ?? '').trim();
  if (!name) throw new HttpError(400, 'A track needs a name.');

  const status: Status = (STATUSES as string[]).includes(String(input.status))
    ? (input.status as Status)
    : 'idea';

  const location = nn(input.location);
  if (!location && status !== 'idea') {
    throw new HttpError(422, 'Where did it land? Add a storage location, or log it as an idea.');
  }

  const existing = queryAll<TrackVersion>(
    'SELECT * FROM track_versions WHERE lower(track_name) = lower(?) ORDER BY version_number DESC',
    name,
  );

  const isVersion = existing.length > 0 && !input.force_new_track;
  const versionNumber = isVersion ? existing[0].version_number + 1 : 1;
  const versionOf = isVersion ? existing[0].version_of ?? existing[0].track_name : null;

  const info = run(
    `INSERT INTO track_versions
      (track_name, date, genre_mood, bpm, song_key, instruments_samples, status, location,
       canonical, project, version_of, version_number, notes, created_at, superseded_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, NULL)`,
    name,
    nn(input.date) ?? now.slice(0, 10),
    nn(input.genre_mood),
    nn(input.bpm),
    nn(input.song_key),
    nn(input.instruments_samples),
    status,
    location,
    nn(input.project),
    versionOf,
    versionNumber,
    nn(input.notes),
    now,
  );

  const newId = Number(info.lastInsertRowid);

  let superseded: TrackVersion[] = [];
  if (isVersion) {
    superseded = queryAll<TrackVersion>(
      'SELECT * FROM track_versions WHERE lower(track_name) = lower(?) AND id != ? AND canonical = 1',
      name,
      newId,
    );
    run(
      'UPDATE track_versions SET canonical = 0, superseded_at = ? WHERE lower(track_name) = lower(?) AND id != ?',
      now,
      name,
      newId,
    );
    const list = superseded.map((s) => `v${s.version_number}`).join(', ') || 'earlier work';
    logEvent(
      'supersession',
      `v${versionNumber} of "${name}" supersedes ${list} — ${superseded.length > 1 ? 'those files' : 'that file'} now safe to archive`,
      newId,
    );
  }

  logEvent(
    'logged',
    `Logged "${name}"${isVersion ? ` v${versionNumber}` : ''} — ${status}${location ? ` @ ${location}` : ''}`,
    newId,
  );

  const version = queryOne<TrackVersion>('SELECT * FROM track_versions WHERE id = ?', newId)!;
  return { version, superseded, is_new_version: isVersion };
}

// ---------- read ----------

export function allTracks(): TrackVersion[] {
  return queryAll<TrackVersion>(
    'SELECT * FROM track_versions WHERE canonical = 1 ORDER BY datetime(created_at) DESC',
  );
}

export function search(q: string): { track: TrackVersion; score: number }[] {
  const query = (q ?? '').toLowerCase().trim();
  if (!query) return [];
  const tokens = query.split(/[^a-z0-9#]+/i).filter((t) => t.length > 1);
  const rows = queryAll<TrackVersion>('SELECT * FROM track_versions WHERE canonical = 1');

  return rows
    .map((track) => {
      const nameL = track.track_name.toLowerCase();
      const hay = [
        track.genre_mood,
        track.bpm,
        track.song_key,
        track.instruments_samples,
        track.notes,
        track.project,
        track.location,
        track.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const deep = [track.notes, track.instruments_samples, track.genre_mood].filter(Boolean).join(' ').toLowerCase();

      let score = 0;
      if (nameL.includes(query)) score += 6;
      if (deep.includes(query)) score += 3;
      for (const tok of tokens) {
        if (nameL.includes(tok)) score += 4;
        else if (hay.includes(tok)) score += 2;
      }
      return { track, score };
    })
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

export function versionsOf(name: string): TrackVersion[] {
  return queryAll<TrackVersion>(
    'SELECT * FROM track_versions WHERE lower(track_name) = lower(?) ORDER BY version_number ASC, id ASC',
    name,
  );
}

export function unfinished(): TrackVersion[] {
  return queryAll<TrackVersion>(
    `SELECT * FROM track_versions
     WHERE canonical = 1 AND status IN ('idea', 'demo')
     ORDER BY COALESCE(NULLIF(date, ''), substr(created_at, 1, 10)) ASC, id ASC`,
  );
}

export function archivable(): TrackVersion[] {
  return queryAll<TrackVersion>(
    'SELECT * FROM track_versions WHERE canonical = 0 ORDER BY datetime(superseded_at) DESC, id DESC',
  );
}

export function projects(): { name: string; total: number; counts: Record<Status, number> }[] {
  const rows = queryAll<TrackVersion>(
    `SELECT * FROM track_versions WHERE canonical = 1 AND project IS NOT NULL AND trim(project) != ''`,
  );
  const map = new Map<string, TrackVersion[]>();
  for (const r of rows) {
    const key = r.project as string;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return [...map.entries()]
    .map(([name, tracks]) => ({ name, total: tracks.length, counts: countByStatus(tracks) }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function projectDetail(name: string): {
  name: string;
  total: number;
  groups: Record<Status, TrackVersion[]>;
  tracks: TrackVersion[];
} {
  const tracks = queryAll<TrackVersion>(
    `SELECT * FROM track_versions
     WHERE canonical = 1 AND lower(project) = lower(?)
     ORDER BY track_name ASC`,
    name,
  );
  const groups: Record<Status, TrackVersion[]> = { idea: [], demo: [], mixed: [], mastered: [], shelved: [] };
  for (const t of tracks) groups[t.status].push(t);
  return { name, total: tracks.length, groups, tracks };
}

export function recentEvents(limit = 40): AppEvent[] {
  const n = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 200) : 40;
  return queryAll<AppEvent>('SELECT * FROM events ORDER BY id DESC LIMIT ?', n);
}

export function stats(): { tracks: number; unfinished: number; archivable: number; projects: number } {
  const one = (sql: string): number => Number(queryOne<{ n: number }>(sql)?.n ?? 0);
  return {
    tracks: one('SELECT COUNT(*) n FROM track_versions WHERE canonical = 1'),
    unfinished: one(`SELECT COUNT(*) n FROM track_versions WHERE canonical = 1 AND status IN ('idea','demo')`),
    archivable: one('SELECT COUNT(*) n FROM track_versions WHERE canonical = 0'),
    projects: one(
      `SELECT COUNT(DISTINCT lower(project)) n FROM track_versions
       WHERE canonical = 1 AND project IS NOT NULL AND trim(project) != ''`,
    ),
  };
}
