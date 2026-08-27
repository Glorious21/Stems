import type {
  AppEvent,
  Config,
  LogResult,
  ParsedTrack,
  ProjectDetail,
  ProjectSummary,
  SearchHit,
  Stats,
  TrackVersion,
} from './types.ts';

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    throw new Error((data && data.error) || `Request failed (${res.status})`);
  }
  return data as T;
}

export interface LogBody {
  track_name?: string;
  date?: string;
  genre_mood?: string;
  bpm?: string;
  song_key?: string;
  instruments_samples?: string;
  status?: string;
  location?: string;
  project?: string;
  notes?: string;
  is_new_version?: boolean;
  force_new_track?: boolean;
}

export const api = {
  getConfig: () => req<Config>('/config'),
  saveConfig: (c: Config) => req<Config>('/config', { method: 'PUT', body: JSON.stringify(c) }),
  parse: (text: string) => req<ParsedTrack>('/parse', { method: 'POST', body: JSON.stringify({ text }) }),
  stats: () => req<Stats>('/stats'),
  events: (limit = 40) => req<AppEvent[]>(`/events?limit=${limit}`),
  tracks: () => req<TrackVersion[]>('/tracks'),
  log: (body: LogBody) => req<LogResult>('/tracks', { method: 'POST', body: JSON.stringify(body) }),
  search: (q: string) => req<{ query: string; results: SearchHit[] }>(`/tracks/search?q=${encodeURIComponent(q)}`),
  versions: (name: string) => req<TrackVersion[]>(`/tracks/${encodeURIComponent(name)}/versions`),
  unfinished: () => req<TrackVersion[]>('/unfinished'),
  archivable: () => req<TrackVersion[]>('/archivable'),
  projects: () => req<ProjectSummary[]>('/projects'),
  project: (name: string) => req<ProjectDetail>(`/projects/${encodeURIComponent(name)}`),
};
