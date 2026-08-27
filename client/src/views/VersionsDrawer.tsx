import { useEffect, useState } from 'react';
import { api } from '../api.ts';
import type { TrackVersion } from '../types.ts';
import { LocationTag, Spinner, StatusPill, fmtDate } from '../ui.tsx';

export default function VersionsDrawer({ name, onClose }: { name: string; onClose: () => void }) {
  const [versions, setVersions] = useState<TrackVersion[] | null>(null);

  useEffect(() => {
    setVersions(null);
    api.versions(name).then(setVersions);
  }, [name]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/50" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto border-l border-neutral-800 bg-neutral-950 p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-base font-semibold text-neutral-100">{name}</h2>
            <p className="text-xs text-neutral-500">
              {versions ? `${versions.length} version${versions.length > 1 ? 's' : ''} in memory` : 'loading…'}
            </p>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-neutral-500 hover:bg-neutral-900 hover:text-neutral-300">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="mt-5">
          {!versions ? (
            <Spinner />
          ) : versions.length === 0 ? (
            <p className="text-sm text-neutral-500">Nothing logged for that name.</p>
          ) : (
            <ol className="relative space-y-4 border-l border-neutral-800 pl-5">
              {versions.map((v) => (
                <li key={v.id} className="relative">
                  <span
                    className={`absolute -left-[27px] top-1.5 h-3 w-3 rounded-full ring-4 ring-neutral-950 ${
                      v.canonical ? 'bg-amber-400' : 'bg-neutral-700'
                    }`}
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-neutral-200">v{v.version_number}</span>
                    <StatusPill status={v.status} />
                    {v.canonical ? (
                      <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-300">
                        canonical
                      </span>
                    ) : (
                      <span className="text-[11px] text-neutral-600">superseded {fmtDate(v.superseded_at)}</span>
                    )}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {[v.genre_mood, v.bpm ? `${v.bpm} BPM` : null, v.song_key, fmtDate(v.date)].filter(Boolean).join('  ·  ')}
                  </div>
                  <div className="mt-2">
                    <LocationTag location={v.location} />
                  </div>
                  {v.instruments_samples ? (
                    <p className="mt-2 text-xs text-neutral-500">
                      <span className="text-neutral-600">samples:</span> {v.instruments_samples}
                    </p>
                  ) : null}
                  {v.notes ? <p className="mt-1 text-sm text-neutral-400">{v.notes}</p> : null}
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
}
