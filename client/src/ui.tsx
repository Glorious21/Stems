import { useState, type ReactNode } from 'react';
import type { Status, TrackVersion } from './types.ts';

const STATUS_STYLES: Record<Status, string> = {
  idea: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
  demo: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  mixed: 'bg-violet-500/15 text-violet-300 ring-violet-500/30',
  mastered: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  shelved: 'bg-neutral-500/15 text-neutral-400 ring-neutral-500/30',
};

export function StatusPill({ status }: { status: Status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  );
}

export function LocationTag({ location }: { location: string | null }) {
  const [copied, setCopied] = useState(false);
  if (!location) {
    return <span className="text-xs text-neutral-500 italic">no location logged</span>;
  }
  const dim = location.toLowerCase() === 'not yet saved';
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(location);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        } catch {
          /* clipboard unavailable — no-op */
        }
      }}
      title="Copy location"
      className={`group inline-flex max-w-full items-center gap-1.5 rounded-md border border-neutral-800 bg-neutral-900/80 px-2 py-1 font-mono text-xs ${
        dim ? 'text-neutral-500' : 'text-neutral-300'
      } hover:border-neutral-700`}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="shrink-0 text-neutral-500">
        <path d="M3 7l9 5 9-5-9-5-9 5zM3 7v10l9 5 9-5V7" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
      <span className="truncate">{copied ? 'copied' : location}</span>
    </button>
  );
}

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-neutral-800 bg-neutral-900/50 p-4 ${
        onClick ? 'cursor-pointer transition-colors hover:border-neutral-700 hover:bg-neutral-900' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-800 px-6 py-12 text-center text-sm text-neutral-500">
      {children}
    </div>
  );
}

export function Spinner() {
  return (
    <div className="flex justify-center py-12">
      <div className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-700 border-t-amber-400" />
    </div>
  );
}

export function TrackMeta({ track }: { track: TrackVersion }) {
  const bits = [
    track.genre_mood,
    track.bpm ? `${track.bpm} BPM` : null,
    track.song_key,
    track.version_number > 1 ? `v${track.version_number}` : null,
  ].filter(Boolean);
  if (!bits.length) return null;
  return <div className="text-xs text-neutral-500">{bits.join('  ·  ')}</div>;
}

export function TrackRow({ track, onOpen }: { track: TrackVersion; onOpen?: (name: string) => void }) {
  return (
    <Card onClick={onOpen ? () => onOpen(track.track_name) : undefined}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-neutral-100">{track.track_name}</span>
            <StatusPill status={track.status} />
          </div>
          <div className="mt-1">
            <TrackMeta track={track} />
          </div>
          {track.notes ? <p className="mt-2 line-clamp-2 text-sm text-neutral-400">{track.notes}</p> : null}
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <LocationTag location={track.location} />
        {track.project ? (
          <span className="rounded-md bg-neutral-800/70 px-2 py-1 text-xs text-neutral-400">{track.project}</span>
        ) : null}
      </div>
    </Card>
  );
}

export function fmtDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function ago(iso: string | null): string {
  if (!iso) return '';
  const then = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso).getTime();
  if (Number.isNaN(then)) return '';
  const days = Math.floor((Date.now() - then) / 86_400_000);
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 30) return `${days}d ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
