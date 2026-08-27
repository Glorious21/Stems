export type Status = 'idea' | 'demo' | 'mixed' | 'mastered' | 'shelved';

export const STATUSES: Status[] = ['idea', 'demo', 'mixed', 'mastered', 'shelved'];

export interface TrackVersion {
  id: number;
  track_name: string;
  date: string | null;
  genre_mood: string | null;
  bpm: string | null;
  song_key: string | null;
  instruments_samples: string | null;
  status: Status;
  location: string | null;
  canonical: 0 | 1;
  project: string | null;
  version_of: string | null;
  version_number: number;
  notes: string | null;
  created_at: string;
  superseded_at: string | null;
}

export interface Config {
  producer_name: string;
  storage_locations: string[];
  genres_moods: string[];
  daw: string;
}

export interface AppEvent {
  id: number;
  ts: string;
  type: string;
  description: string;
  version_id: number | null;
}

export interface LogInput {
  track_name?: string;
  date?: string;
  genre_mood?: string;
  bpm?: string;
  song_key?: string;
  instruments_samples?: string;
  status?: string;
  location?: string;
  project?: string;
  version_of?: string;
  notes?: string;
  is_new_version?: boolean;
  force_new_track?: boolean;
}

export interface LogResult {
  version: TrackVersion;
  superseded: TrackVersion[];
  is_new_version: boolean;
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
