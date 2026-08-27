import { useState } from 'react';
import { api } from '../api.ts';
import type { SearchHit } from '../types.ts';
import { Empty, Spinner, TrackRow } from '../ui.tsx';

export default function FindView({ onOpen }: { onOpen: (name: string) => void }) {
  const [q, setQ] = useState('');
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [asked, setAsked] = useState('');

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    if (!q.trim()) return;
    setBusy(true);
    setAsked(q.trim());
    try {
      const r = await api.search(q.trim());
      setHits(r.results);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-lg font-semibold text-neutral-100">Find a track</h1>
      <p className="mt-1 text-sm text-neutral-500">Describe it — the mood, a sample, the BPM, who it was for.</p>

      <form onSubmit={run} className="mt-4 flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          autoFocus
          placeholder="the afrobeats one with the talking drum"
          className="w-full rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 py-2 text-sm text-neutral-200 outline-none placeholder:text-neutral-600 focus:border-neutral-600"
        />
        <button
          type="submit"
          disabled={busy || !q.trim()}
          className="shrink-0 rounded-xl bg-amber-500 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-amber-400 disabled:opacity-40"
        >
          Find
        </button>
      </form>

      <div className="mt-5 space-y-3">
        {busy ? (
          <Spinner />
        ) : hits === null ? null : hits.length === 0 ? (
          <Empty>
            Nothing in memory matches "{asked}". I'm not going to guess — try another description, or log it if it's new.
          </Empty>
        ) : (
          <>
            <p className="text-xs text-neutral-600">
              {hits.length} match{hits.length > 1 ? 'es' : ''} for "{asked}" — best first.
            </p>
            {hits.map((h) => (
              <TrackRow key={h.track.id} track={h.track} onOpen={onOpen} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
